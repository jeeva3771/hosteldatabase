const { mysqlQuery, insertedBy } = require('../utilityclient.js')
const ALLOWED_UPDATE_KEYS = [
    "name",
    "dob",
    "username",
    "password"
]

async function readWardens(req, res) {
    const mysqlClient = req.app.mysqlClient
    try {
        const wardens = await mysqlQuery(/*sql*/`SELECT * FROM warden WHERE deletedAt IS NULL`, [], mysqlClient)
        res.status(200).send(wardens)
    } catch (error) {
        res.status(500).send(error.message)
    }
}

async function readWarden(req, res) {
    const wardenId = req.params.wardenId
    const mysqlClient = req.app.mysqlClient
    try {
        const warden = await mysqlQuery(/*sql*/`SELECT * FROM warden WHERE wardenId = ?`, [wardenId], mysqlClient)
        if (warden.length === 0) {
            return res.status(404).send("wardenId not valid");
        }
        res.status(200).send(warden[0])
    } catch (error) {
        res.status(500).send(error.message)
    }
}

async function createWarden(req, res) {
    const mysqlClient = req.app.mysqlClient
    const {
        name,
        dob,
        username,
        password,
        createdBy = `${insertedBy}`
    } = req.body

    const isValidInsert = validateInsertItems(req.body);
    if (isValidInsert.length > 0) {
        return res.status(400).send(isValidInsert);
    }

    try {
        const newWarden = await mysqlQuery(/*sql*/`INSERT INTO 
            warden (name,dob,username,password,createdBy)
            VALUES(?,?,?,?,?)`,
            [name, dob, username, password, createdBy],
            mysqlClient
        )
        if (newWarden.affectedRows === 0) {
            res.status(400).send("no insert was made")
        } else {
            res.status(201).send('insert successfully')
        }
    }
    catch (error) {
        res.status(500).send(error.message)
    }
}

function updateWarden(req, res) {
    const wardenId = req.params.wardenId;
    const mysqlClient = req.app.mysqlClient
    const values = []
    const updates = []

    ALLOWED_UPDATE_KEYS.forEach((key)=> {
        keyValue = req.body[key]
        if(keyValue !== undefined) {
            values.push(keyValue)
            updates.push(` ${key} = ?`)
        }
    })

    updates.push(`updatedBy = ${insertedBy}`)
    values.push(wardenId)

    try {
        mysqlClient.query('update warden set ' + updates.join(',') + ' where wardenId = ?', values, (err, result) => {
            if (err) {
                return res.status(409).send(err.sqlMessage)
            } else {
                mysqlClient.query('select * from warden where wardenId = ?', [wardenId], (err2, result2) => {
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

function deleteWarden(req, res) {
    const wardenId = req.params.wardenId;
    const mysqlClient = req.app.mysqlClient;

    try {
        mysqlClient.query('select * from warden where wardenId = ?', [wardenId], (err, result) => {
            if (err) {
                return res.status(400).send(err.sqlMessage)
            } else {
                mysqlClient.query('update warden set deletedAt = now() where wardenId = ?', [wardenId], (err2, result2) => {
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
        res.status(500).send(error)
    }
}

function validateInsertItems(body) {
    const {
        name,
        dob,
        username,
        password
    } = body

    const errors = []
    if (name !== undefined) {
        if (name <= 0) {
            errors.push('name is invalid')
        }
    } else {
        errors.push('name is missing')
    }

    if (dob !== undefined) {
        const date = new Date(dob);
        if (isNaN(date.getTime())) {
            errors.push('dob is invalid');
        } else {
            const today = new Date();
            if (date > today) {
                errors.push('dob cannot be in the future');
            }
        }
    } else {
        errors.push('dob is missing')
    }

    if (username !== undefined) {
        if (username <= 0) {
            errors.push('username is invalid')
        }
    } else {
        errors.push('username is missing')
    }

    if (password !== undefined) {
        if (password <= 0) {
            errors.push('password is invalid')
        }
    } else {
        errors.push('password is missing')
    }
    return errors
}

module.exports = (app) => {
    app.get('/api/warden', readWardens)
    app.get('/api/warden/:wardenId', readWarden)
    app.post('/api/warden', createWarden)
    app.put('/api/warden/:wardenId', updateWarden)
    app.delete('/api/warden/:wardenId', deleteWarden)
}
