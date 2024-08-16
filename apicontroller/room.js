function readRooms(req, res) {
    const mysqlClient = req.app.mysqlClient
    try {
        mysqlClient.query('select * from room where deletedAt is null', (err, rooms) => {
            if (err) {
                res.status(500).send(err.sqlMessage)
            } else {
                res.status(200).send(rooms)
            }
        })
    } catch (error) {
        //res.status(500).send('Internal Server Error')
        res.status(500).send(error)
    }
}

async function readRoom(req, res) {
    const mysqlClient = req.app.mysqlClient;
    const roomId = req.params.roomId;
    try {
        const isValid = await validateRoomById(req)
        if (!isValid) {
            res.status(404).send("roomId not valid")
        }
        mysqlClient.query('select * from room where roomId = ?', [roomId], (err, room) => {
            if (err) {
                res.status(500).send(err.sqlMessage)
            } else {
                res.status(200).send(room[0])
            }
        })
    } catch (error) {
        res.status(500).send(error)
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
        createdBy = 6
    } = req.body

    // if (blockFloorId === '' || blockId === '' || roomNumber === '' || roomCapacity === '' || isActive === '' || isAc === '') {
    //     res.status(400).send(err.sqlMessage)
    // }

    const isValidInsert = await validateInsertItems(req);
    if (!isValidInsert) {
        return res.status(400).send("Invalid input data for room creation");
    }

    const mysqlClient = req.app.mysqlClient

    try {

        mysqlClient.query('insert into room(blockFloorId,blockId,roomNumber,roomCapacity,isActive,isAc,createdBy) values(?,?,?,?,?,?,?)',
            [blockFloorId, blockId, roomNumber, roomCapacity, isActive, isAc, createdBy],
            (err, result) => {
                if (err) {
                    res.status(409).send(err.sqlMessage)
                } else {
                    res.status(201).send('insert successfully')
                }
            })
    } catch (error) {
        console.error(error)
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
        updatedBy = null
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

    if (updatedBy) {
        values.push(updatedBy)
        updates.push(' updatedBy = ?')
    }

    values.push(roomId)
    const mysqlClient = req.app.mysqlClient

    try {
        const isValid = await validateUpdateRoom(req)
        if (!isValid) {
            return res.status(404).send("students in room shift to another room than try");
        }

        mysqlClient.query('update room set ' + updates.join(',') + ' where roomId = ? and deletedAt is null',
            values,
            (err2, result2) => {
                if (err2) {
                    res.status(500).send(err2.sqlMessage)
                } else if (result2.affectedRows === 0) {
                    res.status(204).send("Room not found or no changes made")
                } else {
                    mysqlClient.query('select * from room where roomId = ?', [roomId], (err3, result3) => {
                        if (err3) {
                            res.status(500).send(err3.sqlMessage)
                        } else {
                            res.status(200).send({
                                status: 'successfull',
                                data: result3[0]
                            })
                        }
                    })
                }
            })
    } catch (error) {
        res.status(500).send(error)
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

        mysqlClient.query('update room set deletedAt = now() where roomId = ?', [roomId], (err2, result2) => {
            if (err2) {
                res.status(204).send(err2.sqlMessage)
            } else {
                mysqlClient.query('select * from room where roomId = ?', [roomId], (err3, result3) => {
                    if (err3) {
                        res.status(500).send(err3.sqlMessage);
                    } else {
                        res.status(200).send({
                            status: 'deleted',
                            data: result3[0]
                        });
                    }
                });
            }
        })
    }
    catch (error) {
        res.status(500).send(error)
    }
}

function getStudentCountByRoomId(roomId, mysqlClient) {
    return new Promise((resolve, reject) => {
        mysqlClient.query('select count(*) as count from student where roomId = ? and deletedAt is null',
            [roomId],
            (err, result) => {
                if (err) {
                    return reject(err)
                }
                resolve(result)
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
    if (req.body.roomId === undefined) {
        var deleteRoom = await getRoomById(roomId, mysqlClient)
        if (deleteRoom !== null) {
            return true
        }
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
    if (blockFloorId === '' || 
        blockId === ''|| 
        roomNumber === ''|| 
        roomCapacity === '' || 
        isActive === undefined || 
        isAc === undefined) {
        return false;
    }
    return true;
}

module.exports = (app) => {
    app.get('/api/room', readRooms)
    app.get('/api/room/:roomId', readRoom)
    app.post('/api/room', createRoom)
    app.put('/api/room/:roomId', updateRoom)
    app.delete('/api/room/:roomId', deleteRoom)

}