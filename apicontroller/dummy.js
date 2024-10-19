const { mysqlQuery } = require('../utilityclient.js')
const ALLOWED_UPDATE_KEYS = [
    "blockCode",
    "blockLocation",
    "isActive"
]

async function readBlocks(req, res) {
    const mysqlClient = req.app.mysqlClient
    const limit = req.query.limit ? parseInt(req.query.limit) : null;
    const page = req.query.page ? parseInt(req.query.page) : null;
    const offset = limit && page ? (page - 1) * limit : null;
    const orderBy = req.query.orderby || 'bk.blockCode';
    const sort = req.query.sort || 'ASC';
    const searchQuery = req.query.search || '';
    const searchPattern = `%${searchQuery}%`;
    const status = req.query.isActive;

    var blocksQuery = /*sql*/`
        SELECT 
            bk.*,
            w.firstName AS createdFirstName,
            w.lastName AS createdLastName,
            w2.firstName AS updatedFirstName,
            w2.lastName AS updatedLastName,
            DATE_FORMAT(bk.createdAt, "%y-%b-%D %r") AS createdTimeStamp,
            DATE_FORMAT(bk.updatedAt, "%y-%b-%D %r") AS updatedTimeStamp
            FROM block AS bk
        LEFT JOIN 
            warden AS w ON w.wardenId = bk.createdBy
        LEFT JOIN 
            warden AS w2 ON w2.wardenId = bk.updatedBy
        WHERE 
            bk.deletedAt IS NULL AND 
            (bk.blockCode LIKE ? OR 
            w.firstName LIKE ? OR 
            w.lastName LIKE ? OR 
            w2.firstName LIKE ? OR 
            w2.lastName LIKE ?)`

    if (status !== undefined) {
        blocksQuery += ` AND bk.isActive = 1`;
    }

    blocksQuery += ` ORDER BY ${orderBy} ${sort}`;

    if (limit && offset !== null) {
        blocksQuery += ` LIMIT ? OFFSET ?`;
    }

    const countQuery = /*sql*/ `
        SELECT COUNT(*) AS totalBlockCount 
        FROM block 
        WHERE deletedAt IS NULL`;

    try {
        const [blocks, totalCount] = await Promise.all([
            mysqlQuery(blocksQuery, [searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, limit, offset], mysqlClient),
            mysqlQuery(countQuery, [], mysqlClient)
        ]);

        res.status(200).send({
            blocks: blocks,
            blockCount: totalCount[0].totalBlockCount
        });

    } catch (error) {
        res.status(500).send(error.message)
    }
}

async function readBlockById(req, res) {
    const mysqlClient = req.app.mysqlClient;
    const blockId = req.params.blockId;
    try {
        const block = await mysqlQuery(/*sql*/`
             SELECT 
                bk.*,
                w.firstName AS createdFirstName,
                w.lastName AS createdLastName,
                w2.firstName AS updatedFirstName,
                w2.lastName AS updatedLastName,
                DATE_FORMAT(bk.createdAt, "%y-%b-%D %r") AS createdTimeStamp,
                DATE_FORMAT(bk.updatedAt, "%y-%b-%D %r") AS updatedTimeStamp
                FROM block AS bk
            LEFT JOIN 
                warden AS w ON w.wardenId = bk.createdBy
            LEFT JOIN 
                warden AS w2 ON w2.wardenId = bk.updatedBy
            WHERE 
                bk.deletedAt IS NULL AND blockId = ?`,
            [blockId],
            mysqlClient
        )
        if (block.length === 0) {
            return res.status(404).send("blockId not valid");
        }
        res.status(200).send(block[0])
    } catch (error) {
        res.status(500).send(error.message)
    }
}

async function createBlock(req, res) {
    const mysqlClient = req.app.mysqlClient;
    const {
        blockCode,
        blockLocation,
        isActive
    } = req.body
    const createdBy = req.session.data.wardenId;

    const isValidInsert = validateInsert(req.body);
    if (isValidInsert.length > 0) {
        return res.status(400).send(isValidInsert)
    }

    try {
        const existingBlockCode = await mysqlQuery(/*sql*/`SELECT * FROM block WHERE blockCode = ? AND deletedAt IS NULL`,
            [blockCode],
            mysqlClient
        );
        if (existingBlockCode.length > 0) {
            return res.status(409).send("blockCode already exists");
        }

        const newBlock = await mysqlQuery(/*sql*/`INSERT INTO BLOCK(blockCode, blockLocation, isActive, createdBy) VALUES(?,?,?,?)`,
            [blockCode, blockLocation, isActive, createdBy], mysqlClient)
        if (newBlock.affectedRows === 0) {
            res.status(400).send("no insert was made")
        } else {
            res.status(201).send('insert successfully')
        }
    } catch (error) {
        res.status(500).send(error.message)
    }
}

async function updateBlockById(req, res) {
    const blockId = req.params.blockId;
    const updatedBy = req.session.data.wardenId;
    const values = []
    const updates = []

    ALLOWED_UPDATE_KEYS.forEach((key) => {
        const keyValue = req.body[key]
        if (keyValue !== undefined) {
            values.push(keyValue)
            updates.push(` ${key} = ? `)
        }
    })

    updates.push("updatedBy = ?")
    values.push(updatedBy, blockId)
    const mysqlClient = req.app.mysqlClient
    const blockCode = req.body.blockCode;

    try {
        const block = await validateBlockById(blockId, mysqlClient);
        if (!block) {
            return res.status(404).send("Block not found or already deleted");
        }

        if (blockCode) {
            const isBlockUnique = await mysqlQuery(/*sql*/`
                SELECT * FROM block 
                WHERE blockCode = ? AND blockId != ? AND deletedAt IS NULL`,
                [blockCode, blockId], mysqlClient);

            if (isBlockUnique.length > 0) {
                return res.status(409).send("blockCode already exists");
            }
        }

        const isValid = await validateUpdateBlock(blockId, mysqlClient, req.body)
        if (!isValid) {
            return res.status(409).send("students in block shift to another block");
        }

        const isValidInsert = validateInsert(req.body, true, blockId, mysqlClient);
        if (isValidInsert.length > 0) {
            return res.status(400).send(isValidInsert)
        }

        const isUpdate = await mysqlQuery(/*sql*/`UPDATE block SET  ${updates.join(', ')} WHERE blockId = ? AND deletedAt IS NULL`,
            values, mysqlClient
        )
        if (isUpdate.affectedRows === 0) {
            res.status(204).send("Block not found or no changes made")
        }

        const getUpdatedBlock = await mysqlQuery(/*sql*/`SELECT * FROM block WHERE blockId = ? `,
            [blockId], mysqlClient)
        res.status(200).send({
            status: 'successfull',
            data: getUpdatedBlock[0]
        })
    }
    catch (error) {
        res.status(500).send(error.message)
    }
}

