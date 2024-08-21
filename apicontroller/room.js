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
        const isValid = await validateRoomById(roomId, mysqlClient)
        if (!isValid) {
            return res.status(404).send("roomId not valid")
        }
        const room = await mysqlQuery(/*sql*/`SELECT * FROM room WHERE roomId = ?`, [roomId], mysqlClient)
        res.status(200).send(room[0])
    } catch (error) {
        res.status(500).send(error.message)
    }
}

// const ALLOWED_CREATE_KEYS = [
//     "blockFloorId",
//     "blockId",
//     "roomNumber",
//     "roomCapacity",
//     "isActive",
//     "isAirConditioner",
//     `createdBy = ${insertedBy}`
// ]
async function createRoom(req, res) {
    const {
        blockFloorId,
        blockId,
        roomNumber,
        roomCapacity,
        isActive,
        isAirConditioner,
        createdBy = insertedBy
    } = req.body

    // ALLOWED_CREATE_KEYS.forEach(key => {
    //     const keyValue = req.body[key]
    // })

    // const isValidInsert = await validateInsertItems(ALLOWED_CREATE_KEYS);
    const isValidInsert = await validateInsertItems(req.body);

    // if (!isValidInsert) {
    //     return res.status(400).send("Invalid input data for room creation");
    // }
    if (isValidInsert) {
        return res.status(400).send(isValidInsert);
    }

    const mysqlClient = req.app.mysqlClient
    try {
        const newRoom = await mysqlQuery(/*sql*/`INSERT INTO 
            room(blockFloorId,blockId,roomNumber,roomCapacity,isActive,isAirConditioner,createdBy) VALUES(?,?,?,?,?,?,?)`,
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
    const mysqlClient = req.app.mysqlClient

    try {
        const room = await validateRoomById(roomId, mysqlClient)
        if (!room) {
            return res.status(404).send("Room not found or already deleted");
        }

        const isValid = await validateUpdateRoom(roomId, ALLOWED_UPDATE_KEYS, mysqlClient)
        if (!isValid) {
            return res.status(409).send("students in room shift to another room than try");
        }
        const isUpdate = await mysqlQuery('update room set ' + updates.join(',') + ' where roomId = ? and deletedAt is null',
            values, mysqlClient)
        if (isUpdate.affectedRows === 0) {
            res.status(204).send("Room not found or no changes made")
        }

        const getUpdatedRoom = await mysqlQuery('select * from room where roomId = ?', [roomId], mysqlClient)
        res.status(200).send({
            status: 'successfull',
            data: getUpdatedRoom[0]
        })
    }
    catch (error) {
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

        const deletedRoom = await mysqlQuery(/*sql*/`UPDATE room SET deletedAt = NOW(),' + + 'WHERE roomId = ? AND deletedAt IS NULL`, [roomId], mysqlClient)
        if (deletedRoom.affectedRows === 0) {
            return res.status(404).send("Room not found or already deleted")
        }

        const getDeletedRoom = await mysqlQuery(/*sql*/`SELECT * FROM room WHERE roomId = ?`, [roomId], mysqlClient)
        res.status(200).send({
            status: 'deleted',
            data: getDeletedRoom[0]
        });
    }
    catch (error) {
        res.status(500).send(error.message)
    }
}

function getRoomById(roomId, mysqlClient) {
    return new Promise((resolve, reject) => {
        mysqlClient.query(/*sql*/`SELECT * FROM ROOM WHERE ROOMID = ?`, [roomId], (err, room) => {
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

// async function validateInsertItems(ALLOWED_CREATE_KEYS) {
//     const {
//         blockFloorId,
//         blockId,
//         roomNumber,
//         roomCapacity,
//         isActive,
//         isAc
//     } = ALLOWED_CREATE_KEYS;

//     if (blockFloorId === '' || blockId === '' || roomNumber === '' || roomCapacity === '' || isActive === undefined || isAc === '') {
//         return false;
//     }
//     return true;
// }

async function validateInsertItems(body) {
    const {
        blockFloorId,
        blockId,
        roomNumber,
        roomCapacity,
        isActive,
        isAirConditioner
    } = body;

    if (blockFloorId === '' || blockId === '' || roomNumber === '' || roomCapacity === '' || isActive === undefined || isAirConditioner === '') {
        return false;
    }

    if (
        typeof blockFloorId !== 'number' || blockFloorId <= 0 ||
        typeof blockId !== 'number' || blockId <= 0 ||
        typeof roomNumber !== 'number' || roomNumber <= 0 ||
        typeof roomCapacity !== 'number' || roomCapacity <= 0 ||
        typeof isActive !== 'boolean' ||
        typeof isAirConditioner !== 'boolean'
    ) {
        if(blockFloorId !== 'number' || blockFloorId <= 0) {
            return "blockFloorId is not a number or negative value"
        }

        if(blockId !== 'number' || blockId <= 0) {
            return "blockId is not a number or negative value"
        }

        if(roomCapacity !== 'number' || roomCapacity <= 0) {
            return "roomCapacity is not a number or negative value"
        }

        if(roomNumber !== 'number' || roomNumber <= 0) {
            return "roomNumber is not a number or negative value"
        }

        if(isActive !== 'boolean') {
            return "blockFloorId is not a boolean"
        }

        if(isAirConditioner !== 'boolean') {
            return "isActive is not a boolean"
        }
    
    }
    return true
}


function getStudentCountByRoomId(roomId, mysqlClient) {
    return new Promise((resolve, reject) => {
        mysqlClient.query('select count(*) as count from student where roomId = ? and deletedAt is null',
            [roomId],
            (err, roomIdCount) => {
                if (err) {
                    return reject(err)
                }
                resolve(roomIdCount)
            })
    })
}

async function validateUpdateRoom(roomId, ALLOWED_UPDATE_KEYS, mysqlClient) {
    // validate isActive
    if (ALLOWED_UPDATE_KEYS.isActive === 0) {
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
