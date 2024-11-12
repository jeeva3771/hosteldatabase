const { mysqlQuery } = require('../utilityclient/query')
const ALLOWED_UPDATE_KEYS = [
    'blockFloorId',
    'blockId',
    'roomNumber',
    'roomCapacity',
    'isActive',
    'isAirConditioner'
]

async function readRooms(req, res) {
    const mysqlClient = req.app.mysqlClient;
    const limit = req.query.limit ? parseInt(req.query.limit) : null;
    const page = req.query.page ? parseInt(req.query.page) : null;
    const offset = limit && page ? (page - 1) * limit : null;
    const searchQuery = req.query.search || '';
    const searchPattern = `%${searchQuery}%`;
    const queryParameters = [searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, limit, offset]

    var roomsQuery = /*sql*/`
        SELECT 
            r.*,
            b.floorNumber,
            bk.blockCode,
            w.firstName AS createdFirstName,
            w.lastName AS createdLastName,
            DATE_FORMAT(r.createdAt, "%y-%b-%D %r") AS createdTimeStamp,
            DATE_FORMAT(r.updatedAt, "%y-%b-%D %r") AS updatedTimeStamp
            FROM room AS r
            LEFT JOIN 
               blockfloor AS b ON b.blockFloorId = r.blockFloorId
            LEFT JOIN 
               block AS bk ON bk.blockId = r.blockId
            LEFT JOIN 
               warden AS w ON w.wardenId = r.createdBy
            WHERE 
              r.deletedAt IS NULL 
            AND (bk.blockCode LIKE ? OR b.floorNumber LIKE ? OR r.roomNumber LIKE ? OR r.isActive LIKE ? OR
            w.firstName LIKE ? OR w.lastName Like ?)
            ORDER BY 
            r.roomNumber ASC 
            LIMIT ? OFFSET ?`

    const countQuery = /*sql*/ `
    SELECT COUNT(*) AS totalRoomCount 
    FROM room
    WHERE deletedAt IS NULL`;

    try {
        const [rooms, totalCount] = await Promise.all([
            mysqlQuery(roomsQuery, queryParameters, mysqlClient),
            mysqlQuery(countQuery, [], mysqlClient)
        ]);

        res.status(200).send({
            rooms: rooms,
            roomCount: totalCount[0].totalRoomCount
        });

    } catch (error) {
        res.status(500).send(error.message);
    }
}

async function readRoomById(req, res) {
    const mysqlClient = req.app.mysqlClient;
    const roomId = req.params.roomId;
    try {
        const room = await mysqlQuery(/*sql*/`
            SELECT 
            r.*,
            b.floorNumber,
            bk.blockCode,
            w.firstName AS createdFirstName,
            w.lastName AS createdLastName,
            w2.firstName AS updatedFirstName,
            w2.lastName AS updatedLastName,
            DATE_FORMAT(r.createdAt, "%y-%b-%D %r") AS createdTimeStamp,
            DATE_FORMAT(r.updatedAt, "%y-%b-%D %r") AS updatedTimeStamp
            FROM room AS r
            LEFT JOIN 
               blockfloor AS b ON b.blockFloorId = r.blockFloorId
            LEFT JOIN 
               block AS bk ON bk.blockId = r.blockId
            LEFT JOIN 
               warden AS w ON w.wardenId = r.createdBy
            LEFT JOIN 
              warden AS w2 ON w2.wardenId = r.updatedBy
            WHERE 
              r.deletedAt IS NULL AND roomId = ?`,
            [roomId],
            mysqlClient
        )
        if (room.length === 0) {
            return res.status(404).send("RoomId not valid");
        }
        res.status(200).send(room[0])
    } catch (error) {
        res.status(500).send(error.message)
    }
}

