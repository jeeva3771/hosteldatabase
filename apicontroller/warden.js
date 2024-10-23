const { mysqlQuery } = require('../utilityclient.js')
const ALLOWED_UPDATE_KEYS = [
    "firstName",
    "lastName",
    "dob",
    "emailId",
    "password",
    "superAdmin"
]
const nodemailer = require('require-nodemailer')
const otpGenerator = require('otp-generator')


async function readWardens(req, res) {
    const mysqlClient = req.app.mysqlClient;
    const limit = req.query.limit ? parseInt(req.query.limit) : null;
    const page = req.query.page ? parseInt(req.query.page) : null;
    const offset = limit && page ? (page - 1) * limit : null;
    const orderBy = req.query.orderby || 'w.firstName';
    const sort = req.query.sort || 'ASC';
    const searchQuery = req.query.search || '';

    var wardensQuery = /*sql*/`
        SELECT 
            w.*,
            ww.firstName AS createdFirstName,
            ww.lastName AS createdLastName,
            ww2.firstName AS updatedFirstName,
            ww2.lastName AS updatedLastName,
            DATE_FORMAT(w.dob, "%y-%b-%D") AS birth,
            DATE_FORMAT(w.createdAt, "%y-%b-%D %r") AS createdTimeStamp,
            DATE_FORMAT(w.updatedAt, "%y-%b-%D %r") AS updatedTimeStamp
            FROM warden AS w
            LEFT JOIN
              warden AS ww ON ww.wardenId = w.createdBy
            LEFT JOIN 
              warden AS ww2 ON ww2.wardenId = w.updatedBy
            WHERE 
              w.deletedAt IS NULL 
            AND (w.firstName LIKE ? OR w.lastName LIKE ?)
            ORDER BY 
              ${orderBy} ${sort}`;

    if (limit && offset !== null) {
        wardensQuery += ` LIMIT ? OFFSET ?`;
    }

    const countQuery = /*sql*/ `
        SELECT COUNT(*) AS totalWardenCount 
        FROM warden 
        WHERE deletedAt IS NULL`;

    try {
        const searchPattern = `%${searchQuery}%`;
        const [wardens, totalCount] = await Promise.all([
            mysqlQuery(wardensQuery, [searchPattern, searchPattern, limit, offset], mysqlClient),
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

async function readWardenById(req, res) {
    const wardenId = req.params.wardenId
    const mysqlClient = req.app.mysqlClient
    try {
        const warden = await mysqlQuery(/*sql*/`
        SELECT 
                w.*,
                ww.firstName AS createdFirstName,
                ww.lastName AS createdLastName,
                ww2.firstName AS updatedFirstName,
                ww2.lastName AS updatedLastName,
                DATE_FORMAT(w.dob, "%y-%b-%D") AS birth,
                DATE_FORMAT(w.createdAt, "%y-%b-%D %r") AS createdTimeStamp,
                DATE_FORMAT(w.updatedAt, "%y-%b-%D %r") AS updatedTimeStamp
                FROM warden AS w
                LEFT JOIN
                warden AS ww ON ww.wardenId = w.createdBy
                LEFT JOIN 
                warden AS ww2 ON ww2.wardenId = w.updatedBy
                WHERE 
                w.deletedAt IS NULL AND w.wardenId = ?`,
            [wardenId],
            mysqlClient
        )
        if (warden.length === 0) {
            return res.status(404).send("wardenId not valid");
        }
        res.status(200).send(warden[0])
    } catch (error) {
        console.log(error)
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
            return res.status(400).send("no insert was made")
        } else {
            res.status(201).send('insert successfully')
        }
    }
    catch (error) {
        res.status(500).send(error.message)
    }
}

async function updateWardenById(req, res) {
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

async function deleteWardenById(req, res) {
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

function logOut(req, res) {
    req.session.destroy((err) => {
        if (err) logger.error();
        res.redirect('http://localhost:1000/login')
    })
}

async function validateEmailId(req, res) {
    const mysqlClient = req.app.mysqlClient;
    const emailId = req.query.emailId;

    try {
        const isValidMail = await mysqlQuery(/*sql*/`SELECT emailId FROM warden WHERE emailId = ? AND deletedAt IS NULL`,
            [emailId],
            mysqlClient)

        if (isValidMail.length === 0) {
            return res.status(404).send('Invalid EmailId')
        }
      var otp =  otpGenerator.generate(6, { digits: true, upperCaseAlphabets: false, lowerCaseAlphabets: false, specialChars: false });

        const sentOtp = await mysqlQuery(/*sql*/`UPDATE warden SET otp = ? WHERE emailId = ?`,
            [otp, isValidMail[0].emailId],
            mysqlClient
        )

        if (sentOtp.affectedRows === 0) {
            return res.status(404).send('No opt made.')
        }

        var transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'jeeva37710@gmail.com',
                pass: 'yios kuac qbqn igcd'
            }
        });

        var mailOptions = {
            from: 'jeeva37710@gmail.com',
            to: isValidMail[0].emailId,
            subject: 'Sending Email using Node.js',
             html: `<h1>otp</h1>:${otp}`
        };

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        });


        

        res.status(200).send('success')
    } catch (error) {
        console.log(error)
        res.status(500).send(error.message)
    }

}


//         var randomPasswordWords = randomstring.generate();

//         var changePassword = await mysqlQuery(/*sql*/`UPDATE warden SET password = ? WHERE emailId = ?`,
//             [randomPasswordWords, isValidMail[0].emailId],
//             mysqlClient
//         )

//         if (changePassword.affectedRows === 0) {
//             return res.status(204).send('No change made.')
//         }
//         var transporter = nodemailer.createTransport({
//             service: 'gmail',
//             auth: {
//                 user: 'jeeva37710@gmail.com',
//                 pass: 'yios kuac qbqn igcd'
//             }
//         });

//         var mailOptions = {
//             from: 'jeeva37710@gmail.com',
//             to: isValidMail[0].emailId,
//             subject: 'Sending Email using Node.js',
//             text: randomPasswordWords
//         };

//         transporter.sendMail(mailOptions, function (error, info) {
//             if (error) {
//                 console.log(error);
//             } else {
//                 console.log('Email sent: ' + info.response);
//             }
//         });

//         res.status(200).send('success')
//     } catch (error) {
//         console.log(error)
//         res.status(500).send(error.message)
//     }
// }


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
    app.post('/api/warden/emailValid', validateEmailId)
    app.get('/api/warden', readWardens)
    app.get('/api/warden/:wardenId', readWardenById)
    app.post('/api/warden', createWarden)
    app.put('/api/warden/:wardenId', updateWardenById)
    app.delete('/api/warden/:wardenId', deleteWardenById)
    app.post('/api/login', authentication)
    app.get('/api/logout', logOut)
}
