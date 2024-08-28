const { mysqlQuery, insertedBy } = require('../utilityclient.js')
const ALLOWED_UPDATE_KEYS = [
    "name",
    "dob",
    "emailId",
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
        emailId,
        password,
        createdBy = `${insertedBy}`
    } = req.body

    const isValidInsert = validateInsertItems(req.body);
    if (isValidInsert.length > 0) {
        return res.status(400).send(isValidInsert);
    }

    try {
        const existingWarden = await mysqlQuery(/*sql*/`SELECT * FROM warden WHERE emailId = ?`, [emailId], mysqlClient);
        if (existingWarden.length > 0) {
            return res.status(409).send("emailId already exists");
        }

        const newWarden = await mysqlQuery(/*sql*/`INSERT INTO 
            warden (name,dob,emailId,password,createdBy)
            VALUES(?,?,?,?,?)`,
            [name, dob, emailId, password, createdBy],
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

async function updateWarden(req, res) {
    const wardenId = req.params.wardenId;
    const mysqlClient = req.app.mysqlClient
    const values = []
    const updates = []

    ALLOWED_UPDATE_KEYS.forEach((key) => {
        keyValue = req.body[key]
        if (keyValue !== undefined) {
            values.push(keyValue)
            updates.push(` ${key} = ?`)
        }
    })

    updates.push(`updatedBy = ${insertedBy}`)
    values.push(wardenId)

    try {
        const warden = await validateWardenById(wardenId, mysqlClient)
        if (!warden) {
            return res.status(404).send("warden not found or already deleted");
        }

        const isUpdate = await mysqlQuery(/*sql*/`UPDATE warden SET ${updates.join(', ')} WHERE wardenId = ? AND deletedAt IS NULL`,
            values, mysqlClient)
        if (isUpdate.affectedRows === 0) {
            res.status(204).send("warden not found or no changes made")
        }

        const getUpdatedWarden = await mysqlQuery(/*sql*/`SELECT * FROM warden WHERE wardenId = ?`, [wardenId], mysqlClient)
        res.status(200).send({
            status: 'successfull',
            data: getUpdatedWarden[0]
        })
    } catch (error) {
        res.status(500).send(error.message)
    }
}

async function deleteWarden(req, res) {
    const wardenId = req.params.wardenId;
    const mysqlClient = req.app.mysqlClient;

    try {
        const isValid = await validateWardenById(wardenId, mysqlClient)
        if (!isValid) {
            return res.status(404).send("wardenId is not defined")
        }

        const deletedWarden = await mysqlQuery(/*sql*/`UPDATE warden SET deletedAt = NOW(), deletedBy = ${insertedBy} WHERE wardenId = ? AND deletedAt IS NULL`,
            [wardenId],
            mysqlClient)
        if (deletedWarden.affectedRows === 0) {
            return res.status(404).send("warden not found or already deleted")
        }

        const getDeletedWarden = await mysqlQuery(/*sql*/`SELECT * FROM warden WHERE wardenId = ?`, [wardenId], mysqlClient)
        res.status(200).send({
            status: 'deleted',
            data: getDeletedWarden[0]
        });
    } catch (error) {
        res.status(500).send(error.message)
    }
}

async function authentication(req, res) {
    const mysqlClient = req.app.mysqlClient
    const {
        emailId,
        password
    } = req.body
    try {
        const user = await mysqlQuery(/*sql*/`SELECT * FROM warden WHERE emailId = ? AND password = ?`,
            [emailId, password],
            mysqlClient)
        if (user.length > 0) {
            req.session.isLogged = true
            req.session.data = user[0]
            console.log(req.session)
            res.status(200).send('success')
        } else {
            req.session.isLogged = false
            req.session.data = null
            res.status(409).send('Invalid emailId or password !')
        }
    } catch (error) {
        res.status(500).send(error.message)
    }
}

function validateInsertItems(body) {
    const {
        name,
        dob,
        emailId,
        password
    } = body

    const errors = []
    if (name !== undefined) {
        if (name.length < 2) {
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

    if (emailId !== undefined) {
        if (emailId.length === 0 || !emailId.includes('@') || !emailId.includes('.com')) {
            errors.push('emailId is invalid');
        } 
    } else {
        errors.push('emailId is missing');
    }

    if (password !== undefined) {
        if (password.length < 6) {
            errors.push('password is invalid')
        }
    } else {
        errors.push('password is missing')
    }
    return errors
}

function getWardenById(wardenId, mysqlClient) {
    return new Promise((resolve, reject) => {
        var query = /*sql*/`SELECT * FROM warden WHERE wardenId = ? AND deletedAt IS NULL`
        mysqlClient.query(query, [wardenId], (err, warden) => {
            if (err) {
                return reject(err)
            }
            resolve(warden.length ? warden[0] : null)
        })
    })
}

async function validateWardenById(wardenId, mysqlClient) {
    var warden = await getWardenById(wardenId, mysqlClient)
    if (warden !== null) {
        return true
    }
    return false
}

module.exports = (app) => {
    app.get('/api/warden', readWardens)
    app.get('/api/warden/:wardenId', readWarden)
    app.post('/api/warden', createWarden)
    app.put('/api/warden/:wardenId', updateWarden)
    app.delete('/api/warden/:wardenId', deleteWarden)
    app.post('/api/login', authentication)
}
