const { mysqlQuery } = require('../utilityclient/query');
const sendEmail = require('../utilityclient/email');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '..', 'uploads'))
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
        console.log(file.originalname)
    }
})

const upload = multer({ storage: storage })
const multerMiddleware = upload.single('image');


const otpGenerator = require('otp-generator');

const ALLOWED_UPDATE_KEYS = [
    "firstName",
    "lastName",
    "dob",
    "emailId",
    "password",
    "superAdmin"
]
const OTP_LIMIT_NUMBER = 6;
const OTP_OPTION = {
    digits: true,
    upperCaseAlphabets: true,
    lowerCaseAlphabets: false,
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
    const searchPattern = `%${searchQuery}%`;
    let queryParameters = null;

    let wardensQuery = /*sql*/`
        SELECT 
            w.*,
            ww.firstName AS createdFirstName,
            ww.lastName AS createdLastName,
            DATE_FORMAT(w.dob, "%y-%b-%D") AS birth,
            DATE_FORMAT(w.createdAt, "%y-%b-%D %r") AS createdTimeStamp
            FROM warden AS w
            LEFT JOIN
              warden AS ww ON ww.wardenId = w.createdBy
            WHERE 
              w.deletedAt IS NULL 
            AND (w.firstName LIKE ? OR w.lastName LIKE ? OR w.emailId LIKE ?
              OR superAdmin LIKE ? OR w.createdBy LIKE ?)
            ORDER BY 
              ${orderBy} ${sort}`;

    let countQuery = /*sql*/ `
        SELECT COUNT(*) AS totalWardenCount 
        FROM warden AS w
        LEFT JOIN
            warden AS ww ON ww.wardenId = w.createdBy
        WHERE 
            w.deletedAt IS NULL 
        AND (w.firstName LIKE ? OR w.lastName LIKE ? OR w.emailId LIKE ?
            OR superAdmin LIKE ? OR w.createdBy LIKE ?)
        ORDER BY 
            ${orderBy} ${sort}`;

    if (limit >= 0) {
        wardensQuery += ' LIMIT ? OFFSET ?';
        queryParameters = [searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, limit, offset];
    } else {
        queryParameters = [searchPattern, searchPattern, searchPattern, searchPattern, searchPattern];
    }

    const countQueryParameters = [searchPattern, searchPattern, searchPattern, searchPattern, searchPattern];


    try {
        const [wardens, totalCount] = await Promise.all([
            mysqlQuery(wardensQuery, queryParameters, mysqlClient),
            mysqlQuery(countQuery, countQueryParameters, mysqlClient)
        ]);

        res.status(200).send({
            wardens: wardens,
            wardenCount: totalCount[0].totalWardenCount
        });
    } catch (error) {
        res.status(500).send(error.message);
    }
}
//previous
// async function readWardenById(req, res) {
//     const wardenId = req.params.wardenId
//     const mysqlClient = req.app.mysqlClient
//     try {
//         const warden = await mysqlQuery(/*sql*/`
//         SELECT 
//                 w.*,
//                 ww.firstName AS createdFirstName,
//                 ww.lastName AS createdLastName,
//                 ww2.firstName AS updatedFirstName,
//                 ww2.lastName AS updatedLastName,
//                 DATE_FORMAT(w.dob, "%y-%b-%D") AS birth,
//                 DATE_FORMAT(w.createdAt, "%y-%b-%D %r") AS createdTimeStamp,
//                 DATE_FORMAT(w.updatedAt, "%y-%b-%D %r") AS updatedTimeStamp
//                 FROM warden AS w
//                 LEFT JOIN
//                 warden AS ww ON ww.wardenId = w.createdBy
//                 LEFT JOIN 
//                 warden AS ww2 ON ww2.wardenId = w.updatedBy
//                 WHERE 
//                 w.deletedAt IS NULL AND w.wardenId = ?`,
//             [wardenId],
//             mysqlClient
//         )
//         if (warden.length === 0) {
//             return res.status(404).send("wardenId not valid");
//         }
//         res.status(200).send(warden[0])
//     } catch (error) {
//         console.log(error)
//         res.status(500).send(error.message)
//     }
// }

async function readWardenById(req, res) {
    console.log('jjjj')
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

        var fileName = warden[0].profilePath

        const baseDir = path.join(__dirname, '..', 'uploads');
        const imagePath = path.join(baseDir, fileName);
        console.log(imagePath)
        fs.access(imagePath, fs.constants.F_OK, (err) => {
            if (err) {
                return res.status(404).json({ error: 'Image not found' });
            }

            res.status(200).send(warden[0])
        })

    } catch (error) {
        console.log(error)
        res.status(500).send(error.message)
    }
}


// app.get('/api/myprofile/:id', (req, res) => {
//  const id = req.params.id;

