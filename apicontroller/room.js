const { mysqlQuery } = require('../utilityclient.js')

async function readRooms(req, res) {
    const mysqlClient = req.app.mysqlClient
    try {
        const rooms = await mysqlQuery('select * from room where deletedAt is null', [], mysqlClient);
        res.status(200).send(rooms);
    } catch (error) {
        res.status(500).send(error.message)
    }
}

async function readRoom(req, res) {
    const mysqlClient = req.app.mysqlClient;
    const roomId = req.params.roomId;
    try {
        const isValid = await validateRoomById(req)
        if (!isValid) {
            return res.status(404).send("roomId not valid")
        }
        const room = await mysqlQuery('select * from room where roomId = ?', [roomId], mysqlClient)
        res.status(200).send(room[0])
    } catch (error) {
        res.status(500).send(error.message)
    }
}

async function createRoom(req, res) {
    const {
        blockFloorId,
        blockId,
        roomNumber,
        roomCapacity,
        isActive,
        isAc,
        createdBy = 8
    } = req.body

    const isValidInsert = await validateInsertItems(req);
    if (!isValidInsert) {
        return res.status(400).send("Invalid input data for room creation");
    }

    const mysqlClient = req.app.mysqlClient

    try {
        const newRoom = await mysqlQuery('insert into room(blockFloorId,blockId,roomNumber,roomCapacity,isActive,isAc,createdBy) values(?,?,?,?,?,?,?)',
            [blockFloorId, blockId, roomNumber, roomCapacity, isActive, isAc, createdBy],
            mysqlClient)
        if (newRoom.affectedRows === 0) {
            res.status(400).send("no insert was made")
        } else {
            res.status(201).send('insert successfully')
        }
    } catch (error) {
        res.status(500).send(error.message)
    }
}

async function updateRoom(req, res) {
    const roomId = req.params.roomId;
    const {
        blockFloorId = null,
        blockId = null,
        roomNumber = null,
        roomCapacity = null,
        isActive = null,
        isAc = null,
        updatedBy = 8
    } = req.body;

    const values = []
    const updates = []

    if (blockFloorId) {
        values.push(blockFloorId)
        updates.push(' blockFloorId = ?')
    }

    if (blockId) {
        values.push(blockId)
        updates.push(' blockId = ?')
    }

    if (roomNumber) {
        values.push(roomNumber)
        updates.push(' roomNumber = ?')
    }

    if (roomCapacity) {
        values.push(roomCapacity)
        updates.push(' roomCapacity = ?')
    }

    if (isActive !== undefined) {
        values.push(isActive)
        updates.push(' isActive = ?')
    }

    if (isAc) {
        values.push(isAc)
        updates.push(' isAc = ?')
    }

    values.push(8)
    updates.push(' updatedBy = ?')

    values.push(roomId)
    const mysqlClient = req.app.mysqlClient

    try {
        const room = await validateRoomById(roomId, mysqlClient);
        if (!room || room.deletedAt !== null) {
            return res.status(404).send("Room not found or already deleted");
        }

        const isValid = await validateUpdateRoom(req)
        if (!isValid) {
            return res.status(409).send("students in room shift to another room than try");
        }
        // console.log('update room set'  + updates.join(',') +  'where roomId = ? ')
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
        const isValid = await validateRoomById(req)
        if (!isValid) {
            return res.status(404).send("roomId is not defined")
        }

        const deletedRoom = await mysqlQuery('update room set deletedAt = now(), deletedBy = 8 where roomId = ? and deletedAt is null', [roomId], mysqlClient)
        if (deletedRoom.affectedRows === 0) {
            return res.status(404).send("Room not found or already deleted")

        }

        const getDeletedRoom = await mysqlQuery('select * from room where roomId = ?', [roomId], mysqlClient)
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
        mysqlClient.query('select * from room where roomId = ?', [roomId], (err, room) => {
            if (err) {
                return reject(err)
            }
            resolve(room.length ? room[0] : null)
        })
    })
}

async function validateRoomById(req) {
    const roomId = req.params.roomId
    const mysqlClient = req.app.mysqlClient
    var room = await getRoomById(roomId, mysqlClient)
    if (room !== null) {
        return true
    }
    return false
}

async function validateInsertItems(req) {
    const {
        blockFloorId,
        blockId,
        roomNumber,
        roomCapacity,
        isActive,
        isAc
    } = req.body;
    if (blockFloorId === '' || blockId === '' || roomNumber === '' || roomCapacity === '' || isActive === undefined || isAc === undefined) {
        return false;
    }
    return true;
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

async function validateUpdateRoom(req) {
    const roomId = req.params.roomId
    const mysqlClient = req.app.mysqlClient

    // validate isActive
    if (req.body.isActive === 0) {
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
