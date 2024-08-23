const { mysqlQuery } = require('../utilityclient.js')
const ALLOWED_UPDATE_KEYS = [
    "blockCode",
    "location",
    "isActive"
]

async function readBlocks(req, res) {
    const mysqlClient = req.app.mysqlClient
    try {
        const blocks = await mysqlQuery('select * from block where deletedAt is Null', [], mysqlClient)
        res.status(200).send(blocks)
    }
    catch (error) {
        res.status(500).send(error.message)
    }
}

async function readBlock(req, res) {
    const mysqlClient = req.app.mysqlClient;
    const blockId = req.params.blockId;
    try {
        const isValid = await validateBlockById(blockId, mysqlClient)
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
        createdBy = 8
    } = req.body

    const isValidInsert = await validateInsertItems(req);
    if (!isValidInsert) {
        return res.status(400).send("Invalid input data for block creation");
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
        res.status(500).send(error.message)
    }
}

async function updateBlock(req, res) {
    const blockId = req.params.blockId;

    ALLOWED_UPDATE_KEYS.forEach((key)=> {
        const keyValue = req.body[key]
        if(keyValue !== undefined) {
            
        }
    })
    const {
        blockCode = null,
        location = null,
        isActive = null,
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

    updates.push(' updatedBy = 8')

    values.push(blockId)
    const mysqlClient = req.app.mysqlClient

    try {
        const block = await validateBlockById(blockId, mysqlClient);
        if (!block || block.deletedAt !== null) {
            return res.status(404).send("Block not found or already deleted");
        }

        const isValid = await validateUpdateBlock(body, blockId, mysqlClient)
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
        console.log(error)
        res.status(500).send(error.message)
    }
}

async function deleteBlock(req, res) {
    const blockId = req.params.blockId;
    const mysqlClient = req.app.mysqlClient;

    try {
        const isValid = await validateBlockById(blockId, mysqlClient)
        if (!isValid) {
            return res.status(404).send("blockId is not defined")
        }

        const deletedBlock = await mysqlQuery('update block set deletedAt = now(), deletedBy = 8 where blockId = ? and deletedAt is null', [blockId], mysqlClient)
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
        res.status(500).send(error.message)
    }
}

function getBlockById(blockId, mysqlClient) {
    return new Promise((resolve, reject) => {
        mysqlClient.query('select * from block where blockId = ?', [blockId], (err, block) => {
            if (err) {
                return reject(err)
            }
            console.log(block[0])
            resolve(block.length ? block[0] : null)

        })
    })
}

async function validateBlockById(blockId, mysqlClient) {
    var block = await getBlockById(blockId, mysqlClient)
    if (block !== null) {
        return true
    }
    return false
}

async function validateInsertItems(req) {
    const {
        blockCode,
        location,
        isActive
    } = req.body

    if (blockCode === '' || location === '' || isActive === undefined) {
        return false
    }
    return true
}

function getBlockFloorCountByBlockId(blockId, mysqlClient) {
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

async function validateUpdateBlock(body, blockId, mysqlClient) {
    if (body.isActive === 0) {
        var [blockFloorBlock] = await getBlockFloorCountByBlockId(blockId, mysqlClient)
        if (blockFloorBlock.count > 0) {
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