async function deleteBlockById(req, res) {
    const blockId = req.params.blockId;
    const mysqlClient = req.app.mysqlClient;
    const deletedBy = req.session.data.wardenId;

    try {
        const isValid = await validateBlockById(blockId, mysqlClient)
        if (!isValid) {
            return res.status(404).send("blockId is not defined")
        }

        const deletedBlock = await mysqlQuery(/*sql*/`UPDATE block SET deletedAt = NOW(),
            deletedBy = ? WHERE blockId = ? AND deletedAt IS NULL`,
            [deletedBy, blockId],
            mysqlClient)
        if (deletedBlock.affectedRows === 0) {
            return res.status(404).send("Block not found or already deleted")
        }

        const getDeletedBlock = await mysqlQuery(/*sql*/`SELECT * FROM block WHERE blockId = ? `, [blockId], mysqlClient)
        res.status(200).send({
            status: 'deleted',
            data: getDeletedBlock[0]
        });
    }
    catch (error) {
        res.status(500).send(error.message)
    }
}

function getBlockById(blockId, mysqlClient) {
    return new Promise((resolve, reject) => {
        mysqlClient.query(/*sql*/`SELECT * FROM block WHERE blockId = ? `, [blockId], (err, block) => {
            if (err) {
                return reject(err)
            }
            resolve(block.length ? block[0] : null)

        })
    })
}

async function validateBlockById(blockId, mysqlClient) {
    var block = await getBlockById(blockId, mysqlClient)
    if (block !== null) {
        return true
    }
    return false
}

async function validateInsert(body, isUpdate = false, blockId, mysqlClient) {
    const {
        blockCode,
        blockLocation,
        isActive
    } = body

    const errors = []

    if (blockCode !== undefined) {
        if (blockCode.length < 1) {
            errors.push("BockCode is invalid")
        } else if (!isUpdate) {
            try {
            var isValidBlockCode = await mysqlQuery(/*sql*/`SELECT COUNT(*) AS count FROM block WHERE blockCode = ? AND blockId != ?
            AND deletedAt is NULL`, [blockCode, blockId], mysqlClient)
            // console.log(isValidBlockCode)
            // console.log('aaaaaaaaaaaaaaaaaaaaaaaa11')
                if (isValidBlockCode[count] > 0) {
                    errors.push("BlockCode is already Exits")
                }
            } catch (error) {
                console.log(error)
            }                    
        }
    } else {
        errors.push("BlockCode is missing")
    }

    if (blockLocation !== undefined) {
        if (blockLocation <= 0) {
            errors.push("location is invalid")
        }
    } else {
        errors.push("location is missing")
    }

    if (isActive !== undefined) {
        if (![0, 1].includes(isActive)) {
            errors.push("isActive is invalid")
        }
    } else {
        errors.push("isActive is missing")
    }
    return errors
}

function getBlockFloorCountByBlockId(blockId, mysqlClient) {
    return new Promise((resolve, reject) => {
        mysqlClient.query(/*sql*/`SELECT count(*) AS count FROM blockfloor WHERE blockId = ? AND deletedAt IS NULL`,
            [blockId],
            (err, blockIdCount) => {
                if (err) {
                    return reject(err)
                }
                resolve(blockIdCount)
            })
    })
}

async function validateUpdateBlock(blockId, mysqlClient, body) {
    if (body.isActive === 0) {
        var [blockFloorBlock] = await getBlockFloorCountByBlockId(blockId, mysqlClient)
        if (blockFloorBlock.count > 0) {
            return false
        }
    }
    return true
}

module.exports = (app) => {
    app.get('/api/block', readBlocks)
    app.get('/api/block/:blockId', readBlockById)
    app.post('/api/block', createBlock)
    app.put('/api/block/:blockId', updateBlockById)
    app.delete('/api/block/:blockId', deleteBlockById)
}


>>>>>>>>>>>>>>


const { mysqlQuery } = require('../utilityclient.js')
const ALLOWED_UPDATE_KEYS = [
    "blockCode",
    "blockLocation",
    "isActive"
]

async function readBlocks(req, res) {
    const mysqlClient = req.app.mysqlClient
    const limit = req.query.limit ? parseInt(req.query.limit) : null;
    const page = req.query.page ? parseInt(req.query.page) : null;
    const offset = limit && page ? (page - 1) * limit : null;
    const orderBy = req.query.orderby || 'bk.blockCode';
    const sort = req.query.sort || 'ASC';
    const searchQuery = req.query.search || '';
    const searchPattern = `%${searchQuery}%`;
    const status = req.query.isActive;

    var blocksQuery = /*sql*/`
        SELECT 
            bk.*,
            w.firstName AS createdFirstName,
            w.lastName AS createdLastName,
            w2.firstName AS updatedFirstName,
            w2.lastName AS updatedLastName,
            DATE_FORMAT(bk.createdAt, "%y-%b-%D %r") AS createdTimeStamp,
            DATE_FORMAT(bk.updatedAt, "%y-%b-%D %r") AS updatedTimeStamp
            FROM block AS bk
        LEFT JOIN 
            warden AS w ON w.wardenId = bk.createdBy
        LEFT JOIN 
            warden AS w2 ON w2.wardenId = bk.updatedBy
        WHERE 
            bk.deletedAt IS NULL AND 
            (bk.blockCode LIKE ? OR 
            w.firstName LIKE ? OR 
            w.lastName LIKE ? OR 
            w2.firstName LIKE ? OR 
            w2.lastName LIKE ?)`

    if (status !== undefined) {
        blocksQuery += ` AND bk.isActive = 1`;
    }

    blocksQuery += ` ORDER BY ${orderBy} ${sort}`;

    if (limit && offset !== null) {
        blocksQuery += ` LIMIT ? OFFSET ?`;
    }

    const countQuery = /*sql*/ `
        SELECT COUNT(*) AS totalBlockCount 
        FROM block 
        WHERE deletedAt IS NULL`;

    try {
        const [blocks, totalCount] = await Promise.all([
            mysqlQuery(blocksQuery, [searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, limit, offset], mysqlClient),
            mysqlQuery(countQuery, [], mysqlClient)
        ]);

        res.status(200).send({
            blocks: blocks,
            blockCount: totalCount[0].totalBlockCount
        });

    } catch (error) {
        res.status(500).send(error.message)
    }
}

