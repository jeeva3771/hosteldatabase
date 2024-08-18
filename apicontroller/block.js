const { mysqlQuery } = require('../utilityclient.js')

async function readBlocks(req, res) {
    const mysqlClient = req.app.mysqlClient
    try {
        const blocks = await mysqlQuery('select * from block where deletedAt is Null', [], mysqlClient)
        res.status(200).send(blocks)
    }
    catch (error) {
        res.status(500).send(error.Message)
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

        const block = await mysqlQuery('select * from block where blockId = ?', [blockId], mysqlClient)
        res.status(200).send(block[0])
    } catch (error) {
        res.status(500).send(error.Message)
    }
}

async function createBlock(req, res) {
    const {
        blockCode,
        location,
        isActive,
        createdBy = 6
    } = req.body

    const isValidInsert = await validateInsertItems(req);
    if (!isValidInsert) {
        return res.status(400).send("Invalid input data for room creation");
    }

    const mysqlClient = req.app.mysqlClient

    try {
        const newBlock = await mysqlQuery('insert into block (blockCode,location,isActive,createdBy) values(?,?,?,?)',
            [blockCode, location, isActive, createdBy], mysqlClient)
        if (newBlock.affectedRows === 0) {
            res.status(400).send("no insert was made")
        } else {
            res.status(201).send('insert successfully')
        }
    } catch (error) {
        res.status(500).send(error)
    }
}

async function updateBlock(req, res) {
    const blockId = req.params.blockId;

    const {
        blockCode = null,
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

    if (isActive !== undefined) {
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
        const block = await getBlockById(blockId, mysqlClient);
        if (!block || block.deletedAt !== null) {
            return res.status(404).send("Block not found or already deleted");
        }

        const isValid = await validateUpdateBlock(req)
        if (!isValid) {
            return res.status(409).send("students in block shift to another block");
        }

        const isUpdate = await mysqlQuery('update block set ' + updates.join(',') + ' where blockId = ?', values, mysqlClient)
        if (isUpdate.affectedRows === 0) {
            res.status(204).send("Block not found or no changes made")
        }

        const getUpdatedBlock = await mysqlQuery('select * from block where blockId = ?', [blockId], mysqlClient)
        res.status(200).send({
            status: 'successfull',
            data: getUpdatedBlock[0]
        })
    }
    catch (error) {
        res.status(500).send(error.Message)
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

        const deletedBlock = await mysqlQuery('update block set deletedAt = now() where blockId = ?', [blockId], mysqlClient)
        if (deletedBlock.affectedRows === 0) {
            return res.status(404).send("Block not found or already deleted")
        }

        const getDeletedBlock = await mysqlQuery('select * from block where blockId = ?', [blockId], mysqlClient)
        res.status(200).send({
            status: 'deleted',
            data: getDeletedBlock[0]
        });
    }
    catch (error) {
        res.status(500).send(error.Message)
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

async function validateInsertItems(req) {
    const {
        blockCode,
        location,
        isActive
    } = req.body

    if (blockCode === undefined || location === undefined || isActive === undefined) {
        return false
    }
    return true
}

function getBlockCountByBlockId(blockId, mysqlClient) {
    return new Promise((resolve, reject) => {
        mysqlClient.query('select count(*) as count from blockfloor where blockId = ? and deletedAt is null',
            [blockId],
            (err, blockIdCount) => {
                if (err) {
                    return reject(err)
                }
                resolve(blockIdCount)
            })
    })
}

async function validateUpdateBlock(req) {
    const blockId = req.params.blockId
    const mysqlClient = req.app.mysqlClient

    if (req.body.isActive === 0) {
        var [block] = await getBlockCountByBlockId(blockId, mysqlClient)
        if (block.count > 0) {
            return false
        }
    }
    return true
}


module.exports = (app) => {
    app.get('/api/block', readBlocks)
    app.get('/api/block/:blockId', readBlock)
    app.post('/api/block/', createBlock)
    app.put('/api/block/:blockId', updateBlock)
    app.delete('/api/block/:blockId', deleteBlock)
}
