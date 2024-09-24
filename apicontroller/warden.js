const { mysqlQuery, insertedBy } = require('../utilityclient.js')
const ALLOWED_UPDATE_KEYS = [
    "firstName",
    "lastName",
    "dob",
    "emailId",
    "password",
    "superAdmin"
]

function superAdminValidate(req, res, next) {
    if (!req.session || !req.session.data || req.session.data.superAdmin !== 1) {
        return res.status(403).send('Access denied. Only superAdmin can perform this action.');
    }
    next();
}


async function readWardens(req, res) {
    const mysqlClient = req.app.mysqlClient;
    const limit = parseInt(req.query.limit);
    const page = parseInt(req.query.page);
    const offset = (page - 1) * limit;

    const wardensQuery = /*sql*/`
        SELECT 
            w.*,
            ww.firstName AS createdFirstName,
            ww.lastName AS createdLastName,
            ww2.firstName AS updatedFirstName,
            ww2.lastName AS updatedLastName,
            DATE_FORMAT(w.dob, "%Y-%m-%d") AS dob,
            DATE_FORMAT(w.createdAt, "%Y-%m-%d %T") AS createdAt,
            DATE_FORMAT(w.updatedAt, "%Y-%m-%d %T") AS updatedAt
            FROM warden AS w
            LEFT JOIN
              warden AS ww ON ww.wardenId = w.createdBy
            LEFT JOIN 
              warden AS ww2 ON ww2.wardenId = w.updatedBy
            WHERE 
              w.deletedAt IS NULL 
            ORDER BY 
              w.firstName ASC LIMIT ? OFFSET ?`

    const countQuery = /*sql*/ `
        SELECT COUNT(*) AS totalWardenCount 
        FROM warden 
        WHERE deletedAt IS NULL`;

    try {
        const [wardens, totalCount] = await Promise.all([
            mysqlQuery(wardensQuery, [limit, offset], mysqlClient),
            mysqlQuery(countQuery, [], mysqlClient)
        ]);

        res.status(200).send({
            wardens: wardens,
            wardenCount: totalCount[0].totalWardenCount
        });

    } catch (error) {
        res.status(500).send(error.message);
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
    const mysqlClient = req.app.mysqlClient;
    const {
        firstName,
        lastName,
        dob,
        emailId,
        password,
        superAdmin
    } = req.body
    const createdBy = req.session.data.wardenId;

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
            warden (firstName,lastName,dob,emailId,password,superAdmin,createdBy)
            VALUES(?,?,?,?,?,?,?)`,
            [firstName, lastName, dob, emailId, password, superAdmin, createdBy],
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
    const mysqlClient = req.app.mysqlClient;
    const updatedBy = req.session.data.wardenId;
    const values = []
    const updates = []

    ALLOWED_UPDATE_KEYS.forEach((key) => {
        keyValue = req.body[key]
        if (keyValue !== undefined) {
            values.push(keyValue)
            updates.push(` ${key} = ?`)
        }
    })

    updates.push(`updatedBy = ?`)
    values.push(updatedBy, wardenId)

    try {
        const warden = await validateWardenById(wardenId, mysqlClient)
        if (!warden) {
            return res.status(404).send("warden not found or already deleted");
        }

        const isValidInsert = validateInsertItems(req.body, true);
        if (isValidInsert.length > 0) {
            return res.status(400).send(isValidInsert)
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
    const deletedBy = req.session.data.wardenId;

    try {
        const isValid = await validateWardenById(wardenId, mysqlClient)
        if (!isValid) {
            return res.status(404).send("wardenId is not defined")
        }

        const deletedWarden = await mysqlQuery(/*sql*/`UPDATE warden SET deletedAt = NOW(), deletedBy = ? WHERE wardenId = ? AND deletedAt IS NULL`,
            [deletedBy, wardenId],
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

function validateInsertItems(body, isUpdate = false) {
    const {
        firstName,
        lastName,
        dob,
        emailId,
        password,
        superAdmin
    } = body

    const errors = []
    if (firstName !== undefined) {
        if (firstName.length < 2) {
            errors.push('firstName is invalid')
        }
    } else if (!isUpdate) {
        errors.push('firstName is missing')
    }

    if (lastName !== undefined) {
        if (lastName.length < 1) {
            errors.push('lastName is invalid')
        }
    } else if (!isUpdate) {
        errors.push('lastName is missing')
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
    } else if (!isUpdate) {
        errors.push('dob is missing')
    }

    if (emailId !== undefined) {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        var emailCheck = emailPattern.test(emailId)
        if (emailCheck === false) {
            errors.push('emailId is invalid');
        }
    } else if (!isUpdate) {
        errors.push('emailId is missing');
    }

    if (password !== undefined) {
        if (password.length < 6) {
            errors.push('password is invalid')
        }
    } else if (!isUpdate) {
        errors.push('password is missing')
    }

    if (superAdmin !== undefined) {
        if (![0, 1].includes(superAdmin)) {
            errors.push('superAdmin is invalid')
        }
    } else if (!isUpdate) {
        errors.push('superAdmin is missing')
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
    app.get('/api/warden', superAdminValidate, readWardens)
    app.get('/api/warden/:wardenId', superAdminValidate, readWarden)
    app.post('/api/warden', superAdminValidate, createWarden)
    app.put('/api/warden/:wardenId', superAdminValidate, updateWarden)
    app.delete('/api/warden/:wardenId', superAdminValidate, deleteWarden)
    app.post('/api/login', authentication)

}

// module.exports = (app) => {
//     app.get('/api/warden', readWardens)
//     app.get('/api/warden/:wardenId', readWarden)
//     app.post('/api/warden', createWarden)
//     app.put('/api/warden/:wardenId', updateWarden)
//     app.delete('/api/warden/:wardenId', deleteWarden)
//     app.post('/api/login', authentication)
// }