async function readStudentOrRoomNumberCountByRoomId(req, res) {
    const mysqlClient = req.app.mysqlClient;
    const blockFloorId = req.query.blockFloorId;
    const includeStudent = req.query.student === 'true';

    try {
        let sqlQuery = /*sql*/`SELECT 
            roomId, 
            roomNumber`;

        if (includeStudent) {
            sqlQuery += `, (SELECT COUNT(*)
                          FROM student AS s
                          WHERE s.roomId = r.roomId
                          AND s.deletedAt IS NULL) AS studentCount`;
        }

        sqlQuery += ` FROM room AS r
                      WHERE r.blockFloorId = ?
                      AND r.isActive = 1
                      AND r.deletedAt IS NULL ORDER BY r.roomNumber ASC`;

        const studentCountByRoomId = await mysqlQuery(sqlQuery, [blockFloorId], mysqlClient);

        if (studentCountByRoomId.length === 0) {
            return res.status(404).send('No rooms found');
        }
        res.status(200).send(studentCountByRoomId)
    } catch (error) {
        res.status(500).send(error.message)
    }
}


async function createRoom(req, res) {
    const mysqlClient = req.app.mysqlClient;
    const {
        blockFloorId,
        blockId,
        roomNumber,
        roomCapacity,
        isActive,
        isAirConditioner
    } = req.body;
    const createdBy = req.session.warden.wardenId;

    const isValidInsert = validateInsertItems(req.body);
    if (isValidInsert.length > 0) {
        return res.status(400).send(isValidInsert);
    }

    try {
        const newRoom = await mysqlQuery(/*sql*/`INSERT INTO 
            room(blockFloorId,blockId,roomNumber,roomCapacity,isActive,isAirConditioner,createdBy) 
            VALUES(?,?,?,?,?,?,?)`,
            [blockFloorId, blockId, roomNumber, roomCapacity, isActive, isAirConditioner, createdBy],
            mysqlClient
        )
        if (newRoom.affectedRows === 0) {
            res.status(400).send("no insert was made")
        } else {
            res.status(201).send("insert successfull")
        }
    } catch (error) {
        res.status(500).send(error.message)
    }
}

async function updateRoomById(req, res) {
    const roomId = req.params.roomId;
    const mysqlClient = req.app.mysqlClient;
    const updatedBy = req.session.warden.wardenId;

    const values = []
    const updates = []

    ALLOWED_UPDATE_KEYS.forEach(key => {
        const keyValue = req.body[key]
        if (keyValue !== undefined) {
            values.push(keyValue)
            updates.push(` ${key} = ?`)
        }
    })

    updates.push('updatedBy = ?')
    values.push(updatedBy, roomId)

    try {
        const room = await validateRoomById(roomId, mysqlClient)
        if (!room) {
            return res.status(404).send("Room not found or already deleted");
        }

        const isValid = await validateUpdateRoom(roomId, mysqlClient, req.body)
        if (!isValid) {
            return res.status(409).send("students in room shift to another room than try");
        }

        const isValidInsert = validateInsertItems(req.body, true);
        if (isValidInsert.length > 0) {
            return res.status(400).send(isValidInsert)
        }

        const isUpdate = await mysqlQuery(/*sql*/`UPDATE room SET ${updates.join(', ')} WHERE roomId = ? AND deletedAt IS NULL`,
            values, mysqlClient)
        if (isUpdate.affectedRows === 0) {
            res.status(204).send("Room not found or no changes made")
        }

        const getUpdatedRoom = await mysqlQuery(/*sql*/`SELECT * FROM room WHERE roomId = ?`, [roomId], mysqlClient)
        res.status(200).send({
            status: 'successfull',
            data: getUpdatedRoom[0]
        })
    } catch (error) {
        res.status(500).send(error.message)
    }
}

