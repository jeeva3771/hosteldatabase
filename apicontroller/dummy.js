const { mysqlQuery } = require('../utilityclient.js')
const ALLOWED_UPDATE_KEYS = [
    "firstName",
    "lastName",
    "dob",
    "emailId",
    "password",
    "superAdmin"
]
var nodemailer = require('nodemailer');
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
    const emailId = req.body.emailId;

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
             html: `<h1>Email confirm otp: </h1>${otp}`
        };

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        });
        req.session.warden = isValidMail[0].emailId

        res.status(200).send('success')
    } catch (error) {
        console.log(error)
        res.status(500).send(error.message)
    }
}

async function enterOtp(req, res) {
    const mysqlClient = req.app.mysqlClient;
    const otp = req.body.otp;
    try {
        const validOtp = await mysqlQuery(/*sql*/`SELECT otp FROM warden WHERE otp = ? AND deletedAt IS NULL`,
            [otp],
            mysqlClient)

        if (validOtp.length === 0) {
            return res.status(204).send('No otp content')
        }
        res.status(200).send('success')
    } catch (error) {
        res.status(500).send(error.message)
    }
}

async function createNewPassword(req, res) {
    const mysqlClient = req.app.mysqlClient;
    const emailId = req.session.warden;
    const password = req.body.password;

    try {
        const setNewPassword = await mysqlQuery(/*sql*/`UPDATE warden SET password = ?, otp = ? WHERE emailId = ? `,
            [password, null, emailId],
            mysqlClient)

        if (setNewPassword.affectedRows === 0) {
            return res.status(204).send('no content change')
        }

        req.session.warden = null

        res.status(200).send('success')
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
    app.post('/api/warden/emailValid', validateEmailId)
    app.post('/api/warden/otp', enterOtp)
    app.post('/api/warden/newPassword', createNewPassword)
    app.get('/api/warden', readWardens)
    app.get('/api/warden/:wardenId', readWardenById)
    app.post('/api/warden', createWarden)
    app.put('/api/warden/:wardenId', updateWardenById)
    app.delete('/api/warden/:wardenId', deleteWardenById)
    app.post('/api/login', authentication)
    app.get('/api/logout', logOut)
}
let currentTime = new Date(); // Step 1: Get the current time
console.log('Current Time:', currentTime);

// Step 2: Add 3 hours to the current time
let timeAfter3Hours = new Date(currentTime.getTime() + 3 * 60 * 60 * 1000);
console.log('Time After Adding 3 Hours:', timeAfter3Hours);

// Step 3: Reduce the time by 3 hours to get back to the original time
let timeReducedBy3Hours = new Date(timeAfter3Hours.getTime() - 3 * 60 * 60 * 1000);
console.log('Time After Reducing 3 Hours:', timeReducedBy3Hours);

// Step 4: Clear the time variable (optional)
timeReducedBy3Hours = null;
console.log('Time Cleared:', timeReducedBy3Hours);
const { mysqlQuery, sendEmail } = require('../utilityclient.js')
const ALLOWED_UPDATE_KEYS = [
    "firstName",
    "lastName",
    "dob",
    "emailId",
    "password",
    "superAdmin"
]
const otpGenerator = require('otp-generator');
const otpLimitNumber = 6;
const otpOption = {
    digits: true,
    upperCaseAlphabets: true,
    lowerCaseAlphabets: true,
    specialChars: false
}


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

async function generateOtp(req, res) {

    const mysqlClient = req.app.mysqlClient;
    const {
        emailId = null
    } = req.body

    try {
        const isValidMail = await mysqlQuery(/*sql*/`SELECT emailId FROM warden WHERE emailId = ? AND deletedAt IS NULL`,
            [emailId],
            mysqlClient)

        if (isValidMail.length === 0) {
            return res.status(404).send('Invalid EmailId')
        }
        var otp = otpGenerator.generate(otpLimitNumber, otpOption);

        const sendOtp = await mysqlQuery(/*sql*/`UPDATE warden SET otp = ? WHERE emailId = ?`,
            [otp, isValidMail[0].emailId],
            mysqlClient
        )

        if (sendOtp.affectedRows === 0) {
            return res.status(404).send('No OTP made.')
        }

        await sendEmail(isValidMail[0].emailId, otp, res)
        req.session.warden = isValidMail[0].emailId

        res.status(200).send('success')
    } catch (error) {
        console.log(error)
        res.status(500).send(error.message)
    }
}

// async function submitOtpAndNewPassword(req, res) {
//     const mysqlClient = req.app.mysqlClient;
//     const emailId = req.session.warden;
//     const {
//         password = null,
//         otp = null
//     } = req.body

//     try {
//         const validOtp = await mysqlQuery(/*sql*/`
//         SELECT otp, otpAttempt, otpTiming FROM warden WHERE otp = ? AND emailId = ? AND deletedAt IS NULL`,
//             [otp, emailId],
//             mysqlClient
//         )

//         if (validOtp.length === 0) {
//             return res.status(204).send('No otp content')
//         }

//         // let currentTime = new Date();

//         // let timeAfter3Hours = new Date(currentTime.getTime() + 3 * 60 * 60 * 1000);

//         // let timeReducedBy3Hours = new Date(timeAfter3Hours.getTime() - 3 * 60 * 60 * 1000);

//         // timeReducedBy3Hours = null;

//         const setNewPassword = await mysqlQuery(/*sql*/`
//            UPDATE warden 
//                 SET 
//                     password = ?, 
//                     otpAttempt = CASE 
//                         WHEN otpAttempt IS NULL THEN 2  
//                         WHEN otpAttempt = 1 THEN NULL  
//                         WHEN otpAttempt >= 1 THEN otpAttempt - 1  
//                         ELSE otpAttempt
//                     END,
//                     otpTiming = CASE
//                         WHEN otpAttempt IS NULL THEN NOW()
//                         ELSE otpTiming
//                     END
//                 WHERE emailId = ?`,
//             [password, emailId],
//             mysqlClient
//         )

//         if (setNewPassword.affectedRows === 0) {
//             return res.status(404).send('No content changes')
//         }

//        return res.status(200).send('success')
//     } catch (error) {
//         return res.status(500).send('An error occurred');
//     }
// }

async function submitOtpAndNewPassword(req, res) {
    const mysqlClient = req.app.mysqlClient;
    const emailId = req.session.warden;
    const { password = null, otp = null } = req.body;
    console.log('welcome')
    try {
        const validOtp = await mysqlQuery(/*sql*/`
            SELECT otp
            FROM warden 
            WHERE otp = ? AND emailId = ? AND deletedAt IS NULL`,
            [otp, emailId],
            mysqlClient
        );

        const validOtpTiming = await mysqlQuery(/*sql*/`
            SELECT otpTiming
            FROM warden 
            WHERE AND emailId = ? AND deletedAt IS NULL`,
            [emailId],
            mysqlClient
            )

        if (validOtp.length === 0 && validOtpTiming[0].otpTiming > 0) {
           var validOtpLengthZero = await mysqlQuery(/*sql*/`
            UPDATE warden 
                SET  
                otpAttempt = CASE 
                    WHEN otpAttempt IS NULL THEN 2  
                    WHEN otpAttempt = 1 THEN NULL  
                    WHEN otpAttempt >= 1 THEN otpAttempt - 1  
                    ELSE otpAttempt
                END,
                otpTiming = CASE
                    WHEN otpAttempt IS NULL THEN DATE_ADD(NOW(), INTERVAL 3 HOUR) 
                    ELSE otpTiming  
                END
            WHERE emailId = ?`,
                [emailId],
                mysqlClient
            )

            if (validOtpLengthZero.affectedRows === 0) {
                return res.status(404).send('No content changed')
            }

            return res.status(200).send('OTP invalid');
        } else {
           var updatedNewPassword = await mysqlClient(/*sql*/` 
            UPDATE warden SET password = ?, 
                WHERE emailId = ? AND otp = ? AND otpTiming > NOW() AND deletedAt IS NULL`,
                [password, emailId, otp],
                mysqlClient)

                if (updatedNewPassword.affectedRows === 0) {
                    return res.status(404).send('You was block for few hours')
                }
                return res.status(200).send('success');
        }

         res.status(500).send()

        // const getOtpAttempt = await mysqlQuery(/*sql*/`
        //        SELECT otpAttempt 
        //       FROM warden 
        //          WHERE emailId = ? AND deletedAt IS NULL`,
        //     [otp, emailId],
        //     mysqlClient
        // );

        //  if (getOtpAttempt.length === 0) {
        //     return res.status(204).send('No content');
        // }

        // const { otpAttempt } = getOtpAttempt[0];

        // let newOtpAttempt;
        // if (otpAttempt === null) {
        //     newOtpAttempt = 2;
        // } else if (otpAttempt === 1) {
        //     newOtpAttempt = null;
        // } else {
        //     newOtpAttempt = otpAttempt - 1;
        // }

        // console.log(`New otpAttempt value: ${newOtpAttempt}`);

        // const setNewPassword = await mysqlQuery(/*sql*/`
        //     UPDATE warden 
        //         SET 
        //             password = ?, 
        //             otpAttempt = CASE 
        //                 WHEN otpAttempt IS NULL THEN 2  
        //                 WHEN otpAttempt = 1 THEN NULL  
        //                 WHEN otpAttempt >= 1 THEN otpAttempt - 1  
        //                 ELSE otpAttempt
        //             END,
        //             otpTiming = CASE
        //                 WHEN otpAttempt IS NULL THEN NOW() 
        //                 ELSE otpTiming  
        //             END
        //         WHERE emailId = ? OR otp = ?`,
        //     [password, emailId, otp],
        //     mysqlClient
        // );

        // console.log('Update result:', setNewPassword);

        // if (setNewPassword.affectedRows === 0) {
        //     console.log('lspddppppppppppp')
        //     return res.status(404).send('No content changes');
        // }

    } catch (error) {
        console.log(error);
        return res.status(500).send('An error occurred');
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
    app.post('/api/warden/generateOtp', generateOtp)
    app.post('/api/warden/newPassword', submitOtpAndNewPassword)
    app.get('/api/warden', readWardens)
    app.get('/api/warden/:wardenId', readWardenById)
    app.post('/api/warden', createWarden)
    app.put('/api/warden/:wardenId', updateWardenById)
    app.delete('/api/warden/:wardenId', deleteWardenById)
    app.post('/api/login', authentication)
    app.get('/api/logout', logOut)
}



<%- include('../partials/header.ejs', { isMenuVisible : false, title: 'ResetPassword' , breadcrumb: []}) %>
    <form class="container">
        <div class="row justify-content-center mt-5">
            <div class="col-4">
                <div class="border">
                    <form>
                        <h3 class="font-weight-bold text-center mb-3">Forgotten Password ?</h3>
                        <div id="emailValid">
                            <div class="mb-3">
                                <label for="emailId" class="form-label">Email</label>
                                <input type="text" class="form-control" id="emailId" placeholder="Enter email"
                                    aria-describedby="emailHelp" onkeyup="toggleButton()">
                                <small id="errorFirst" class="errorContent"></small>
                            </div>
                            <div class="col d-flex justify-content-center mb-2">
                                <button type="button" class="btn btn-primary" id="sendOtp"
                                    onclick="generateOtp()" disabled>Generate OTP</button>
                            </div>
                        </div>
                        <div id="additionalFields" class="hidden">
                            <p class="fs-6">Please enter the 6-digit code sent to your email.</p>
                            <div class="mb-3">
                                <label for="otp" class="form-label">OTP</label>
                                <input type="number" class="form-control" id="otp" onkeyup="toggleButton()"
                                    placeholder="Enter OTP">
                                <small id="errorSecond" class="errorContent"></small>
                            </div>
                            <div class="col d-flex justify-content-center mb-2">
                                <button type="button" class="btn btn-primary" id="resendOtp"
                                    onclick="generateOtp()">Resend OTP</button>
                            </div>
                            <div class="mb-3">
                                <label for="password" class="form-label">Password</label>
                                <input type="password" class="form-control" id="password" onkeyup="toggleButton()"
                                    placeholder="Enter password">
                            </div>
                            <div class="mb-3">
                                <label for="confirmPassword" class="form-label">Confirm Password</label>
                                <input type="password" class="form-control" id="confirmPassword"
                                    placeholder="Enter confirm password" onkeyup="toggleButton()">

                            </div>
                            <div class="col d-flex justify-content-center mb-2">
                                <button type="button" class="btn btn-primary" id="submit"
                                    onclick="submitOtpAndPassword()" disabled>Verify
                                    OTP & SavePassword</button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
        <script>
            var emailId = document.getElementById('emailId');
            var sendOtp = document.getElementById('sendOtp');
            var additionalFields = document.getElementById('additionalFields');
            var otp = document.getElementById('otp');
            var password = document.getElementById('password');
            var confirmPassword = document.getElementById('confirmPassword');
            var emailValid = document.getElementById('emailValid');
            var errorFirst = document.getElementById('errorFirst');
            var errorSecond = document.getElementById('errorSecond');
            var submit = document.getElementById('submit');

            function toggleButton() {
                sendOtp.disabled = !(emailId.value.length > 0)
                submit.disabled = !(
                    otp.value.length > 0 &&
                    password.value === confirmPassword.value
                )
            }

            function generateOtp() {

                var myHeaders = new Headers();
                myHeaders.append("Content-Type", "application/json");

                var raw = JSON.stringify({
                    "emailId": emailId.value
                });

                var requestOptions = {
                    method: 'POST',
                    headers: myHeaders,
                    body: raw,
                    redirect: 'follow'
                };

                fetch("http://localhost:1000/api/warden/generateOtp", requestOptions)
                    .then(async (response) => {
                        if (response.status === 200) {
                            emailValid.style.display = 'none'
                            additionalFields.style.display = 'block';
                        } else {
                            errorFirst.innerText = 'Please provide valid Email.'
                            // alert(await response.text())
                        }
                    })
                    .catch(error => console.log('error', error));

                var myHeaders = new Headers();
                myHeaders.append("Content-Type", "application/json");

                var raw = JSON.stringify({
                    "emailId": emailId.value
                });

                var requestOptions = {
                    method: 'POST',
                    headers: myHeaders,
                    body: raw,
                    redirect: 'follow'
                };

                fetch("http://localhost:1000/api/warden/emailValid", requestOptions)
                    .then(async (response) => {
                        if (response.status === 200) {
                            emailValid.style.display = 'none'
                            additionalFields.style.display = 'block';
                        } else {
                            errorFirst.innerText = 'Please provide valid Email.'
                            // alert(await response.text())
                        }
                    })
                    .catch(error => console.log('error', error));
            }

            function submitOtpAndPassword() {
                var myHeaders = new Headers();
                myHeaders.append("Content-Type", "application/json");

                var raw = JSON.stringify({
                    "otp": otp.value
                });

                var requestOptions = {
                    method: 'POST',
                    headers: myHeaders,
                    body: raw,
                    redirect: 'follow'
                };

                fetch("http://localhost:1000/api/warden/otp", requestOptions)
                    .then(async (response) => {
                        if (response.status === 200) {
                            submitPassword()
                        } else {
                            // alert(await response.text())
                            errorSecond.innerText = 'Invalid OTP. Please try again.'
                            return
                        }
                    })
                    .catch(error => console.log('error', error));
            }
            function submitPassword() {
                var myHeaders = new Headers();
                myHeaders.append("Content-Type", "application/json");

                var raw = JSON.stringify({
                    "password": password.value
                });

                var requestOptions = {
                    method: 'POST',
                    headers: myHeaders,
                    body: raw,
                    redirect: 'follow'
                };

                fetch("http://localhost:1000/api/warden/newPassword", requestOptions)
                    .then(async (response) => {
                        if (response.status === 200) {
                            window.location = '/login'
                        } else {
                            alert(await response.text())
                            // window.location = '/warden/resetPassword'
                        }
                    })
                    .catch(error => console.log('error', error));

            }



        </script>
        <%- include('../partials/footer.ejs') %></form>



//////////////////////////////////
        const { mysqlQuery, sendEmail } = require('../utilityclient.js')
const ALLOWED_UPDATE_KEYS = [
    "firstName",
    "lastName",
    "dob",
    "emailId",
    "password",
    "superAdmin"
]
const otpGenerator = require('otp-generator');
const otpLimitNumber = 6;
const otpOption = {
    digits: true,
    upperCaseAlphabets: true,
    lowerCaseAlphabets: true,
    specialChars: false
}


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

async function generateOtp(req, res) {

    const mysqlClient = req.app.mysqlClient;
    const {
        emailId = null
    } = req.body

    try {
        const isValidMail = await mysqlQuery(/*sql*/`
        SELECT emailId, otpTiming FROM warden WHERE emailId = ? AND deletedAt IS NULL`,
            [emailId],
            mysqlClient)

        if (isValidMail.length === 0) {
            return res.status(404).send('Invalid EmailId')
        }

        if (isValidMail[0].otpTiming !== null) {
            return res.status(400).send('User Block for few hours')
        }

        var otp = otpGenerator.generate(otpLimitNumber, otpOption);

        const sendOtp = await mysqlQuery(/*sql*/`UPDATE warden SET otp = ? WHERE emailId = ?`,
            [otp, isValidMail[0].emailId],
            mysqlClient
        )

        if (sendOtp.affectedRows === 0) {
            return res.status(404).send('No OTP made.')
        }

        await sendEmail(isValidMail[0].emailId, otp, res)
        req.session.warden = isValidMail[0].emailId

        res.status(200).send('success')
    } catch (error) {
        console.log(error)
        res.status(500).send(error.message)
    }
}

async function submitOtpAndNewPassword(req, res) {
    const mysqlClient = req.app.mysqlClient;
    const emailId = req.session.warden;
    const { password = null, otp = null } = req.body;

    try {
        const validOtp = await mysqlQuery(/*sql*/`
            SELECT otp
            FROM warden 
            WHERE otp = ? AND emailId = ? AND deletedAt IS NULL`,
            [otp, emailId],
            mysqlClient
        );

        const validOtpTiming = await mysqlQuery(/*sql*/`
            SELECT otpTiming
            FROM warden 
            WHERE emailId = ? AND deletedAt IS NULL`,
            [emailId],
            mysqlClient
        )
        console.log(validOtp.length === 0)
        console.log(validOtpTiming[0].otpTiming === null)
        if (validOtp.length === 0 && validOtpTiming[0].otpTiming === null) {
            var validOtpLengthZero = await mysqlQuery(/*sql*/`
            UPDATE warden 
                SET  
                otpAttempt = CASE 
                    WHEN otpAttempt IS NULL THEN 2  
                    WHEN otpAttempt = 1 THEN NULL  
                    WHEN otpAttempt >= 1 THEN otpAttempt - 1  
                    ELSE otpAttempt
                END,
                otpTiming = CASE
                    WHEN otpAttempt IS NULL THEN DATE_ADD(NOW(), INTERVAL 3 HOUR) 
                    ELSE otpTiming  
                END
            WHERE emailId = ?`,
                [emailId],
                mysqlClient
            )

            if (validOtpLengthZero.affectedRows === 0) {
                return res.status(404).send('No content changed')
            }

            return res.status(500).send('OTP invalid');
        } else if (validOtpTiming[0].otpTiming <= new Date || validOtpTiming[0].otpTiming === null) {


            // var setNullOtpTiming = await mysqlQuery(/*sql/*`UPDATE warden SET otpTiming = ?
            //         WHERE emailId = ? AND deletedAt IS NULL`,
            //         [null, emailId],
            //         mysqlClient
            //     )
                 
            //         if (setNullOtpTiming.affectedRows === 0) {
            //             return res.status(404).send('Not set null OtpTiming')
            //         }
                    
           var updatedNewPassword = await mysqlQuery(/*sql*/` 
            UPDATE warden SET password = ?, otp = ?
                WHERE emailId = ? AND otp = ? AND deletedAt IS NULL`,
                [password, null, emailId, otp],
                mysqlClient)

            console.log(updatedNewPassword.affectedRows === 0)
            if (updatedNewPassword.affectedRows === 0) {
                return res.status(404).send('No Content updated')
            }

            // const setNullOtp = await mysqlQuery(/*sql*/` UPDATE warden SET 
            //     WHERE emailId = ?`,
            // [null, emailId],
            // mysqlClient)

            // if (setNullOtp.affectedRows === 0) {
            //     return res.status(404).send('otp null is not set')
            // }
            return res.status(200).send('success')
        }
        // var setOtpIsNull = await setOtpNull(emailId, mysqlClient)

        // if (!setOtpIsNull) {
        //     return
        // }
        const setNullOtp = await mysqlQuery(/*sql*/` UPDATE warden SET otp = ?
            WHERE emailId = ?`,
        [null, emailId],
        mysqlClient)

        if (setNullOtp.affectedRows === 0) {
            return res.status(404).send('otp null is not set')
        }

        return res.status(500).send('user is blocked')
    } catch (error) {
        console.log(error);
        return res.status(500).send('An error occurred');
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

function isOtpNull(emailId, mysqlClient) {
    return new Promise((resolve, reject) => {
        mysqlClient.query(/*sql*/`UPDATE warden SET otp = ? WHERE emailId = ? AND deletedAt IS NULL`,
            [null, emailId], (err, setNull) => {
                if (err) {
                    return reject(err)
                }
                resolve(setNull.length > 0 ? setNull[0] : null)
            })
    })
}

async function setOtpNull(emailId, mysqlClient) {
    var setNullOtp = await isOtpNull(emailId, mysqlClient)
    if (setNullOtp !== null) {
        return true
    }
    return false
}

module.exports = (app) => {
    app.post('/api/warden/generateOtp', generateOtp)
    app.post('/api/warden/newPassword', submitOtpAndNewPassword)
    app.get('/api/warden', readWardens)
    app.get('/api/warden/:wardenId', readWardenById)
    app.post('/api/warden', createWarden)
    app.put('/api/warden/:wardenId', updateWardenById)
    app.delete('/api/warden/:wardenId', deleteWardenById)
    app.post('/api/login', authentication)
    app.get('/api/logout', logOut)
}