async function readBlockById(req, res) {
    const mysqlClient = req.app.mysqlClient;
    const blockId = req.params.blockId;
    try {
        const block = await mysqlQuery(/*sql*/`
             SELECT 
                bk.*,
                w.firstName AS createdFirstName,
                w.lastName AS createdLastName,
                w2.firstName AS updatedFirstName,
                w2.lastName AS updatedLastName,
                DATE_FORMAT(bk.createdAt, "%y-%b-%D %r") AS createdTimeStamp,
                DATE_FORMAT(bk.updatedAt, "%y-%b-%D %r") AS updatedTimeStamp
                FROM block AS bk
            LEFT JOIN 
                warden AS w ON w.wardenId = bk.createdBy
            LEFT JOIN 
                warden AS w2 ON w2.wardenId = bk.updatedBy
            WHERE 
                bk.deletedAt IS NULL AND blockId = ?`,
            [blockId],
            mysqlClient
        )
        if (block.length === 0) {
            return res.status(404).send("blockId not valid");
        }
        res.status(200).send(block[0])
    } catch (error) {
        res.status(500).send(error.message)
    }
}

async function createBlock(req, res) {
    const mysqlClient = req.app.mysqlClient;
   
    const {
        blockCode,
        blockLocation,
        isActive
    } = req.body
    const createdBy = req.session.data.wardenId;

    const isValidInsert = validateInsert(req.body);
    if (isValidInsert.length > 0) {
        return res.status(400).send(isValidInsert)
    }

    try {
        const existingBlockCode = await mysqlQuery(/*sql*/`SELECT * FROM block WHERE blockCode = ? AND deletedAt IS NULL`,
            [blockCode],
            mysqlClient
        );
        if (existingBlockCode.length > 0) {
            return res.status(409).send("blockCode already exists");
        }

        // const existingBlockCode = await mysqlQuery(/*sql*/`
        //     SELECT * FROM block WHERE blockCode = ?`,
        //     [blockCode], mysqlClient
        // );

        // if (existingBlockCode.length > 0 && existingBlockCode[0].deletedAt === null) {
        //     return res.status(409).send("blockCode already exists");
        // }

        // if (existingBlockCode.length > 0 && existingBlockCode[0].deletedAt !== null) {
        //     const restoreBlock = await mysqlQuery(/*sql*/`
        //         UPDATE block SET deletedAt = NULL, blockLocation = ?, isActive = ?,createdAt = NOW(), createdBy = ?
        //         WHERE blockCode = ?`,
        //         [blockLocation, isActive, createdBy, blockCode], mysqlClient);
        //         console.log(restoreBlock.affectedRows)
        //     if (restoreBlock.affectedRows === 0) {
        //         return res.status(400).send("Block restoration failed. No changes were made.");
        //     }
        //     return res.status(200).send("Soft-deleted block restored successfully.");
        // }

        const newBlock = await mysqlQuery(/*sql*/`INSERT INTO BLOCK(blockCode, blockLocation, isActive, createdBy) VALUES(?,?,?,?)`,
            [blockCode, blockLocation, isActive, createdBy], mysqlClient)
           
        if (newBlock.affectedRows === 0) {
            res.status(400).send("no insert was made")
        } else {
            res.status(201).send('insert successfully')
        }
    } catch (error) {
        res.status(500).send(error.message)
    }
}

async function updateBlockById(req, res) {
    const blockId = req.params.blockId;
    const updatedBy = req.session.data.wardenId;
    const values = []
    const updates = []

    ALLOWED_UPDATE_KEYS.forEach((key) => {
        const keyValue = req.body[key]
        if (keyValue !== undefined) {
            values.push(keyValue)
            updates.push(` ${key} = ? `)
        }
    })

    updates.push("updatedBy = ?")
    values.push(updatedBy, blockId)
    const mysqlClient = req.app.mysqlClient
    const blockCode = req.body.blockCode;

    try {
        const block = await validateBlockById(blockId, mysqlClient);
        if (!block) {
            return res.status(404).send("Block not found or already deleted");
        }

        if (blockCode) {
            const isBlockUnique = await mysqlQuery(/*sql*/`
                SELECT * FROM block 
                WHERE blockCode = ? AND blockId != ? AND deletedAt IS NULL`,
                [blockCode, blockId], mysqlClient);

            if (isBlockUnique.length > 0) {
                return res.status(409).send("blockCode already exists");
            }
        }

        const isValid = await validateUpdateBlock(blockId, mysqlClient, req.body)
        if (!isValid) {
            return res.status(409).send("students in block shift to another block");
        }

        const isValidInsert = validateInsert(req.body, true, blockId, mysqlClient);
        if (isValidInsert.length > 0) {
            return res.status(400).send(isValidInsert)
        }

        const isUpdate = await mysqlQuery(/*sql*/`UPDATE block SET  ${updates.join(', ')} WHERE blockId = ? AND deletedAt IS NULL`,
            values, mysqlClient
        )
        if (isUpdate.affectedRows === 0) {
            res.status(204).send("Block not found or no changes made")
        }

        const getUpdatedBlock = await mysqlQuery(/*sql*/`SELECT * FROM block WHERE blockId = ? `,
            [blockId], mysqlClient)
        res.status(200).send({
            status: 'successfull',
            data: getUpdatedBlock[0]
        })
    }
    catch (error) {
        res.status(500).send(error.message)
    }
}

async function deleteBlockById(req, res) {
    const blockId = req.params.blockId;
    const mysqlClient = req.app.mysqlClient;
    const deletedBy = req.session.data.wardenId;

    try {
        const isValid = await validateBlockById(blockId, mysqlClient)
        if (!isValid) {
            return res.status(404).send("blockId is not defined")
        }

        const deletedBlock = await mysqlQuery(/*sql*/`UPDATE block SET deletedAt = NOW(),
            deletedBy = ? WHERE blockId = ? AND deletedAt IS NULL`,
            [deletedBy, blockId],
            mysqlClient)
        if (deletedBlock.affectedRows === 0) {
            return res.status(404).send("Block not found or already deleted")
        }

        const getDeletedBlock = await mysqlQuery(/*sql*/`SELECT * FROM block WHERE blockId = ? `, [blockId], mysqlClient)
        res.status(200).send({
            status: 'deleted',
            data: getDeletedBlock[0]
        });
    }
    catch (error) {
        res.status(500).send(error.message)
    }
}

function getBlockById(blockId, mysqlClient) {
    return new Promise((resolve, reject) => {
        mysqlClient.query(/*sql*/`SELECT * FROM block WHERE blockId = ? `, [blockId], (err, block) => {
            if (err) {
                return reject(err)
            }
            resolve(block.length ? block[0] : null)

        })
    })
}

async function validateBlockById(blockId, mysqlClient) {
    var block = await getBlockById(blockId, mysqlClient)
    if (block !== null) {
        return true
    }
    return false
}

