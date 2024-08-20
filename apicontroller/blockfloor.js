const { mysqlQuery } = require('../utilityclient.js')

async function readBlockFloors(req, res) {
    const mysqlClient = req.app.mysqlClient
    try {
        const blockFloors = await mysqlQuery('select * from blockfloor where deletedAt is null', [], mysqlClient)
        res.status(200).send(blockFloors)
    }
    catch (error) {
        res.status(500).send(error.Message)
    }
}

async function readBlockFloor(req, res) {
    const mysqlClient = req.app.mysqlClient;
    const blockFloorId = req.params.blockfloorId;

    try {
        const isValid = await validateBlockFloorById(req)
        if (!isValid) {
            return res.status(404).send("blockfloorId is not defined")
        }

        const blockFloor = await mysqlQuery('select * from blockfloor where blockfloorId = ?', [blockFloorId], mysqlClient)
        res.status(200).send(blockFloor[0])
    }
    catch (error) {
        res.status(500).send(error.message)
    }
}

async function createBlockFloor(req, res) {
    const {
        blockId,
        floorNumber,
        isActive,
        createdBy = 6
    } = req.body

    const isValidInsert = await validateInsertItems(req);
    if (!isValidInsert) {
        return res.status(400).send("Invalid input data for blockfloor creation");
    }

    const mysqlClient = req.app.mysqlClient

    try {
        const newBlockFloor = await mysqlQuery('insert into blockfloor (blockId,floorNumber,isActive,createdBy) values(?,?,?,?)', [blockId, floorNumber, isActive, createdBy], mysqlClient)
        if (newBlockFloor.affectedRows === 0) {
            res.status(400).send("no insert was made")
        } else {
            res.status(201).send('insert successfully')
        }
    } catch (error) {
        res.status(500).send(error.Message)
    }
}

async function updateBlockFloor(req, res) {
    const blockFloorId = req.params.blockfloorId;

    const {
        blockId = null,
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
        const blockFloor = await validateBlockFloorById(blockFloorId, mysqlClient);
        if (!blockFloor || blockFloor.deletedAt !== null) {
            return res.status(404).send("Block not found or already deleted");
        }

        const isValid = await validateUpdateBlockFloor(req)
        if (!isValid) {
            return res.status(409).send("students in blockfloor shift to another blockfloor");
        }

        const isUpdate = await mysqlQuery('update blockfloor set ' + updates.join(',') + ' where blockfloorId = ?', values, mysqlClient)
        if (isUpdate.affectedRows === 0) {
            res.status(204).send("Blockfloor not found or no changes made")
        }

        console.log('select * from blockfloor where blockfloorId = ?')
        const getUpdatedBlockFloor = await mysqlQuery('select * from blockfloor where blockfloorId = ?', [blockFloorId], mysqlClient)
        res.status(200).send({
            status: 'successfull',
            data: getUpdatedBlockFloor[0]
        })
    }
    catch (error) {
        res.status(500).send(error.Message)
    }
}

async function deleteBlockFloor(req, res) {
    const blockFloorId = req.params.blockfloorId;
    const mysqlClient = req.app.mysqlClient;

    try {
        const isValid = await validateBlockFloorById(req)
        if (!isValid) {
            return res.status(404).send("blockFloorId is not defined")
        }

        const deletedBlockFloor = await mysqlQuery('update blockfloor set deletedAt = now(), deletedBy = 8 where blockfloorId = ? and deletedAt is null', [blockFloorId], mysqlClient)
        if (deletedBlockFloor.affectedRows === 0) {
            return res.status(404).send("Blockfloor not found or already deleted")
        }

        const getDeletedBlockFloor = await mysqlQuery('select * from blockfloor where blockfloorId = ?', [blockFloorId], mysqlClient)
        res.status(200).send({
            status: 'deleted',
            data: getDeletedBlockFloor[0]
        });
    }
    catch (error) {
        res.status(500).send(error.message)
    }
}

async function validateInsertItems(req) {
    const {
        blockId,
        floorNumber,
        isActive,
    } = req.body

    if (blockId === '' || floorNumber === '' || isActive === undefined) {
        return false
    }
    return true;
}

function getBlockFloorById(blockFloorId, mysqlClient) {
    return new Promise((resolve, reject) => {
        mysqlClient.query('select * from blockfloor where blockfloorId = ?', [blockFloorId], (err, blockFloor) => {
            if (err) {
                return reject(err)
            }
            resolve(blockFloor.length ? blockFloor[0] : null)
        })
    })
}

async function validateBlockFloorById(req) {
    const blockFloorId = req.params.blockfloorId
    const mysqlClient = req.app.mysqlClient
    if (req.body.blockFloorId === undefined) {
        var [blockFloor] = await getBlockFloorById(blockFloorId, mysqlClient)
        if (blockFloor !== null) {
            return true
        }
    }
    return false
}

function getroomCountByBlockFloorId(blockFloorId, mysqlClient) {
    return new Promise((resolve, reject) => {
        mysqlClient.query('select count(*) as count from room where blockfloorId = ? and deletedAt is null',
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
    const blockFloorId = req.params.roomId
    const mysqlClient = req.app.mysqlClient

    if (req.body.isActive === 0) {
        var [roomBlockFloor] = await getroomCountByBlockFloorId(blockFloorId, mysqlClient)
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