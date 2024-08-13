function readRoom(req, res) {
    const mysqlClient = req.app.mysqlClient
    try {
        mysqlClient.query('select * from room where deletedAt is null', (err, result) => {
            if (err) {
                res.status(409).send(err.sqlMessage)
            } else {
                res.status(200).send(result)
            }
        })
    } catch (error) {
        console.log(error)
    }
}

function readOneRoom(req, res) {
    const mysqlClient = req.app.mysqlClient;
    const roomId = req.params.roomId;
    try {
        mysqlClient.query('select * from room where roomId = ?', [roomId], (err, result) => {
            if (err) {
                res.status(404).send(err.sqlMessage)
            } else {
                res.status(200).send(result[0])
            }
        })
    } catch (error) {
        console.log(error)
    }
}

function createRoom(req, res) {
    const { blockFloorId,
        blockId,
        roomNumber,
        roomCapacity,
        isActive,
        isAc,
        createdBy
    } = req.body

    if (blockFloorId === '' || blockId === '' || roomNumber === '' || roomCapacity === '' || isActive === '' || isAc === '' || createdBy === '') {
        res.status(400).send(err.sqlMessage)
    }

    const mysqlClient = req.app.mysqlClient

    try {
        mysqlClient.query('insert into room(blockFloorId,blockId,roomNumber,roomCapacity,isActive,isAc,createdBy) values(?,?,?,?,?,?,?)', [blockFloorId, blockId, roomNumber, roomCapacity, isActive, isAc, createdBy], (err, result) => {
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

    const { blockFloorId = null,
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
        if (isActive === 0) {
            mysqlClient.query('select count(*) as count from student where roomId = ? and deletedAt is null', [roomId], (err, result) => {
                if (err) {
                    return res.status(400).send(err.sqlMessage)
                } else {
                    if (result[0].count === 0) {
                        mysqlClient.query('update room set ' + updates.join(',') + ' where roomId = ?', values, (err2, result2) => {
                            if (err2) {
                                return res.status(409).send(err2.sqlMessage)
                            } else {
                                mysqlClient.query('select * from room where roomId = ?', [roomId], (err3, result3) => {
                                    if (err3) {
                                        res.status(409).send(err3.sqlMessage)
                                    } else {
                                        res.status(200).send({
                                            status: 'successfull',
                                            data: result3[0]
                                        })
                                    }
                                })
                            }
                        })
                    } else {
                        return res.status(409).send("students in room shift to another room than try");
                    }
                }
            })
        }
    }
    catch (error) {
        console.log(error)
    }
}

function deleteRoom(req, res) {
    const roomId = req.params.roomId;
    const mysqlClient = req.app.mysqlClient;

    try {
        mysqlClient.query('select * from room where roomId = ?', [roomId], (err, result) => {
            if (err) {
                return res.status(400).send(err.sqlMessage)
            } else {
                mysqlClient.query('update room set deletedAt = now() where roomId = ?', [roomId], (err2, result2) => {
                    if (err2) {
                        res.status(400).send(err.sqlMessage)
                    } else {
                        res.status(200).send({
                            status: 'deleted',
                            data: result[0]
                        })
                    }
                })
            }
        })
    } catch (error) {
        console.log(error)
    }
}

// async function validateRoomUpdate(req) {

// }


module.exports = (app) => {
    app.get('/api/room', readRoom)
    app.get('/api/room/:roomId', readOneRoom)
    app.post('/api/room', createRoom)
    app.put('/api/room/:roomId', updateRoom)
    app.delete('/api/room/:roomId', deleteRoom)

}