async function validateInsert(body, isUpdate = false, blockId, mysqlClient) {
    const {
        blockCode,
        blockLocation,
        isActive
    } = body

    const errors = []
    try {
        if (blockCode !== undefined) {
            if (blockCode.length < 1) {
                errors.push("BockCode is invalid")
            } else if (!isUpdate) {
                try {
                    var isValidBlockCode = await mysqlQuery(/*sql*/`SELECT COUNT(*) AS count FROM block WHERE blockCode = ? AND blockId != ?
            AND deletedAt is NULL`, [blockCode, blockId], mysqlClient)
                    // console.log(isValidBlockCode)
                    // console.log('aaaaaaaaaaaaaaaaaaaaaaaa11')
                    if (isValidBlockCode[count] > 0) {
                        errors.push("BlockCode is already Exits")
                    }
                } catch (error) {
                    console.log(error)
                }
            }
        } else {
            errors.push("BlockCode is missing")
        }

        if (blockLocation !== undefined) {
            if (blockLocation <= 0) {
                errors.push("location is invalid")
            }
        } else {
            errors.push("location is missing")
        }

        if (isActive !== undefined) {
            if (![0, 1].includes(isActive)) {
                errors.push("isActive is invalid")
            }
        } else {
            errors.push("isActive is missing")
        }
        return errors
    } catch (error) {
        console.log(error)
    }
}

function getBlockFloorCountByBlockId(blockId, mysqlClient) {
    return new Promise((resolve, reject) => {
        mysqlClient.query(/*sql*/`SELECT count(*) AS count FROM blockfloor WHERE blockId = ? AND deletedAt IS NULL`,
            [blockId],
            (err, blockIdCount) => {
                if (err) {
                    return reject(err)
                }
                resolve(blockIdCount)
            })
    })
}

async function validateUpdateBlock(blockId, mysqlClient, body) {
    if (body.isActive === 0) {
        var [blockFloorBlock] = await getBlockFloorCountByBlockId(blockId, mysqlClient)
        if (blockFloorBlock.count > 0) {
            return false
        }
    }
    return true
}

module.exports = (app) => {
    app.get('/api/block', readBlocks)
    app.get('/api/block/:blockId', readBlockById)
    app.post('/api/block', createBlock)
    app.put('/api/block/:blockId', updateBlockById)
    app.delete('/api/block/:blockId', deleteBlockById)
}


.............................................................

