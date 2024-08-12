function readBlockFloor(req, res) {
    const mysqlClient = req.app.mysqlClient
    try {
        mysqlClient.query('select * from blockfloor where deletedAt is null', (err, result) => {
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

function readOneBlockFloor(req, res) {
    const mysqlClient = req.app.mysqlClient;
    const blockFloorId = req.params.blockfloorId;
    try {
        console.log('select * from blockfloor where blockfloorId = ?', [blockFloorId])
        mysqlClient.query('select * from blockfloor where blockfloorId = ?', [blockFloorId], (err, result) => {
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

function createBlockFloor(req, res) {
    const {
        blockId,
        floorNumber,
        isActive,
        createdBy
    } = req.body

    if (blockId === '' || floorNumber === '' || isActive === '' || createdBy === '') {
        res.status(400).send(err.sqlMessage)
    }

    const mysqlClient = req.app.mysqlClient

    try {
            mysqlClient.query('insert into blockfloor (blockId,floorNumber,isActive,createdBy) values(?,?,?,?)', [blockId, floorNumber, isActive, createdBy], (err, result) => {
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

function updateBlockFloor(req, res) {
    const blockFloorId = req.params.blockfloorId;

    const { blockId = null,
        floorNumber = null,
        isActive = null,
        updatedBy = null
    } = req.body;

    const values = []
    const updates = []

    if (blockId) {
        values.push(blockId)
        updates.push(' blockId = ?')
    }

    if (floorNumber) {
        values.push(floorNumber)
        updates.push(' floorNumber = ?')
    }

    if (isActive) {
        values.push(isActive)
        updates.push(' isActive = ?')
    }

    if (updatedBy) {
        values.push(updatedBy)
        updates.push(' updatedBy = ?')
    }

    values.push(blockFloorId)
    const mysqlClient = req.app.mysqlClient

    try {
        mysqlClient.query('update blockfloor set ' + updates.join(',') + ' where blockfloorId = ?', values, (err, result) => {
            if (err) {
                return res.status(409).send(err.sqlMessage)
            } else {
                mysqlClient.query('select * from blockfloor where blockfloorId = ?', [blockFloorId], (err2, result2) => {
                    if (err2) {
                        res.status(409).send(err2.sqlMessage)
                    } else {
                        res.status(200).send({
                            status: 'successfull',
                            data: result2[0]
                        })
                    }
                })
            }
        })
    } catch (error) {
        console.log(error)
    }
}

function deleteBlockFloor(req, res) {
    const blockFloorId = req.params.blockfloorId;
    const mysqlClient = req.app.mysqlClient;

    try {
        mysqlClient.query('select * from blockfloor where blockfloorId = ?', [blockFloorId], (err, result) => {
            if (err) {
                return res.status(400).send(err.sqlMessage)
            } else {
                mysqlClient.query('update blockfloor set deletedAt = now() where blockfloorId = ?', [blockFloorId], (err2, result2) => {
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


module.exports = (app) => {
    app.get('/api/blockfloor', readBlockFloor)
    app.get('/api/blockfloor/:blockfloorId', readOneBlockFloor)
    app.post('/api/blockfloor', createBlockFloor)
    app.put('/api/blockfloor/:blockfloorId', updateBlockFloor)
    app.delete('/api/blockfloor/:blockfloorId', deleteBlockFloor)
}