const { mysqlQuery } = require('../utilityclient/query')
const ALLOWED_UPDATE_KEYS = [
    "blockId",
    "floorNumber",
    "isActive"
]

async function readBlockFloors(req, res) {
    const mysqlClient = req.app.mysqlClient;
    const limit = req.query.limit ? parseInt(req.query.limit) : null;
    const page = req.query.page ? parseInt(req.query.page) : null;
    const offset = limit && page ? (page - 1) * limit : null;
    const orderBy = req.query.orderby || 'b.floorNumber';
    const sort = req.query.sort || 'ASC';
    const searchQuery = req.query.search || '';
    const searchPattern = `%${searchQuery}%`;
    const queryParameters = [searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, limit, offset]

    let blockFloorsQuery = /*sql*/`
        SELECT 
            b.*,
            bk.blockCode,
            w.firstName AS createdFirstName,
            w.lastName AS createdLastName,
            DATE_FORMAT(b.createdAt, "%y-%b-%D %r") AS createdTimeStamp,
            DATE_FORMAT(b.updatedAt, "%y-%b-%D %r") AS updatedTimeStamp
            FROM blockfloor AS b
            LEFT JOIN 
              block AS bk ON bk.blockId = b.blockId
            LEFT JOIN 
              warden AS w ON w.wardenId = b.createdBy
            WHERE 
              b.deletedAt IS NULL
            AND (bk.blockCode LIKE ? OR b.floorNumber LIKE ? OR b.isActive LIKE ?
              OR w.firstName LIKE ? OR w.lastName Like ?)
            ORDER BY ${orderBy} ${sort}`;

    let countQuery = /*sql*/ `
        SELECT COUNT(*) AS totalBlockFloorCount 
        FROM blockfloor AS b
        LEFT JOIN 
              block AS bk ON bk.blockId = b.blockId
            LEFT JOIN 
              warden AS w ON w.wardenId = b.createdBy
        WHERE b.deletedAt IS NULL
        AND (bk.blockCode LIKE ? OR b.floorNumber LIKE ? OR b.isActive LIKE ?
            OR w.firstName LIKE ? OR w.lastName Like ?)
        ORDER BY ${orderBy} ${sort}`;

    if (limit >= 0) {
        blockFloorsQuery += ' LIMIT ? OFFSET ?'
        countQuery += ' LIMIT ? OFFSET ?'
    }

    try {
        const [blockFloors, totalCount] = await Promise.all([
            mysqlQuery(blockFloorsQuery, queryParameters, mysqlClient),
            mysqlQuery(countQuery, queryParameters, mysqlClient)
        ]);

        res.status(200).send({
            blockFloors: blockFloors,
            blockFloorCount: totalCount[0].totalBlockFloorCount
        });

    } catch (error) {
        res.status(500).send(error.message);
    }
}

async function readBlockFloorById(req, res) {
    const mysqlClient = req.app.mysqlClient;
    const blockFloorId = req.params.blockfloorId;

    try {
        const blockFloor = await mysqlQuery(/*sql*/`
            SELECT 
            b.*,
            bk.blockCode,
            w.firstName AS createdFirstName,
            w.lastName AS createdLastName,
            w2.firstName AS updatedFirstName,
            w2.lastName AS updatedLastName,
            DATE_FORMAT(b.createdAt, "%y-%b-%D %r") AS createdTimeStamp,
            DATE_FORMAT(b.updatedAt, "%y-%b-%D %r") AS updatedTimeStamp
            FROM blockfloor AS b
            LEFT JOIN 
              block AS bk ON bk.blockId = b.blockId
            LEFT JOIN 
              warden AS w ON w.wardenId = b.createdBy
            LEFT JOIN 
              warden AS w2 ON w2.wardenId = b.updatedBy
            WHERE 
              b.deletedAt IS NULL AND blockFloorId = ?`,
            [blockFloorId],
            mysqlClient
        )

        if (blockFloor.length === 0) {
            return res.status(404).send("BlockFloorId not valid");
        }
        res.status(200).send(blockFloor[0])
    }
    catch (error) {
        res.status(500).send(error.message)
    }
}