<%- include('../../partials/header.ejs', { isMenuVisible : true, title: 'Attendance' }) %>
    <h2 class="text-center mb-4">Attendance Form</h2>
    <div class="row justify-content-center">
        <div class="col-md-3">
            <div class="form-group">
                <label for="blockCode">Block Code</label>
                <select class="form-control" id="blockCode"></select>
            </div>
            <div class="form-group">
                <label for="floorNumber">Floor Number</label>
                <select class="form-control" id="floorNumber"></select>
            </div>
            <div class="form-group">
                <label for="roomNumber">Room Number</label>
                <select class="form-control" id="roomNumber"></select>
            </div>
            <div class="form-group">
                <label for="checkIn">Check-in Date</label>
                <input type="date" class="form-control" id="checkIn">
            </div>
        </div>
        <div class="form-group">
            <label for="studentList">Students :</label>
            <ul id="studentList" class="list-group"></ul>
        </div>
        <div class="text-center">
            <button type="button" onclick="saveOrUpdateAttendance()" class="btn btn-success" id="submitButton"
                disabled>Submit</button>
        </div>
    </div>

    <%- include('../../partials/footer.ejs') %>
        <script>
            const urlParams = new URLSearchParams(window.location.search);
            var blockCode = document.getElementById('blockCode');
            var floorNumber = document.getElementById('floorNumber');
            var roomNumber = document.getElementById('roomNumber');
            var checkIn = document.getElementById('checkIn');
            var studentList = document.getElementById('studentList');
            var submitButton = document.getElementById('submitButton');
            const today = new Date().toISOString().split('T')[0];
            checkIn.value = today;

            function convertToISO(checkIn) {
                let [year, month, day] = checkIn.split('-');
                day = day.replace(/\D/g, '');
                day = day.padStart(2, '0');
                year = `20${year.padStart(2, '0')}`;
                const months = {
                    "Jan": "01",
                    "Feb": "02",
                    "Mar": "03",
                    "Apr": "04",
                    "May": "05",
                    "Jun": "06",
                    "Jul": "07",
                    "Aug": "08",
                    "Sep": "09",
                    "Oct": "10",
                    "Nov": "11",
                    "Dec": "12"
                };
                const monthNumber = months[month];
                return `${year}-${monthNumber}-${day}`;
            }

            const checkInParam = urlParams.get('checkIn');
            if (checkInParam) {
                const isoDate = convertToISO(checkInParam);
                checkIn.value = isoDate;
            }

            function getSelectedStatus(studentId) {
                const presentRadio = document.getElementById('present_' + studentId);
                const absentRadio = document.getElementById('absent_' + studentId);

                return presentRadio.checked ? 1 : absentRadio.checked ? 0 : null;
            }

            function saveOrUpdateAttendance() {
                const students = document.querySelectorAll('#studentList li');
                let studentAttendanceData = [];

                students.forEach((student) => {
                    const studentId = student.querySelector('input[type="radio"]').id.split('_')[1];
                    const isPresentValue = getSelectedStatus(studentId);

                    studentAttendanceData.push({
                        "studentId": studentId,
                        "isPresent": isPresentValue
                    });
                });

                var myHeaders = new Headers();
                myHeaders.append("Content-Type", "application/json");

                for (var i = 0; i < studentAttendanceData.length; i++) {
                    var raw = JSON.stringify({
                        "blockId": blockCode.value,
                        "blockFloorId": floorNumber.value,
                        "roomId": roomNumber.value,
                        "checkInDate": checkIn.value,
                        "studentId": studentAttendanceData[i].studentId,
                        "isPresent": studentAttendanceData[i].isPresent
                    });

                    var requestOptions = {
                        method: 'POST',
                        headers: myHeaders,
                        body: raw
                    };

                    let url = `http://localhost:1000/api/attendance/${blockCode.value}/${floorNumber.value}/${roomNumber.value}`;

                    fetch(url, requestOptions)
                        .then(response => response.text())
                        .then((attendanceData) => window.location = '/attendance')
                        .catch(error => console.error('error', error));
                }
            }

            function toggleSubmitButton() {
                const students = document.querySelectorAll('#studentList li');
                let allStatusSelected = true;

                students.forEach((student) => {
                    const studentId = student.querySelector('input[type="radio"]').id.split('_')[1];
                    if (getSelectedStatus(studentId) === null) {
                        allStatusSelected = false;
                    }
                });

                submitButton.disabled = !(
                    blockCode.value !== 'Select' &&
                    floorNumber.value !== 'Select' &&
                    roomNumber.value !== 'Select' &&
                    checkIn.value !== '' &&
                    allStatusSelected
                );
            }

            async function initializeForm() {
                await populateBlockCode();
                await populateFloorNumber();
                await populateRoomNumber();
                await populateStudentList()

                blockCode.addEventListener('change', populateFloorNumber);
                floorNumber.addEventListener('change', populateRoomNumber);
                roomNumber.addEventListener('change', populateStudentList);
                studentList.addEventListener('change', toggleSubmitButton);

            }

            async function populateBlockCode() {
                try {
                    const myParam = urlParams.get('blockId');
                    const url = myParam ? `http://localhost:1000/api/block?blockId=${myParam}` : 'http://localhost:1000/api/block?isActive=1';
                    const response = await fetch(url);
                    const responseData = await response.json();
                    const { blocks } = responseData;

                    blockCode.innerHTML = '<option selected>Select a Block</option>';

                    const blockFloorsPromises = blocks.map(async (block) => {
                        const option = document.createElement('option');
                        option.value = block.blockId;
                        option.textContent = block.blockCode;

                        try {
                            const blockFloorsResponse = await fetch(`http://localhost:1000/api/blockfloor/${block.blockId}`);
                            const blockFloors = await blockFloorsResponse.json();

                            if (blockFloors.length === 0) {
                                option.disabled = true;
                            }
                        } catch (error) {
                            option.disabled = true;
                        }

                        return option; 
                    });

                    const options = await Promise.all(blockFloorsPromises);
                    options.forEach(option => blockCode.appendChild(option));

                    if (myParam) {
                        blockCode.value = myParam;
                        await populateFloorNumber();
                    }
                } catch (error) {
                    console.log('Error fetching block codes:', error);
                }
            }



            async function populateFloorNumber() {
                try {
                    const myParam = urlParams.get('blockFloorId');
                    const blockId = blockCode.value;

                    if (blockId === 'Select' || blockId === '') {
                        floorNumber.innerHTML = '';
                        return;
                    }

                    const response = await fetch(`http://localhost:1000/api/blockfloor/block/${blockId}`);
                    const blockFloors = await response.json();

                    if (blockFloors.length === 0) {
                        floorNumber.innerHTML = '<option selected>No floors available</option>';
                        return;
                    }

                    let optionsList = '<option selected>Select a Floor</option>'; blockFloors.forEach(blockFloor => {
                        optionsList += `<option value="${blockFloor.blockFloorId}">${blockFloor.floorNumber}</option>`;
                    });
                    floorNumber.innerHTML = optionsList;

                    if (myParam) {
                        floorNumber.value = myParam;
                        await populateRoomNumber
                    }


                } catch (error) {
                    console.log('Error fetching floor numbers:', error);
                }
            }

            async function populateRoomNumber() {
                try {
                    const myParam = urlParams.get('roomId');
                    const blockFloorId = floorNumber.value;

                    if (blockFloorId === 'Select' || blockFloorId === '') {
                        roomNumber.innerHTML = '';
                        return;
                    }

                    const response = await fetch(`http://localhost:1000/api/room/blockfloor/${blockFloorId}`);
                    const rooms = await response.json();

                    if (rooms.length === 0) {
                        roomNumber.innerHTML = '<option selected>No rooms available</option>';
                        return;
                    }

                    let optionsList = '<option selected>Select a Room</option>';
                    rooms.forEach(room => {
                        optionsList += `<option value="${room.roomId}">${room.roomNumber}</option>`;
                    });
                    roomNumber.innerHTML = optionsList;

                    if (myParam) {
                        roomNumber.value = myParam;
                        await populateStudentList
                    }

                } catch (error) {
                    console.log('Error fetching room numbers:', error);
                }
            }

            async function populateStudentList() {
                try {
                    const roomId = roomNumber.value;
                    if (roomId === 'Select') {
                        studentList.innerHTML = '';
                        return;
                    }

                    const response = await fetch(`http://localhost:1000/api/attendance/student/${roomId}?checkIn=${checkIn.value}`);
                    const students = await response.json();

                    if (students.length === 0) {
                        studentList.innerHTML = '<li class="list-group-item">No students available</li>';
                        return;
                    }

                    studentList.innerHTML = '';
                    students.forEach(student => {
                        const isPresentChecked = student.isPresent === 1 ? 'checked' : '';
                        const isAbsentChecked = student.isPresent === 0 ? 'checked' : '';

                        const li = document.createElement('li');
                        li.classList.add('list-group-item');
                        li.innerHTML = `
                <span>${student.name}</span>
                <div class="form-check form-check-inline float-right">
                    <input class="form-check-input" type="radio" name="isPresent_${student.studentId}" value="1" id="present_${student.studentId}" ${isPresentChecked}>
                    <label class="form-check-label" for="present_${student.studentId}">Present</label>
                </div>
                <div class="form-check form-check-inline float-right">
                    <input class="form-check-input" type="radio" name="isPresent_${student.studentId}" value="0" id="absent_${student.studentId}" ${isAbsentChecked}>
                    <label class="form-check-label" for="absent_${student.studentId}">Absent</label>
                </div>`;

                        studentList.appendChild(li);
                    });

                } catch (error) {
                    console.log('Error fetching student list:', error);
                }
            }
            initializeForm();
        </script>

















        const { mysqlQuery } = require('../utilityclient.js')
const ALLOWED_UPDATE_KEYS = [
    "blockCode",
    "blockLocation",
    "isActive"
]

async function readBlocks(req, res) {
    const mysqlClient = req.app.mysqlClient
    const limit = req.query.limit ? parseInt(req.query.limit) : null;
    const page = req.query.page ? parseInt(req.query.page) : null;
    const offset = limit && page ? (page - 1) * limit : null;
    const orderBy = req.query.orderby || 'bk.blockCode';
    const sort = req.query.sort || 'ASC';
    const searchQuery = req.query.search || '';
    const searchPattern = `%${searchQuery}%`;
    const status = req.query.isActive;

    var blocksQuery = /*sql*/`
        SELECT 
            bk.*,
            w.firstName AS createdFirstName,
            w.lastName AS createdLastName,
            w2.firstName AS updatedFirstName,
            w2.lastName AS updatedLastName,
            DATE_FORMAT(bk.createdAt, "%y-%b-%D %r") AS createdTimeStamp,
            DATE_FORMAT(bk.updatedAt, "%y-%b-%D %r") AS updatedTimeStamp,
            (SELECT COUNT(*) FROM blockfloor b WHERE b.blockId = bk.blockId AND b.deletedAt IS NULL) AS floorCount 
            FROM block AS bk
        LEFT JOIN 
            warden AS w ON w.wardenId = bk.createdBy
        LEFT JOIN 
            warden AS w2 ON w2.wardenId = bk.updatedBy
        WHERE 
            bk.deletedAt IS NULL AND 
            (bk.blockCode LIKE ? OR 
            w.firstName LIKE ? OR 
            w.lastName LIKE ? OR 
            w2.firstName LIKE ? OR 
            w2.lastName LIKE ?)`

    if (status !== undefined) {
        blocksQuery += ` AND bk.isActive = 1`;
    }

    blocksQuery += ` ORDER BY ${orderBy} ${sort}`;

    if (limit && offset !== null) {
        blocksQuery += ` LIMIT ? OFFSET ?`;
    }

    const countQuery = /*sql*/ `
        SELECT COUNT(*) AS totalBlockCount 
        FROM block 
        WHERE deletedAt IS NULL`;

    try {
        const [blocks, totalCount] = await Promise.all([
            mysqlQuery(blocksQuery, [searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, limit, offset], mysqlClient),
            mysqlQuery(countQuery, [], mysqlClient)
        ]);

        res.status(200).send({
            blocks: blocks,
            blockCount: totalCount[0].totalBlockCount
        });

    } catch (error) {
        res.status(500).send(error.message)
    }
}

