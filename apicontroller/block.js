const { mysqlQuery, insertedBy } = require('../utilityclient.js')
const ALLOWED_UPDATE_KEYS = [
    "blockCode",
    "location",
    "isActive"
]

async function readBlocks(req, res) {
    const mysqlClient = req.app.mysqlClient
    try {
        const blocks = await mysqlQuery(/*sql*/`SELECT * FROM BLOCK WHERE deletedAt IS NULL`, [], mysqlClient)
        res.status(200).send(blocks)
    } catch (error) {
        res.status(500).send(error.message)
    }
}

async function readBlock(req, res) {
    const mysqlClient = req.app.mysqlClient;
    const blockId = req.params.blockId;
    try {
        const block = await mysqlQuery(/*sql*/`SELECT * FROM BLOCK WHERE blockId = ?`, [blockId], mysqlClient)
        if (block.length === 0) {
            return res.status(404).send("blockId not valid");
        }
        res.status(200).send(block[0])
    } catch (error) {
        res.status(500).send(error.message)
    }
}

async function createBlock(req, res) {
    const mysqlClient = req.app.mysqlClient
    const {
        blockCode,
        location,
        isActive,
        createdBy = `${insertedBy}`
    } = req.body

    const isValidInsert = validateInsertItems(req.body);
    if (isValidInsert.length > 0) {
        return res.status(400).send(isValidInsert)
    }

    try {
        const existingBlockCode = await mysqlQuery(/*sql*/`SELECT * FROM block WHERE blockCode = ?`,
            [blockCode],
            mysqlClient
        );
        if (existingBlockCode.length > 0) {
            return res.status(409).send("blockCode already exists");
        }

        const newBlock = await mysqlQuery(/*sql*/`INSERT INTO BLOCK (blockCode,location,isActive,createdBy) VALUES(?,?,?,?)`,
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

    const values = []
    const updates = []

    ALLOWED_UPDATE_KEYS.forEach((key) => {
        const keyValue = req.body[key]
        if (keyValue !== undefined) {
            values.push(keyValue)
            updates.push(` ${key} = ?`)
        }
    })

    updates.push(`updatedBy = ${insertedBy}`)
    values.push(blockId)

    const mysqlClient = req.app.mysqlClient

    try {
        const block = await validateBlockById(blockId, mysqlClient);
        if (!block) {
            return res.status(404).send("Block not found or already deleted");
        }

        const isValid = await validateUpdateBlock(blockId, mysqlClient, req.body,)
        if (!isValid) {
            return res.status(409).send("students in block shift to another block");
        }

        const isUpdate = await mysqlQuery(/*sql*/`UPDATE block SET  ${updates.join(', ')} WHERE blockId = ? AND deletedAt IS NULL`,
            values, mysqlClient
        )
        if (isUpdate.affectedRows === 0) {
            res.status(204).send("Block not found or no changes made")
        }

        const getUpdatedBlock = await mysqlQuery(/*sql*/`SELECT * FROM block WHERE blockId = ?`,
            [blockId], mysqlClient)
        res.status(200).send({
            status: 'successfull',
            data: getUpdatedBlock[0]
        })
    }
    catch (error) {
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

        const deletedBlock = await mysqlQuery(/*sql*/`UPDATE block SET deletedAt = NOW(), deletedBy = ${insertedBy} WHERE blockId = ? AND deletedAt IS NULL`, [blockId], mysqlClient)
        if (deletedBlock.affectedRows === 0) {
            return res.status(404).send("Block not found or already deleted")
        }

        const getDeletedBlock = await mysqlQuery(/*sql*/`SELECT * FROM block WHERE blockId = ?`, [blockId], mysqlClient)
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
        mysqlClient.query(/*sql*/`SELECT * FROM block WHERE blockId = ?`, [blockId], (err, block) => {
            if (err) {
                return reject(err)
            }
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

function validateInsertItems(body) {
    const {
        blockCode,
        location,
        isActive
    } = body

    const errors = []

    if (blockCode !== undefined) {
        if (blockCode <= 0) {
            errors.push("blockCode is invalid")
        }
    } else {
        errors.push("blockCode is missing")
    }

    if (location !== undefined) {
        if (location <= 0) {
            errors.push("location is invalid")
        }
    } else {
        errors.push("location is missing")
    }

    if (isActive !== undefined) {
        if (![0, 1].includes(isActive)) {
            errors.push("isActive is invalid")
        }
    } else {
        errors.push("isActive is missing")
    }
    return errors
}

function getBlockFloorCountByBlockId(blockId, mysqlClient) {
    return new Promise((resolve, reject) => {
        mysqlClient.query(/*sql*/`SELECT count(*) AS count FROM blockfloor WHERE blockId = ? AND deletedAt IS NULL`,
            [blockId],
            (err, blockIdCount) => {
                if (err) {
                    return reject(err)
                }
                resolve(blockIdCount)
            })
    })
}

async function validateUpdateBlock(blockId, mysqlClient, body) {
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
