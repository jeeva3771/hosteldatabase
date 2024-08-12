function readBlock(req, res) {
    const mysqlClient = req.app.mysqlClient
    try {
        mysqlClient.query('select * from block where deletedAt is Null', (err, result) => {
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

function readOneBlock(req, res) {
    const mysqlClient = req.app.mysqlClient;
    const blockId = req.params.blockId;
    try {
        mysqlClient.query('select * from block where blockId = ?', [blockId], (err, result) => {
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

function createBlock(req, res) {
    const {
        blockCode,
        location,
        isActive,
        createdBy
    } = req.body

    if (blockCode === '' || location === '' || isActive === '' || createdBy === '') {
        res.status(400).send(err.sqlMessage)
    }

    const mysqlClient = req.app.mysqlClient

    try {
        mysqlClient.query('insert into block (blockCode,location,isActive,createdBy) values(?,?,?,?)', [blockCode, location, isActive, createdBy], (err, result) => {
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

function updateBlock(req, res) {
    const blockId = req.params.blockId;

    const { blockCode = null,
            location = null,
            isActive = null,
            updatedBy = null
        } = req.body;

    const values = []
    const updates = []

    if (blockCode) {
        values.push(blockCode)
        updates.push(' blockCode = ?')
    }

    if (location) {
        values.push(location)
        updates.push(' location = ?')
    }

    if (isActive) {
        values.push(isActive)
        updates.push(' isActive = ?')
    }

    if (updatedBy) {
        values.push(updatedBy)
        updates.push(' updatedBy = ?')
    }

    values.push(blockId)
    const mysqlClient = req.app.mysqlClient

    try {
        mysqlClient.query('update block set ' + updates.join(',') + ' where blockId = ?', values, (err, result) => {
            if (err) {
                return res.status(409).send(err.sqlMessage)
            } else {
                mysqlClient.query('select * from block where blockId = ?', [blockId], (err2, result2) => {
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

function deleteBlock(req, res) {
    const blockId = req.params.blockId;
    const mysqlClient = req.app.mysqlClient;

    try {
        mysqlClient.query('select * from block where blockId = ?', [blockId], (err, result) => {
            if (err) {
                return res.status(400).send(err.sqlMessage)
            } else {
                mysqlClient.query('update block set deletedAt = now() where blockId = ?', [blockId], (err2, result2) => {
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
    app.get('/api/block', readBlock)
    app.get('/api/block/:blockId', readOneBlock)
    app.post('/api/block/', createBlock)
    app.put('/api/block/:blockId', updateBlock)
    app.delete('/api/block/:blockId', deleteBlock)
}