//     con.query(/*sql*/`SELECT profilePath FROM myprofile WHERE id = ? `,[id], (err, result)=> {
//       if (err) {
//         return res.status(400).send('no contents')
//       }
//       var filename = result[0].profilePath
//       console.log(filename)

//     // const filename = 'myfile-1731681620583-683581957.png';
//     const imagePath = path.join(__dirname, 'uploads', filename);

//     // Check if file exists
//     fs.access(imagePath, fs.constants.F_OK, (err) => {
//       if (err) {
//         return res.status(404).json({ error: 'Image not found' });
//       }

//       // Send the image file
//       res.sendFile(imagePath, (err) => {
//         if (err) {
//           console.error('Error sending file:', err);
//           res.status(500).json({ error: 'Error reading image file' });
//         }
//       });
//     });
//   })

async function readWardenProfileById(req, res) {
    const mysqlClient = req.app.mysqlClient;
    const wardenId = req.params.wardenId;
    try {

        var wardenProfilePath = await mysqlQuery(/*sql*/`SELECT profilePath FROM warden 
                        WHERE wardenId = ? AND deletedAt IS NULL`, [wardenId], mysqlClient)

        if (wardenProfilePath.length === 0) {
            return res.status(400).send('No contents')
        }

        var fileName = wardenProfilePath[0].profilePath;

        const baseDir = path.join(__dirname, '..', 'uploads');
        const imagePath = path.join(baseDir, fileName);

        if (!fs.existsSync(imagePath)) {
            return res.status(404).send('Image not found');
        }
        
          res.setHeader('Content-Type', 'image/jpeg'); 
          fs.createReadStream(imagePath).pipe(res);

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
        // const createdBy = req.session.warden.wardenId;
        const createdBy = 8;


        if (!req.file) {
            return res.status(400).send('No file uploaded')
        }

        const uploadedFilePath = req.file.path;
        console.log(uploadedFilePath)


        const resizedFilePath = path.join('uploads', `resized-${req.file.filename}`);
        console.log(resizedFilePath)

        try {
            await sharp(uploadedFilePath)
                .resize({ width: 200, height: 200 })
                .toFile(resizedFilePath);

            fs.renameSync(resizedFilePath, uploadedFilePath);

            const uploadedFile = req.file.filename;

            const isValidInsert = validateInsertItems(req.body);
            if (isValidInsert.length > 0) {
                return res.status(400).send(isValidInsert);
            }

            const existingWarden = await mysqlQuery(/*sql*/`SELECT COUNT(*) AS count FROM warden WHERE emailId = ? AND deletedAt IS NULL`, [emailId], mysqlClient);
            if (existingWarden[0].count > 0) {
                return res.status(409).send("emailId already exists");
            }

            const newWarden = await mysqlQuery(/*sql*/`INSERT INTO 
            warden (firstName,lastName,dob,emailId,password,profilePath,superAdmin,createdBy)
            VALUES(?,?,?,?,?,?,?,?)`,
                [firstName, lastName, dob, emailId, password, uploadedFile, superAdmin, createdBy],
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
        const updatedBy = req.session.warden.wardenId;
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
        const deletedBy = req.session.warden.wardenId;

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
                req.session.warden = user[0]

                res.status(200).send('success')
            } else {
                req.session.isLogged = false
                req.session.warden = null
                res.status(409).send('Invalid emailId or password !')
            }
        } catch (error) {
            res.status(500).send(error.message)
        }
    }

    function userLogOut(req, res) {
        req.session.destroy((err) => {
            if (err) logger.error();
            res.redirect('/login')
        })
    }

    async function generateOtp(req, res) {
        const mysqlClient = req.app.mysqlClient;
        const currentTime = new Date().getTime();
        const {
            emailId = null
        } = req.body

        try {
            const wardenResult = await mysqlQuery(/*sql*/`SELECT otpTiming FROM warden 
            WHERE emailId = ? 
            AND deletedAt IS NULL`, [emailId], mysqlClient)

            if (wardenResult.length === 0) {
                return res.status(404).send('Invalid Email.')
            }

            const UserOtpTiming = wardenResult[0].otpTiming
            const blockedTime = new Date(UserOtpTiming).getTime()

            if (currentTime < blockedTime) {
                return res.status(401).send('User is blocked for a few hours')
            }

            var otp = otpGenerator.generate(OTP_LIMIT_NUMBER, OTP_OPTION);

            const sendOtp = await mysqlQuery(/*sql*/`UPDATE warden SET otp = ? WHERE emailId = ?
        AND deletedAt IS NULL`,
                [otp, emailId],
                mysqlClient
            )

            if (sendOtp.affectedRows === 0) {
                return res.status(404).send('Enable to send OTP.')
            }

            const mailOptions = {
                to: emailId,
                subject: 'Password Reset OTP',
                html: `Your OTP code is <b>${otp}</b>. Please use this to complete your verification.`
            }
            await sendEmail(mailOptions)

            req.session.resetPassword = emailId
            return res.status(200).send('success')
        } catch (error) {
            res.status(500).send(error.message)
        }
    }

    async function processResetPassword(req, res) {
        const mysqlClient = req.app.mysqlClient;
        const emailId = req.session.resetPassword;
        const { password = null, otp = null } = req.body;
        const currentTime = new Date().getTime();
        const otpAttemptMax = 3;

        try {
            const userDetails = await mysqlQuery(/*sql*/`
            SELECT otp, otpAttempt, otpTiming
            FROM warden 
            WHERE emailId = ? AND deletedAt IS NULL`,
                [emailId],
                mysqlClient
            );

            if (userDetails.length === 0) {
                return res.status(404).send('Oops! Something went wrong. Please contact admin.')
            }

            const userOtp = userDetails[0].otp;
            const userOtpAttempt = userDetails[0].otpAttempt || 0;
            const userOtpTiming = userDetails[0].otpTiming;

            const blockedTime = new Date(userOtpTiming).getTime()

            if (currentTime < blockedTime) {
                return res.status(401).send('Access is currently blocked. Please retry after the designated wait time.')
            }

            if (userOtpAttempt >= otpAttemptMax) {
                const updatedUser = await mysqlQuery(/*sql*/`UPDATE warden SET otp = null, otpAttempt = null, otpTiming = DATE_ADD(NOW(), INTERVAL 3 HOUR)
            WHERE emailId = ? AND deletedAt IS NULL `, [emailId], mysqlClient)

                req.session.destroy(err => {
                    if (err) {
                        return res.status(500).send('Error destroying session.');
                    }

                    if (updatedUser.affectedRows === 0) {
                        return res.status(404).send('Oops! Something went wrong. Please contact admin.')
                    }
                    return res.status(401).send('You are temporarily blocked. Please try again in 3 hours.')
                });
            }

            if (otp === userOtp) {
                const resetPassword = await mysqlQuery(/*sql*/`UPDATE warden SET password = ?, otp = null, otpAttempt = null
            WHERE emailId = ? AND deletedAt IS NULL`, [password, emailId], mysqlClient)

                if (resetPassword.affectedRows === 0) {
                    return res.status(404).send('Oops! Something went wrong. Please contact admin.')
                }

                return res.status(200).send('success')
            } else {
                if (userOtpAttempt === 2) {
                    var updateBlockedTime = await mysqlQuery(/*sql*/`UPDATE warden SET otp = null, otpAttempt = null,
                otpTiming = DATE_ADD(NOW(), INTERVAL 3 HOUR) WHERE emailId = ? AND deletedAt IS NULL`,
                        [emailId], mysqlClient)

                    if (updateBlockedTime.affectedRows === 0) {
                        return res.status(404).send('Oops! Something went wrong. Please contact admin.')
                    }
                    return res.status(401).send('You are temporarily blocked. Please try again in 3 hours.')
                } else {
                    var updateOtpAttempt = await mysqlQuery(/*sql*/`UPDATE warden SET otpAttempt = ? + 1
                WHERE emailId = ? AND deletedAt IS NULL`, [userOtpAttempt, emailId], mysqlClient)

                    if (updateOtpAttempt.affectedRows === 0) {
                        return res.status(404).send('Oops! Something went wrong. Please contact admin.')
                    }
                    return res.status(400).send({ errorType: 'OTP', message: 'Invalid OTP. Please try again.' })
                }
            }
        } catch (error) {
            return res.status(500).send(error.message)
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

        console.log(superAdmin)
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
            if (![0, 1].includes(parseInt(superAdmin))) {
                errors.push('superAdmin is invalid')
            }
        } else if (!isUpdate) {
            errors.push('superAdmin is missing')
        }
        return errors
    }

    function getWardenById(wardenId, mysqlClient) {
        return new Promise((resolve, reject) => {
            var query = /*sql*/`SELECT COUNT(*) AS count FROM warden WHERE wardenId = ? AND deletedAt IS NULL`
            mysqlClient.query(query, [wardenId], (err, warden) => {
                if (err) {
                    return reject(err)
                }
                resolve(warden[0].count > 0 ? warden[0] : null)
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
        app.post('/api/warden/generateotp', generateOtp)
        app.put('/api/warden/resetpassword', processResetPassword)
        app.get('/api/warden/:wardenId/avatar', readWardenProfileById)
        app.get('/api/warden', readWardens)
        app.get('/api/warden/:wardenId', readWardenById)
        app.post('/api/warden', multerMiddleware, createWarden)
        app.put('/api/warden/:wardenId', updateWardenById)
        app.delete('/api/warden/:wardenId', deleteWardenById)
        app.post('/api/login', authentication)
        app.get('/api/logout', userLogOut)
    }