async function readRoomBlockFloorCountOrFloorCount(req, res) {
    const mysqlClient = req.app.mysqlClient;
    const blockId = req.query.blockId;
    const includeBlockFloor = req.query.blockFloor === 'true';
    console.log(includeBlockFloor)
    try {
        let sqlQuery = /*sql*/`SELECT 
            blockFloorId, 
            floorNumber`;

        if (includeBlockFloor) {
            sqlQuery += `, (SELECT COUNT(*)
            FROM room AS r
            WHERE r.blockFloorId = b.blockFloorId
            AND r.deletedAt IS NULL) AS roomCount`;
        }

        sqlQuery += ` FROM blockfloor AS b
            WHERE b.blockId = ? AND b.isActive = 1
            AND b.deletedAt IS NULL ORDER BY b.floorNumber ASC`;

        const roomBlockFloorCount = await mysqlQuery(sqlQuery, [blockId], mysqlClient);

        if (roomBlockFloorCount.length === 0) {
            return res.status(404).send('No BlockFloors found');
        }
        res.status(200).send(roomBlockFloorCount)
    } catch (error) {
        res.status(500).send(error.message)
    }
}

async function createBlockFloor(req, res) {
    const mysqlClient = req.app.mysqlClient;
    const {
        blockId,
        floorNumber,
        isActive
    } = req.body
    const createdBy = req.session.warden.wardenId;


    const isValidInsert = await validateInsertItems(req.body);
    if (isValidInsert.length > 0) {
        return res.status(400).send(isValidInsert);
    }

    try {
        const newBlockFloor = await mysqlQuery(/*sql*/`INSERT INTO blockfloor (blockId,floorNumber,isActive,createdBy)
            VALUES(?,?,?,?)`,
            [blockId, floorNumber, isActive, createdBy],
            mysqlClient
        )
        if (newBlockFloor.affectedRows === 0) {
            res.status(400).send("no insert was made")
        } else {
            res.status(201).send('insert successfully')
        }
    } catch (error) {
        console.log(error)
        res.status(500).send(error.message)
    }
}

async function updateBlockFloorById(req, res) {
    const blockFloorId = req.params.blockfloorId;
    const mysqlClient = req.app.mysqlClient;
    const values = []
    const updates = []
    const updatedBy = req.session.warden.wardenId;


    ALLOWED_UPDATE_KEYS.forEach(key => {
        const keyValue = req.body[key]
        if (keyValue !== undefined) {
            values.push(keyValue)
            updates.push(` ${key} = ?`)
        }
    })

    values.push(updatedBy, blockFloorId)
    updates.push('updatedBy = ?')

    try {
        const blockFloor = await validateBlockFloorById(blockFloorId, mysqlClient);
        if (!blockFloor) {
            return res.status(404).send("Block not found or already deleted");
        }

        const isValid = await validateUpdateBlockFloor(blockFloorId, mysqlClient, req.body)
        if (!isValid) {
            return res.status(409).send("students in blockfloor shift to another blockfloor");
        }

        const isValidInsert = await validateInsertItems(req.body, true);
        if (isValidInsert.length > 0) {
            return res.status(400).send(isValidInsert);
        }

        const isUpdate = await mysqlQuery(/*sql*/`UPDATE blockfloor SET ${updates.join(', ')} WHERE blockfloorId = ?`,
            values,
            mysqlClient
        )
        if (isUpdate.affectedRows === 0) {
            res.status(204).send("Blockfloor not found or no changes made")
        }

        const getUpdatedBlockFloor = await mysqlQuery(/*sql*/`SELECT * FROM blockfloor WHERE blockfloorId = ?`,
            [blockFloorId],
            mysqlClient
        )
        res.status(200).send({
            status: 'successfull',
            data: getUpdatedBlockFloor[0]
        })
    }
    catch (error) {
        res.status(500).send(error.message)
    }
}

