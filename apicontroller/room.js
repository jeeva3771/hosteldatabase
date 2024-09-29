const { mysqlQuery, insertedBy } = require('../utilityclient.js')
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
    const orderBy = req.query.orderby || 'r.roomId';
    const sort = req.query.sort || 'ASC';

    var roomsQuery = /*sql*/`
        SELECT 
            r.*,
            b.floorNumber,
            bk.blockCode,
            w.firstName AS createdFirstName,
            w.lastName AS createdLastName,
            w2.firstName AS updatedFirstName,
            w2.lastName AS updatedLastName,
            DATE_FORMAT(r.createdAt, "%y-%b-%D %r") AS createdAt,
            DATE_FORMAT(r.updatedAt, "%y-%b-%D %r") AS updatedAt
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
              r.deletedAt IS NULL 
            ORDER BY 
              ${orderBy} ${sort}`

    if (limit && offset !== null) {
        roomsQuery += ` LIMIT ? OFFSET ?`;
    }

    const countQuery = /*sql*/ `
    SELECT COUNT(*) AS totalRoomCount 
    FROM room
    WHERE deletedAt IS NULL`;

    try {
        const [rooms, totalCount] = await Promise.all([
            mysqlQuery(roomsQuery, [limit, offset], mysqlClient),
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

async function readRoom(req, res) {
    const mysqlClient = req.app.mysqlClient;
    const roomId = req.params.roomId;
    try {
        const room = await mysqlQuery(/*sql*/`SELECT * FROM room WHERE roomId = ?`, [roomId], mysqlClient)
        if (room.length === 0) {
            return res.status(404).send("roomId not valid");
        }
        res.status(200).send(room[0])
    } catch (error) {
        res.status(500).send(error.message)
    }
}

async function createRoom(req, res) {
    const mysqlClient = req.app.mysqlClient
    const {
        blockFloorId,
        blockId,
        roomNumber,
        roomCapacity,
        isActive,
        isAirConditioner,
        createdBy = `${insertedBy}`
    } = req.body

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

async function updateRoom(req, res) {
    const roomId = req.params.roomId;
    const mysqlClient = req.app.mysqlClient;

    const values = []
    const updates = []

    ALLOWED_UPDATE_KEYS.forEach(key => {
        const keyValue = req.body[key]
        if (keyValue !== undefined) {
            values.push(keyValue)
            updates.push(` ${key} = ?`)
        }
    })

    updates.push(`updatedBy = ${insertedBy}`)
    values.push(roomId)

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

async function deleteRoom(req, res) {
    const roomId = req.params.roomId;
    const mysqlClient = req.app.mysqlClient;

    try {
        const isValid = await validateRoomById(roomId, mysqlClient)
        if (!isValid) {
            return res.status(404).send("roomId is not defined")
        }

        const deletedRoom = await mysqlQuery(/*sql*/`UPDATE room SET deletedAt = NOW(), deletedBy = ${insertedBy} WHERE roomId = ? AND deletedAt IS NULL`,
            [roomId],
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
    // validate isActive
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
    app.get('/api/room/:roomId', readRoom)
    app.post('/api/room', createRoom)
    app.put('/api/room/:roomId', updateRoom)
    app.delete('/api/room/:roomId', deleteRoom)
}
