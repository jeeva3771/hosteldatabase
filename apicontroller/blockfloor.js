const { mysqlQuery, insertedBy } = require('../utilityclient.js')
const ALLOWED_UPDATE_KEYS = [
    "blockId",
    "floorNumber",
    "isActive"
]

async function readBlockFloors(req, res) {
    const mysqlClient = req.app.mysqlClient
    try {
        const blockFloors = await mysqlQuery(/*sql*/`SELECT * FROM blockfloor WHERE deletedAt IS NULL`, [], mysqlClient)
        res.status(200).send(blockFloors)
    }
    catch (error) {
        res.status(500).send(error.message)
    }
}

async function readBlockFloor(req, res) {
    const mysqlClient = req.app.mysqlClient;
    const blockFloorId = req.params.blockfloorId;

    try {
        const blockFloor = await mysqlQuery(/*sql*/`SELECT * FROM blockfloor WHERE blockfloorId = ?`,
            [blockFloorId],
            mysqlClient
        )
        if (blockFloor.length === 0) {
            return res.status(404).send("blockFloorId not valid");
        }
        res.status(200).send(blockFloor[0])
    }
    catch (error) {
        res.status(500).send(error.message)
    }
}

async function createBlockFloor(req, res) {
    const mysqlClient = req.app.mysqlClient
    const {
        blockId,
        floorNumber,
        isActive,
        createdBy = `${insertedBy}`
    } = req.body

    const isValidInsert = await validateInsertItems(req.body);
    if (isValidInsert.length > 0) {
        return res.status(400).send(isValidInsert);
    }

    try {
        const newBlockFloor = await mysqlQuery(/*sql*/`INSERT INTO blockfloor (blockId,floorNumber,isActive,createdBy)
            VALUES(?,?,?,?)`,
            [blockId, floorNumber, isActive, createdBy],
            mysqlClient
        )
        if (newBlockFloor.affectedRows === 0) {
            res.status(400).send("no insert was made")
        } else {
            res.status(201).send('insert successfully')
        }
    } catch (error) {
        res.status(500).send(error.message)
    }
}

async function updateBlockFloor(req, res) {
    const blockFloorId = req.params.blockfloorId;
    const values = []
    const updates = []

    ALLOWED_UPDATE_KEYS.forEach(key => {
        const keyValue = req.body[key]
        if (keyValue !== undefined) {
            values.push(keyValue)
            updates.push(` ${key} = ?`)
        }
    })

    values.push(blockFloorId)
    updates.push(`updatedBy = ${insertedBy}`)
    const mysqlClient = req.app.mysqlClient

    try {
        const blockFloor = await validateBlockFloorById(blockFloorId, mysqlClient);
        if (!blockFloor) {
            return res.status(404).send("Block not found or already deleted");
        }

        const isValid = await validateUpdateBlockFloor(req)
        if (!isValid) {
            return res.status(409).send("students in blockfloor shift to another blockfloor");
        }

        const isUpdate = await mysqlQuery(/*sql*/`UPDATE blockfloor SET ${updates.join(', ')} WHERE blockfloorId = ?`,
            values,
            mysqlClient
        )
        if (isUpdate.affectedRows === 0) {
            res.status(204).send("Blockfloor not found or no changes made")
        }

        const getUpdatedBlockFloor = await mysqlQuery(/*sql*/`SELECT * FROM blockfloor WHERE blockfloorId = ?`,
            [blockFloorId],
            mysqlClient
        )
        res.status(200).send({
            status: 'successfull',
            data: getUpdatedBlockFloor[0]
        })
    }
    catch (error) {
        res.status(500).send(error.message)
    }
}

async function deleteBlockFloor(req, res) {
    const blockFloorId = req.params.blockfloorId;
    const mysqlClient = req.app.mysqlClient;

    try {
        const isValid = await validateBlockFloorById(blockFloorId, mysqlClient)
        if (!isValid) {
            return res.status(404).send("blockFloorId is not defined")
        }

        const deletedBlockFloor = await mysqlQuery(/*sql*/`UPDATE blockfloor SET deletedAt = NOW(), deletedBy = ${insertedBy} WHERE blockfloorId = ? AND deletedAt IS NULL`,
            [blockFloorId],
            mysqlClient
        )
        if (deletedBlockFloor.affectedRows === 0) {
            return res.status(404).send("Blockfloor not found or already deleted")
        }

        const getDeletedBlockFloor = await mysqlQuery(/*sql*/`SELECT * FROM blockfloor WHERE blockfloorId = ?`,
            [blockFloorId],
            mysqlClient
        )
        res.status(200).send({
            status: 'deleted',
            data: getDeletedBlockFloor[0]
        });
    }
    catch (error) {
        res.status(500).send(error.message)
    }
}

async function validateInsertItems(body) {
    const {
        blockId,
        floorNumber,
        isActive,
    } = body

    const errors = []

    if (blockId !== undefined) {
        if (isNaN(blockId) || blockId <= 0)
            errors.push('blockid is invalid')
    } else {
        errors.push('blockId is missing')
    }

    if (floorNumber !== undefined) {
        if (isNaN(floorNumber) || floorNumber <= 0)
            errors.push('floorNumber is invalid')
    } else {
        errors.push('floorNumber is missing')
    }

    if (isActive !== undefined) {
        if (![0, 1].includes(isActive)) {
            errors.push('isActive is invalid')
        }
    } else {
        errors.push('isActive is missing')
    }
    return errors
}

function getBlockFloorById(blockFloorId, mysqlClient) {
    return new Promise((resolve, reject) => {
        mysqlClient.query(/*sql*/`SELECT * FROM blockfloor WHERE blockfloorId = ?`, [blockFloorId], (err, blockFloor) => {
            if (err) {
                return reject(err)
            }
            resolve(blockFloor.length ? blockFloor[0] : null)
        })
    })
}

async function validateBlockFloorById(blockFloorId, mysqlClient) {
    var blockFloor = await getBlockFloorById(blockFloorId, mysqlClient)
    if (blockFloor !== null) {
        return true
    }
    return false
}

function getRoomCountByBlockFloorId(blockFloorId, mysqlClient) {
    return new Promise((resolve, reject) => {
        mysqlClient.query(/*sql*/`SELECT count(*) AS count FROM room WHERE blockfloorId = ? AND deletedAt IS NULL`,
            [blockFloorId],
            (err, blockFloorIdCount) => {
                if (err) {
                    return reject(err)
                }
                resolve(blockFloorIdCount)
            })
    })
}

async function validateUpdateBlockFloor(req) {
    const blockFloorId = req.params.blockfloorId
    const mysqlClient = req.app.mysqlClient

    if (req.body.isActive === 0) {
        var [roomBlockFloor] = await getRoomCountByBlockFloorId(blockFloorId, mysqlClient)
        if (roomBlockFloor.count > 0) {
            return false
        }
    }
    return true
}

module.exports = (app) => {
    app.get('/api/blockfloor', readBlockFloors)
    app.get('/api/blockfloor/:blockfloorId', readBlockFloor)
    app.post('/api/blockfloor', createBlockFloor)
    app.put('/api/blockfloor/:blockfloorId', updateBlockFloor)
    app.delete('/api/blockfloor/:blockfloorId', deleteBlockFloor)
}