async function deleteRoomById(req, res) {
    const roomId = req.params.roomId;
    const mysqlClient = req.app.mysqlClient;
    const deletedBy = req.session.warden.wardenId;

    try {
        const isValid = await validateRoomById(roomId, mysqlClient)
        if (!isValid) {
            return res.status(404).send("roomId is not defined")
        }

        const deletedRoom = await mysqlQuery(/*sql*/`UPDATE room SET deletedAt = NOW(), deletedBy = ? WHERE roomId = ? AND deletedAt IS NULL`,
            [deletedBy, roomId],
            mysqlClient
        )
        if (deletedRoom.affectedRows === 0) {
            return res.status(404).send("Room not found or already deleted")
        }

        const getDeletedRoom = await mysqlQuery(/*sql*/`SELECT * FROM room WHERE roomId = ?`,
            [roomId],
            mysqlClient
        )
        res.status(200).send({
            status: 'deleted',
            data: getDeletedRoom[0]
        });
    } catch (error) {
        res.status(500).send(error.message)
    }
}

function getRoomById(roomId, mysqlClient) {
    return new Promise((resolve, reject) => {
        var query = /*sql*/`SELECT * FROM room WHERE roomId = ? AND deletedAt IS NULL`
        mysqlClient.query(query, [roomId], (err, room) => {
            if (err) {
                return reject(err)
            }
            resolve(room.length ? room[0] : null)
        })
    })
}

async function validateRoomById(roomId, mysqlClient) {
    var room = await getRoomById(roomId, mysqlClient)
    if (room !== null) {
        return true
    }
    return false
}

function validateInsertItems(body, isUpdate = false) {
    const {
        blockFloorId,
        blockId,
        roomNumber,
        roomCapacity,
        isActive,
        isAirConditioner
    } = body;

    const errors = []

    if (blockFloorId !== undefined) {
        if (isNaN(blockFloorId) || blockFloorId <= 0) {
            errors.push('blockFloorId is invalid')
        }
    } else if (!isUpdate) {
        errors.push('blockFloorId is missing')
    }

    if (blockId !== undefined) {
        if (isNaN(blockId) || blockId <= 0) {
            errors.push('blockId is invalid')
        }
    } else if (!isUpdate) {
        errors.push('blockId is missing')
    }

    if (roomCapacity !== undefined) {
        if (isNaN(roomCapacity) || roomCapacity <= 0) {
            errors.push('roomCapacity is invalid')
        }
    } else if (!isUpdate) {
        errors.push('roomCapacity is missing')
    }

    if (roomNumber !== undefined) {
        if (isNaN(roomNumber) || roomNumber <= 0) {
            errors.push('roomNumber is invalid')
        }
    } else if (!isUpdate) {
        errors.push('roomNumber is missing')
    }

    if (isActive !== undefined) {
        if (![0, 1].includes(isActive)) {
            errors.push('isActive is invalid')
        }
    } else if (!isUpdate) {
        errors.push('isActive is missing')
    }

    if (isAirConditioner !== undefined) {
        if (![0, 1].includes(isAirConditioner)) {
            errors.push('isAirConditioner is invalid')
        }
    } else if (!isUpdate) {
        errors.push('isAirConditioner is missing')
    }
    return errors
}

function getStudentCountByRoomId(roomId, mysqlClient) {
    return new Promise((resolve, reject) => {
        mysqlClient.query(/*sql*/`SELECT count(*) AS count FROM student WHERE roomId = ? AND deletedAt IS NULL`,
            [roomId],
            (err, roomIdCount) => {
                if (err) {
                    return reject(err)
                }
                resolve(roomIdCount)
            })
    })
}

async function validateUpdateRoom(roomId, mysqlClient, body) {
    if (body.isActive === 0) {
        var [studentRoom] = await getStudentCountByRoomId(roomId, mysqlClient)
        if (studentRoom.count > 0) {
            return false
        }
    }
    return true
}

module.exports = (app) => {
    app.get('/api/room', readRooms)
    app.get('/api/room/:roomId', readRoomById)
    app.get('/api/room/student/count', readStudentOrRoomNumberCountByRoomId)
    app.post('/api/room', createRoom)
    app.put('/api/room/:roomId', updateRoomById)
    app.delete('/api/room/:roomId', deleteRoomById)
}