async function readBlockById(req, res) {
    const mysqlClient = req.app.mysqlClient;
    const blockId = req.params.blockId;
    try {
        const block = await mysqlQuery(/*sql*/`
             SELECT 
                bk.*,
                w.firstName AS createdFirstName,
                w.lastName AS createdLastName,
                w2.firstName AS updatedFirstName,
                w2.lastName AS updatedLastName,
                DATE_FORMAT(bk.createdAt, "%y-%b-%D %r") AS createdTimeStamp,
                DATE_FORMAT(bk.updatedAt, "%y-%b-%D %r") AS updatedTimeStamp
                FROM block AS bk
            LEFT JOIN 
                warden AS w ON w.wardenId = bk.createdBy
            LEFT JOIN 
                warden AS w2 ON w2.wardenId = bk.updatedBy
            WHERE 
                bk.deletedAt IS NULL AND blockId = ?`,
            [blockId],
            mysqlClient
        )
        if (block.length === 0) {
            return res.status(404).send("blockId not valid");
        }
        res.status(200).send(block[0])
    } catch (error) {
        res.status(500).send(error.message)
    }
}

async function createBlock(req, res) {
    const mysqlClient = req.app.mysqlClient;

    const {
        blockCode,
        blockLocation,
        isActive
    } = req.body
    const createdBy = req.session.data.wardenId;

    const isValidInsert = validateInsert(req.body, false, null, mysqlClient);
    if (isValidInsert.length > 0) {
        return res.status(400).send(isValidInsert)
    }

    try {
        // const existingBlockCode = await mysqlQuery(/*sql*/`
        //     SELECT * FROM block WHERE blockCode = ?`,
        //     [blockCode], mysqlClient
        // );

        // if (existingBlockCode.length > 0 && existingBlockCode[0].deletedAt === null) {
        //     return res.status(409).send("blockCode already exists");
        // }

        // if (existingBlockCode.length > 0 && existingBlockCode[0].deletedAt !== null) {
        //     const restoreBlock = await mysqlQuery(/*sql*/`
        //         UPDATE block SET deletedAt = NULL, blockLocation = ?, isActive = ?,createdAt = NOW(), createdBy = ?
        //         WHERE blockCode = ?`,
        //         [blockLocation, isActive, createdBy, blockCode], mysqlClient);
        //         console.log(restoreBlock.affectedRows)
        //     if (restoreBlock.affectedRows === 0) {
        //         return res.status(400).send("Block restoration failed. No changes were made.");
        //     }
        //     return res.status(200).send("Soft-deleted block restored successfully.");
        // }

        const newBlock = await mysqlQuery(/*sql*/`INSERT INTO BLOCK(blockCode, blockLocation, isActive, createdBy) VALUES(?,?,?,?)`,
            [blockCode, blockLocation, isActive, createdBy], mysqlClient)

        if (newBlock.affectedRows === 0) {
            res.status(400).send("no insert was made")
        } else {
            res.status(201).send('insert successfully')
        }
    } catch (error) {
        console.log(error)
        res.status(500).send(error.message)
    }
}

async function updateBlockById(req, res) {
    const blockId = req.params.blockId;
    const updatedBy = req.session.data.wardenId;
    const values = []
    const updates = []

    ALLOWED_UPDATE_KEYS.forEach((key) => {
        const keyValue = req.body[key]
        if (keyValue !== undefined) {
            values.push(keyValue)
            updates.push(` ${key} = ? `)
        }
    })

    updates.push("updatedBy = ?")
    values.push(updatedBy, blockId)
    const mysqlClient = req.app.mysqlClient
    const blockCode = req.body.blockCode;

    try {
        const block = await validateBlockById(blockId, mysqlClient);
        if (!block) {
            return res.status(404).send("Block not found or already deleted");
        }

        // if (blockCode) {
        //     const isBlockUnique = await mysqlQuery(/*sql*/`
        //         SELECT * FROM block 
        //         WHERE blockCode = ? AND blockId != ? AND deletedAt IS NULL`,
        //         [blockCode, blockId], mysqlClient);

        //     if (isBlockUnique.length > 0) {
        //         return res.status(409).send("blockCode already exists");
        //     }
        // }

        const isValid = await validateUpdateBlock(blockId, mysqlClient, req.body)
        if (!isValid) {
            return res.status(409).send("students in block shift to another block");
        }

        const isValidInsert = validateInsert(req.body, true, blockId, mysqlClient);
        if (isValidInsert.length > 0) {
            return res.status(400).send(isValidInsert)
        }

        const isUpdate = await mysqlQuery(/*sql*/`UPDATE block SET  ${updates.join(', ')} WHERE blockId = ? AND deletedAt IS NULL`,
            values, mysqlClient
        )
        if (isUpdate.affectedRows === 0) {
            res.status(204).send("Block not found or no changes made")
        }

        const getUpdatedBlock = await mysqlQuery(/*sql*/`SELECT * FROM block WHERE blockId = ? `,
            [blockId], mysqlClient)
        res.status(200).send({
            status: 'successfull',
            data: getUpdatedBlock[0]
        })
    }
    catch (error) {
        res.status(500).send(error.message)
    }
}

