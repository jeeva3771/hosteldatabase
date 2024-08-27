        var query = isDeletedAtNull ? /*sql*/`SELECT * FROM room WHERE roomId = ?` :
         /*sql*/`SELECT * FROM room WHERE roomId = ? AND deletedAt IS NULL`


        var query = 
         /*sql*/`SELECT * FROM room WHERE roomId = ? ${isDeletedAtNull && AND deletedAt IS NULL}`

         const { mysqlQuery, insertedBy } = require('../utilityclient.js')
const ALLOWED_UPDATE_KEYS = [
    'blockFloorId',
    'blockId',
    'roomNumber',
    'roomCapacity',
    'isActive',
    'isAirConditioner'
]
var isDeletedAtNull = false

async function readRooms(req, res) {
    const mysqlClient = req.app.mysqlClient
    try {
        const rooms = await mysqlQuery(/*sql*/`SELECT * FROM room WHERE deletedAt IS NULL`, [], mysqlClient);
        res.status(200).send(rooms);
    } catch (error) {
        res.status(500).send(error.message)
    }
}

async function readRoom(req, res) {
    const mysqlClient = req.app.mysqlClient;
    const roomId = req.params.roomId;
    try {
        const isValid = await validateRoomById(roomId, mysqlClient, true)
        if (!isValid) {
            return res.status(404).send("roomId not valid")
        }
        const room = await mysqlQuery(/*sql*/`SELECT * FROM room WHERE roomId = ?`, [roomId], mysqlClient)
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
    console.log(isValidInsert)
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
            res.status(201).send('insert successfully')
        }
    } catch (error) {
        console.log(error)
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

        const isValid = await validateUpdateRoom(roomId, mysqlClient, req.body,)
        if (!isValid) {
            return res.status(409).send("students in room shift to another room than try");
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

        const deletedRoom = await mysqlQuery(/*sql*/`UPDATE room SET deletedAt = NOW(), deletedBy = ${insertedBy} WHERE roomId = ? AND deletedAt IS NULL`, [roomId], mysqlClient)
        if (deletedRoom.affectedRows === 0) {
            return res.status(404).send("Room not found or already deleted")
        }

        const getDeletedRoom = await mysqlQuery(/*sql*/`SELECT * FROM room WHERE roomId = ?`, [roomId], mysqlClient)
        res.status(200).send({
            status: 'deleted',
            data: getDeletedRoom[0]
        });
    } catch (error) {
        res.status(500).send(error.message)
    }
}

function getRoomById(roomId, mysqlClient, isDeletedAtNull) {
    return new Promise((resolve, reject) => {
        // var query = isDeletedAtNull ? /*sql*/`SELECT * FROM room WHERE roomId = ?` :
        //  /*sql*/`SELECT * FROM room WHERE roomId = ? AND deletedAt IS NULL`
        var query = /*sql*/`SELECT * FROM room WHERE roomId = ? ${isDeletedAtNull} AND deletedAt IS NULL`
         console.log(query)
        mysqlClient.query(query, [roomId], (err, room) => {
            if (err) {
                return reject(err)
            }
            resolve(room.length ? room[0] : null)
        })
    })
}

async function validateRoomById(roomId, mysqlClient, isDeletedAtNull) {
    var room = await getRoomById(roomId, mysqlClient, isDeletedAtNull)
    if (room !== null) {
        return true
    }
    return false
}

function validateInsertItems(body) {
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
    } else {
        errors.push('blockFloorId is missing')
    }

    if (blockId !== undefined) {
        if (isNaN(blockId) || blockId <= 0) {
            errors.push('blockId is invalid')
        }
    } else {
        errors.push('blockId is missing')
    }

    if (roomCapacity !== undefined) {
        if (isNaN(roomCapacity) || roomCapacity <= 0) {
            errors.push('roomCapacity is invalid')
        }
    } else {
        errors.push('roomCapacity is missing')
    }

    if (roomNumber !== undefined) {
        if (isNaN(roomNumber) || roomNumber <= 0) {
            errors.push('roomNumber is invalid')
        }
    } else {
        errors.push('roomNumber is missing')
    }

    if (isActive !== undefined) {
        if (![0, 1].includes(isActive)) {
            errors.push('isActive is invalid')
        }
    } else {
        errors.push('isActive is missing')
    }

    if (isAirConditioner !== undefined) {
        if (![0, 1].includes(isAirConditioner)) {
            errors.push('isAirConditioner is invalid')
        }
    } else {
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
        return true
    }
}


module.exports = (app) => {
    app.get('/api/room', readRooms)
    app.get('/api/room/:roomId', readRoom)
    app.post('/api/room', createRoom)
    app.put('/api/room/:roomId', updateRoom)
    app.delete('/api/room/:roomId', deleteRoom)
}