async function deleteBlockFloorById(req, res) {
    const blockFloorId = req.params.blockfloorId;
    const mysqlClient = req.app.mysqlClient;
    const deletedBy = req.session.warden.wardenId;

    try {
        const isValid = await validateBlockFloorById(blockFloorId, mysqlClient)
        if (!isValid) {
            return res.status(404).send("blockFloorId is not defined")
        }

        const checkBlockFloorReference = await mysqlQuery(/*sql*/`SELECT COUNT(*) AS count FROM room 
        WHERE blockFloorId = ?
        AND deletedAt IS NULL`, [blockFloorId], mysqlClient)


        if (checkBlockFloorReference[0].count > 0) {
            return res.status(409).send('BlockFloor is referenced by a room and cannot be deleted')
        }

        const deletedBlockFloor = await mysqlQuery(/*sql*/`UPDATE blockfloor SET 
        floorNumber = CONCAT(IFNULL(floorNumber, ''), '-', NOW()),
        deletedAt = NOW(), deletedBy = ? WHERE blockfloorId = ? AND deletedAt IS NULL`,
            [deletedBy, blockFloorId],
            mysqlClient
        )
        if (deletedBlockFloor.affectedRows === 0) {
            return res.status(404).send("Blockfloor not found or already deleted")
        }

        const getDeletedBlockFloor = await mysqlQuery(/*sql*/`SELECT * FROM blockfloor WHERE blockfloorId = ?`,
            [blockFloorId],
            mysqlClient
        )
        res.status(200).send({
            status: 'deleted',
            data: getDeletedBlockFloor[0]
        });
    }
    catch (error) {
        console.log(error)
        res.status(500).send(error.message)
    }
}

async function validateInsertItems(body, isUpdate = false) {
    const {
        blockId,
        floorNumber,
        isActive,
    } = body

    const errors = []

    if (blockId !== undefined) {
        if (isNaN(blockId) || blockId <= 0)
            errors.push('blockId is invalid')
    } else if (!isUpdate) {
        errors.push('blockId is missing')
    }

    if (floorNumber !== undefined) {
        if (isNaN(floorNumber) || floorNumber <= 0)
            errors.push('floorNumber is invalid')
    } else if (!isUpdate) {
        errors.push('floorNumber is missing')
    }

    if (isActive !== undefined) {
        if (![0, 1].includes(isActive)) {
            errors.push('isActive is invalid')
        }
    } else if (!isUpdate) {
        errors.push('isActive is missing')
    }
    return errors
}

function getBlockFloorById(blockFloorId, mysqlClient) {
    return new Promise((resolve, reject) => {
        mysqlClient.query(/*sql*/`SELECT COUNT(*) AS count FROM blockfloor WHERE blockfloorId = ?`, [blockFloorId], (err, blockFloor) => {
            if (err) {
                return reject(err)
            }
            resolve(blockFloor[0].count > 0 ? blockFloor[0] : null)
        })
    })
}

async function validateBlockFloorById(blockFloorId, mysqlClient) {
    var blockFloor = await getBlockFloorById(blockFloorId, mysqlClient)
    if (blockFloor !== null) {
        return true
    }
    return false
}

function getRoomCountByBlockFloorId(blockFloorId, mysqlClient) {
    return new Promise((resolve, reject) => {
        mysqlClient.query(/*sql*/`SELECT count(*) AS count FROM room WHERE blockfloorId = ? AND deletedAt IS NULL`,
            [blockFloorId],
            (err, blockFloorIdCount) => {
                if (err) {
                    return reject(err)
                }
                resolve(blockFloorIdCount)
            })
    })
}

async function validateUpdateBlockFloor(blockFloorId, mysqlClient, body) {
    if (body.isActive === 0) {
        var [roomBlockFloor] = await getRoomCountByBlockFloorId(blockFloorId, mysqlClient)
        if (roomBlockFloor.count > 0) {
            return false
        }
    }
    return true
}

module.exports = (app) => {
    app.get('/api/blockfloor', readBlockFloors)
    app.get('/api/blockfloor/:blockfloorId', readBlockFloorById)
    app.get('/api/blockfloor/room/floorcount', readRoomBlockFloorCountOrFloorCount)
    app.post('/api/blockfloor', createBlockFloor)
    app.put('/api/blockfloor/:blockfloorId', updateBlockFloorById)
    app.delete('/api/blockfloor/:blockfloorId', deleteBlockFloorById)
}