async function deleteBlockById(req, res) {
    const blockId = req.params.blockId;
    const mysqlClient = req.app.mysqlClient;
    const deletedBy = req.session.data.wardenId;

    try {
        const isValid = await validateBlockById(blockId, mysqlClient)
        if (!isValid) {
            return res.status(404).send("blockId is not defined")
        }

        const deletedBlock = await mysqlQuery(/*sql*/`UPDATE block SET deletedAt = NOW(),
            deletedBy = ? WHERE blockId = ? AND deletedAt IS NULL`,
            [deletedBy, blockId],
            mysqlClient)
        if (deletedBlock.affectedRows === 0) {
            return res.status(404).send("Block not found or already deleted")
        }

        const getDeletedBlock = await mysqlQuery(/*sql*/`SELECT * FROM block WHERE blockId = ? `, [blockId], mysqlClient)
        res.status(200).send({
            status: 'deleted',
            data: getDeletedBlock[0]
        });
    }
    catch (error) {
        res.status(500).send(error.message)
    }
}

function getBlockById(blockId, mysqlClient) {
    return new Promise((resolve, reject) => {
        mysqlClient.query(/*sql*/`SELECT * FROM block WHERE blockId = ? AND deletedAt IS NULL`, [blockId], (err, block) => {
            if (err) {
                return reject(err)
            }
            resolve(block.length ? block[0] : null)

        })
    })
}

async function validateBlockById(blockId, mysqlClient) {
    var block = await getBlockById(blockId, mysqlClient)
    if (block !== null) {
        return true
    }
    return false
}

async function validateInsert(body, isUpdate = false, blockId = null, mysqlClient) {
    const { blockCode, blockLocation, isActive } = body;
    console.log(blockCode)
    const errors = [];

    try {
        if (blockCode !== undefined) {
            if (blockCode.length < 1) {
                errors.push("BlockCode is invalid");
            } else {
                let query;
                let params;

                if (isUpdate === true) {
                    query = `SELECT COUNT(*) AS count FROM block WHERE blockCode = ? AND blockId != ? AND deletedAt IS NULL`;
                    params = [blockCode, blockId];
                } else {
                    query = `SELECT COUNT(*) AS count FROM block WHERE blockCode = ? AND deletedAt IS NULL`;
                    params = [blockCode];
                }

                const isValidBlockCode = await mysqlQuery(query, params, mysqlClient);
                if (isValidBlockCode[0].count > 0) {
                    errors.push("BlockCode already exists");
                }
            }
        } else {
            errors.push("BlockCode is missing");
        }

        if (blockLocation !== undefined) {
            if (blockLocation.length < 1) {
                errors.push("location is invalid")
            }
        } else {
            errors.push("location is missing")
        }

        if (isActive !== undefined) {
            if (![0, 1].includes(isActive)) {
                errors.push("isActive is invalid")
            }
        } else {
            errors.push("isActive is missing")
        }
        return errors
    } catch (error) {
        console.log(error)
    }
}

function getBlockFloorCountByBlockId(blockId, mysqlClient) {
    return new Promise((resolve, reject) => {
        mysqlClient.query(/*sql*/`SELECT count(*) AS count FROM blockfloor WHERE blockId = ? AND deletedAt IS NULL`,
            [blockId],
            (err, blockIdCount) => {
                if (err) {
                    return reject(err)
                }
                resolve(blockIdCount)
            })
    })
}

async function validateUpdateBlock(blockId, mysqlClient, body) {
    if (body.isActive === 0) {
        var [blockFloorBlock] = await getBlockFloorCountByBlockId(blockId, mysqlClient)
        if (blockFloorBlock.count > 0) {
            return false
        }
    }
    return true
}

module.exports = (app) => {
    app.get('/api/block', readBlocks)
    app.get('/api/block/:blockId', readBlockById)
    app.post('/api/block', createBlock)
    app.put('/api/block/:blockId', updateBlockById)
    app.delete('/api/block/:blockId', deleteBlockById)
}


