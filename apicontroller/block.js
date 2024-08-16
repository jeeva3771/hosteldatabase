function readBlocks(req, res) {
    const mysqlClient = req.app.mysqlClient
    try {
        mysqlClient.query('select * from block where deletedAt is Null', (err, blocks) => {
            if (err) {
                res.status(500).send(err.sqlMessage)
            } else {
                res.status(200).send(blocks)
            }
        })
    } catch (error) {
        res.status(500).send(error)
    }
}

async function readBlock(req, res) {
    const mysqlClient = req.app.mysqlClient;
    const blockId = req.params.blockId;
    try {
        const isValid = await validateBlockById(req)
        if (!isValid) {
            return res.status(404).send("blockId is not defined")
        }
        
        mysqlClient.query('select * from block where blockId = ?', [blockId], (err, block) => {
            if (err) {
                res.status(500).send(err.sqlMessage)
            } else {
                res.status(200).send(block[0])
            }
        })
    } catch (error) {
        res.status(500).send(error)
    }
}

function createBlock(req, res) {
    const {
        blockCode,
        location,
        isActive,
        createdBy = 6
    } = req.body

    if (blockCode === '' || location === '' || isActive === '') {
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
        res.status(500).send(error)
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
        res.status(500).send(error)
    }
}

async function deleteBlock(req, res) {
    const blockId = req.params.blockId;
    const mysqlClient = req.app.mysqlClient;

    try {
        const isValid = await validateBlockById(req)
        if (!isValid) {
            return res.status(404).send("blockId is not defined")
        }

        mysqlClient.query('update block set deletedAt = now() where blockId = ?', [blockId], (err2, result2) => {
            if (err2) {
                res.status(500).send(err2.sqlMessage)
            } else {
                mysqlClient.query('select * from block where blockId = ?', [blockId], (err3, result3) => {
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

function getBlockById(blockId, mysqlClient) {
    return new Promise((resolve, reject) => {
        mysqlClient.query('select * from block where blockId = ?', [blockId], (err, block) => {
            if (err) {
                return reject(err)
            }
            resolve(block.length ? block[0] : null)
        })
    })
}

async function validateBlockById(req) {
    const blockId = req.params.blockId
    const mysqlClient = req.app.mysqlClient

    if (req.body.blockId === undefined) {
        var deleteBlock = await getBlockById(blockId, mysqlClient)

        if (deleteBlock !== null) {
            return true
        }
    }
    return false
}


module.exports = (app) => {
    app.get('/api/block', readBlocks)
    app.get('/api/block/:blockId', readBlock)
    app.post('/api/block/', createBlock)
    app.put('/api/block/:blockId', updateBlock)
    app.delete('/api/block/:blockId', deleteBlock)
}