var blockFloorBlockCodeCount = /*sql*/`SELECT 
        blockId, 
        blockCode,(SELECT COUNT(*) FROM blockfloor b WHERE b.blockId = bk.blockId 
        AND b.deletedAt IS NULL) AS floorCount FROM block bk




        <%- include('../../partials/header.ejs', { isMenuVisible : true, title: 'Attendance' }) %>
    <h2 class="text-center mb-4">Attendance Form</h2>
    <div class="row justify-content-center">
        <div class="col-md-3">
            <div class="form-group">
                <label for="blockCode">Block Code</label>
                <select class="form-control" id="blockCode"></select>
            </div>
            <div class="form-group">
                <label for="floorNumber">Floor Number</label>
                <select class="form-control" id="floorNumber"></select>
            </div>
            <div class="form-group">
                <label for="roomNumber">Room Number</label>
                <select class="form-control" id="roomNumber"></select>
            </div>
            <div class="form-group">
                <label for="checkIn">Check-in Date</label>
                <input type="date" class="form-control" id="checkIn">
            </div>
        </div>
        <div class="form-group">
            <label for="studentList">Students :</label>
            <ul id="studentList" class="list-group"></ul>
        </div>
        <div class="text-center">
            <button type="button" onclick="saveOrUpdateAttendance()" class="btn btn-success" id="submitButton"
                disabled>Submit</button>
        </div>
    </div>

    <%- include('../../partials/footer.ejs') %>
        <script>
            const urlParams = new URLSearchParams(window.location.search);
            var blockCode = document.getElementById('blockCode');
            var floorNumber = document.getElementById('floorNumber');
            var roomNumber = document.getElementById('roomNumber');
            var checkIn = document.getElementById('checkIn');
            var studentList = document.getElementById('studentList');
            var submitButton = document.getElementById('submitButton');
            const today = new Date().toISOString().split('T')[0];
            checkIn.value = today;

            function convertToISO(checkIn) {
                let [year, month, day] = checkIn.split('-');
                day = day.replace(/\D/g, '');
                day = day.padStart(2, '0');
                year = `20${year.padStart(2, '0')}`;
                const months = {
                    "Jan": "01",
                    "Feb": "02",
                    "Mar": "03",
                    "Apr": "04",
                    "May": "05",
                    "Jun": "06",
                    "Jul": "07",
                    "Aug": "08",
                    "Sep": "09",
                    "Oct": "10",
                    "Nov": "11",
                    "Dec": "12"
                };
                const monthNumber = months[month];
                return `${year}-${monthNumber}-${day}`;
            }

            const checkInParam = urlParams.get('checkIn');
            if (checkInParam) {
                const isoDate = convertToISO(checkInParam);
                checkIn.value = isoDate;
            }

            function getSelectedStatus(studentId) {
                const presentRadio = document.getElementById('present_' + studentId);
                const absentRadio = document.getElementById('absent_' + studentId);

                return presentRadio.checked ? 1 : absentRadio.checked ? 0 : null;
            }

            function saveOrUpdateAttendance() {
                const students = document.querySelectorAll('#studentList li');
                let studentAttendanceData = [];

                students.forEach((student) => {
                    const studentId = student.querySelector('input[type="radio"]').id.split('_')[1];
                    const isPresentValue = getSelectedStatus(studentId);

                    studentAttendanceData.push({
                        "studentId": studentId,
                        "isPresent": isPresentValue
                    });
                });

                var myHeaders = new Headers();
                myHeaders.append("Content-Type", "application/json");

                for (var i = 0; i < studentAttendanceData.length; i++) {
                    var raw = JSON.stringify({
                        "blockId": blockCode.value,
                        "blockFloorId": floorNumber.value,
                        "roomId": roomNumber.value,
                        "checkInDate": checkIn.value,
                        "studentId": studentAttendanceData[i].studentId,
                        "isPresent": studentAttendanceData[i].isPresent
                    });

                    var requestOptions = {
                        method: 'POST',
                        headers: myHeaders,
                        body: raw
                    };

                    let url = `http://localhost:1000/api/attendance/${blockCode.value}/${floorNumber.value}/${roomNumber.value}`;

                    fetch(url, requestOptions)
                        .then(() => window.location = '/attendance')
                        .catch(error => console.error('error', error));
                }
            }

            function toggleSubmitButton() {
                const students = document.querySelectorAll('#studentList li');
                let allStatusSelected = true;

                students.forEach((student) => {
                    const studentId = student.querySelector('input[type="radio"]').id.split('_')[1];
                    if (getSelectedStatus(studentId) === null) {
                        allStatusSelected = false;
                    }
                });

                submitButton.disabled = !(
                    blockCode.value !== 'Select' &&
                    floorNumber.value !== 'Select' &&
                    roomNumber.value !== 'Select' &&
                    checkIn.value !== '' &&
                    allStatusSelected
                );
            }

            async function initializeForm() {
                await populateBlockCode();
                await populateFloorNumber();
                await populateRoomNumber();
                await populateStudentList()

                blockCode.addEventListener('change', populateFloorNumber);
                floorNumber.addEventListener('change', populateRoomNumber);
                roomNumber.addEventListener('change', populateStudentList);
                studentList.addEventListener('change', toggleSubmitButton);

            }

            initializeForm();

            async function populateBlockCode() {
                try {
                    const myParam = urlParams.get('blockId');
                    const url = myParam ? `http://localhost:1000/api/block?blockId=${myParam}` :
                        'http://localhost:1000/api/block/blockFloor/blockCodeCount';
                    const response = await fetch(url);
                    const responseData = await response.json();
                    const activeOptions = [];
                    const disabledOptions = [];

                    blockCode.innerHTML = '<option selected>Select a Block</option>';

                    responseData.forEach(block => {
                        const option = document.createElement('option');
                        option.value = block.blockId;
                        option.textContent = block.blockCode;
                        if (block.floorCount === 0) {
                            option.disabled = true;
                            disabledOptions.push(option);
                        } else {
                            activeOptions.push(option);
                        }
                    });

                    activeOptions.forEach(option => {
                        blockCode.appendChild(option);
                    });

                    disabledOptions.forEach(option => {
                        blockCode.appendChild(option);
                    });


                    if (myParam) {
                        blockCode.value = myParam;
                        await populateFloorNumber();
                    }
                } catch (error) {
                    console.log('Error fetching block codes:', error);
                }
            }

            async function populateFloorNumber() {
                try {
                    const myParam = urlParams.get('blockFloorId');
                    const blockId = blockCode.value;

                    if (blockId === 'Select' || blockId === '') {
                        floorNumber.innerHTML = '';
                        return;
                    }

                    const response = await fetch(`http://localhost:1000/api/blockfloor/block/${blockId}`);
                    const blockFloors = await response.json();

                    if (blockFloors.length === 0) {
                        floorNumber.innerHTML = '';
                        return;
                    }

                    let optionsList = '<option selected>Select a Floor</option>'; blockFloors.forEach(blockFloor => {
                        optionsList += `<option value="${blockFloor.blockFloorId}">${blockFloor.floorNumber}</option>`;
                    });
                    floorNumber.innerHTML = optionsList;

                    if (myParam) {
                        floorNumber.value = myParam;
                        await populateRoomNumber
                    }


                } catch (error) {
                    console.log('Error fetching floor numbers:', error);
                }
            }

            async function populateRoomNumber() {
                try {
                    const myParam = urlParams.get('roomId');
                    const blockFloorId = floorNumber.value;

                    if (blockFloorId === 'Select' || blockFloorId === '') {
                        roomNumber.innerHTML = '';
                        return;
                    }

                    const response = await fetch(`http://localhost:1000/api/room/blockfloor/${blockFloorId}`);
                    const rooms = await response.json();

                    if (rooms.length === 0) {
                        roomNumber.innerHTML = '<option selected>No rooms available</option>';
                        return;
                    }

                    let optionsList = '<option selected>Select a Room</option>';
                    rooms.forEach(room => {
                        optionsList += `<option value="${room.roomId}">${room.roomNumber}</option>`;
                    });
                    roomNumber.innerHTML = optionsList;

                    if (myParam) {
                        roomNumber.value = myParam;
                        await populateStudentList
                    }

                } catch (error) {
                    console.log('Error fetching room numbers:', error);
                }
            }

            async function populateStudentList() {
                try {
                    const roomId = roomNumber.value;
                    if (roomId === 'Select') {
                        studentList.innerHTML = '';
                        return;
                    }

                    const response = await fetch(`http://localhost:1000/api/attendance/student/${roomId}?checkIn=${checkIn.value}`);
                    const students = await response.json();

                    if (students.length === 0) {
                        studentList.innerHTML = '<li class="list-group-item">No students available</li>';
                        return;
                    }

                    studentList.innerHTML = '';
                    students.forEach(student => {
                        const isPresentChecked = student.isPresent === 1 ? 'checked' : '';
                        const isAbsentChecked = student.isPresent === 0 ? 'checked' : '';

                        const li = document.createElement('li');
                        li.classList.add('list-group-item');
                        li.innerHTML = `
                <span>${student.name}</span>
                <div class="form-check form-check-inline float-right">
                    <input class="form-check-input" type="radio" name="isPresent_${student.studentId}" value="1" id="present_${student.studentId}" ${isPresentChecked}>
                    <label class="form-check-label" for="present_${student.studentId}">Present</label>
                </div>
                <div class="form-check form-check-inline float-right">
                    <input class="form-check-input" type="radio" name="isPresent_${student.studentId}" value="0" id="absent_${student.studentId}" ${isAbsentChecked}>
                    <label class="form-check-label" for="absent_${student.studentId}">Absent</label>
                </div>`;

                        studentList.appendChild(li);
                    });

                } catch (error) {
                    console.log('Error fetching student list:', error);
                }
            }
            
        </script>