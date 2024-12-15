const { mysqlQuery, deleteFile } = require('../utilityclient/query');
const sendEmail = require('../utilityclient/email');
const otpGenerator = require('otp-generator');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '..', 'useruploads'))
    },
    filename: function (req, file, cb) {
        const wardenId = req.params.wardenId;
        cb(null, `${wardenId}.jpg`);
    }
})

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/jpeg') {
        cb(null, true);
    } else {
        req.fileValidationError = 'Invalid file type. Only JPEG files are allowed.';
        cb(null, false);
    }
};

const upload = multer({ storage, fileFilter })
const multerMiddleware = upload.single('image');

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
    const orderBy = req.query.orderby;
    const sort = req.query.sort;
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
              OR w.superAdmin LIKE ? OR ww.firstName LIKE ? OR ww.lastName Like ?)
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
            OR w.superAdmin LIKE ? OR ww.firstName LIKE ? OR ww.lastName Like ?)
        ORDER BY 
            ${orderBy} ${sort}`;

    if (limit >= 0) {
        wardensQuery += ' LIMIT ? OFFSET ?';
        queryParameters = [searchPattern, searchPattern, searchPattern, searchPattern,
                            searchPattern, searchPattern, limit, offset];
    } else {
        queryParameters = [searchPattern, searchPattern, searchPattern, searchPattern, 
                            searchPattern, searchPattern];
    }

    const countQueryParameters = [searchPattern, searchPattern, searchPattern, searchPattern,
                                    searchPattern, searchPattern];

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
        req.log.error(error)
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
        req.log.error(error)
        res.status(500).send(error.message)
    }
}

function readWardenAvatarById(req, res) {
    const wardenId = req.params.wardenId;
    try {
        var fileName = `${wardenId}.jpg`;

        const baseDir = path.join(__dirname, '..', 'useruploads');
        const imagePath = path.join(baseDir, fileName);
        const defaultImagePath = path.join(baseDir, 'default.jpg');

        const imageToServe = fs.existsSync(imagePath) ? imagePath : defaultImagePath;
        res.setHeader('Content-Type', 'image/jpeg');
        fs.createReadStream(imageToServe).pipe(res);
    } catch (error) {
        req.log.error(error)
        res.status(500).send(error.message)
    }
}

async function createWarden(req, res) {
    let uploadedFilePath;
    const mysqlClient = req.app.mysqlClient
    const {
        firstName,
        lastName,
        dob,
        emailId,
        password,
        superAdmin
    } = req.body
    const createdBy = req.session.warden.wardenId;

    try {
        const isValidInsert = await validatePayload(req, req.body, req.query, false, null, mysqlClient);
        if (isValidInsert.length > 0) {
            return res.status(400).send(isValidInsert);
        }

        if (!req.file) {
            uploadedFilePath = path.join(__dirname, '..', 'useruploads', 'default.jpg');
        } else {
            uploadedFilePath = req.file.path;
        }

        if (uploadedFilePath.includes('default.jpg')) {
            console.log('Skipping sharp resizing for default image.');
        } else {
            await sharp(fs.readFileSync(uploadedFilePath))
                .resize({
                    width: parseInt(process.env.IMAGE_WIDTH),
                    height: parseInt(process.env.IMAGE_HEIGHT),
                    fit: sharp.fit.cover,
                    position: sharp.strategy.center,
                })
                .toFile(uploadedFilePath);
        }

        const newWarden = await mysqlQuery(/*sql*/`INSERT INTO 
            warden (firstName,lastName,dob,emailId,password,superAdmin,createdBy)
            VALUES(?,?,?,?,?,?,?)`,
            [firstName, lastName, dob, emailId, password, superAdmin, createdBy],
            mysqlClient
        )
        if (newWarden.affectedRows === 0) {
            if (uploadedFilePath.includes('default.jpg')) {
                console.log('Skip image deletion operation')
            } else {
                await deleteFile(uploadedFilePath, fs)
            }
            return res.status(400).send({error:"No insert was made"})
        }

        if (!uploadedFilePath.includes('default.jpg')) {
            const originalDir = path.dirname(uploadedFilePath);
            const newFilePath = path.join(originalDir, `${newWarden.insertId}.jpg`);

            fs.rename(uploadedFilePath, newFilePath, (err) => {
                if (err) {
                    return res.status(400).send({error:'Error renaming file'});
                }
        });
    }
    res.status(201).send('insert successfully')
    } catch (error) {
        req.log.error(error)
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
            return res.status(404).send({error:"warden not found or already deleted"});
        }

        const isValidInsert = await validatePayload(req, req.body, req.query, true, wardenId, mysqlClient);
        if (isValidInsert.length > 0) {
            return res.status(400).send(isValidInsert)
        }

        const isUpdate = await mysqlQuery(/*sql*/`UPDATE warden SET ${updates.join(', ')} WHERE wardenId = ?
            AND deletedAt IS NULL`,
            values, mysqlClient)
        if (isUpdate.affectedRows === 0) {
            res.status(204).send({error:"No changes made"})
        }

        const getUpdatedWarden = await mysqlQuery(/*sql*/`SELECT * FROM warden WHERE wardenId = ?`,
            [wardenId], mysqlClient)
        res.status(200).send({
            status: 'successfull',
            data: getUpdatedWarden[0]
        })
    } catch (error) {
        req.log.error(error)
        res.status(500).send(error.message)
    }
}

async function updateWardenAvatar(req, res) {
    let uploadedFilePath;
    const wardenId = req.params.wardenId;

    if (wardenId !== req.session.warden.wardenId && req.session.warden.superAdmin !== 1) {
        return res.status(409).send('Warden is not valid to edit')
    }

    try {
        if (req.fileValidationError) {
           return res.status(400).send(req.fileValidationError);
        }

        if (!req.file) {
            uploadedFilePath = path.join(__dirname, '..', 'useruploads', 'default.jpg');
        } else {
            uploadedFilePath = req.file.path;
        }

        sharp(fs.readFileSync(uploadedFilePath))
            .resize({
                width: parseInt(process.env.IMAGE_WIDTH),
                height: parseInt(process.env.IMAGE_HEIGHT),
                fit: sharp.fit.cover,
                position: sharp.strategy.center,
            })
            .toFile(uploadedFilePath);
        return res.status(200).send('Warden Image updated successfully');
    } catch (error) {
        req.log.error(error)
        return res.status(500).send(error.message);
    }
}

async function deleteWardenAvatar(req, res) {
    const wardenId = req.params.wardenId;

    if (wardenId !== req.session.warden.wardenId && req.session.warden.superAdmin !== 1) {
        return res.status(409).send('Warden is not valid to delete')
    }

    try {
        const rootDir = path.resolve(__dirname, '../');
        const imagePath = path.join(rootDir, 'useruploads', `${wardenId}.jpg`);

        await deleteFile(imagePath, fs);
        res.status(200).send('Avatar deleted successfully');
    } catch (error) {
        req.log.error(error)
        res.status(500).send('Internal Server Error');
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

        const deletedWarden = await mysqlQuery(/*sql*/`UPDATE warden SET deletedAt = NOW(), deletedBy = ?
            WHERE wardenId = ? AND deletedAt IS NULL`,
            [deletedBy, wardenId],
            mysqlClient)

        if (deletedWarden.affectedRows === 0) {
            return res.status(404).send("warden not found or already deleted")
        }

        const rootDir = path.resolve(__dirname, '../');
        const imagePath = path.join(rootDir, 'useruploads', `${wardenId}.jpg`);

        await deleteFile(imagePath, fs)

        const getDeletedWarden = await mysqlQuery(/*sql*/`SELECT * FROM warden WHERE wardenId = ?`,
            [wardenId], mysqlClient)
        res.status(200).send({
            status: 'deleted',
            data: getDeletedWarden[0]
        });
    } catch (error) {
        req.log.error(error)
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
        const user = await mysqlQuery(/*sql*/`SELECT * FROM warden WHERE emailId = ? AND password = ? 
        AND deletedAt IS NULL`,
            [emailId, password],
            mysqlClient)
        if (user.length > 0) {
            req.session.warden = user[0]
            req.session.isLogged = true
            res.status(200).send('success')
        } else {
            req.session.isLogged = false
            req.session.warden = null
            res.status(409).send('Invalid emailId or password.')
        }
    } catch (error) {
        req.log.error(error)
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
    } = req.body;

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
        req.log.error(error)
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
        req.log.error(error)
        res.status(500).send(error.message)
    }
}

async function validatePayload(req, body, query, isUpdate = false, wardenId = null, mysqlClient) {
    const {
        firstName,
        lastName,
        dob,
        emailId,
        password,
        superAdmin
    } = body
    const {
        update = null
    } = query
    const errors = []

    try {    
        if (update === 'usermaindetails' || Object.entries(query).length === 0) {
            if (firstName !== undefined) {
                if (firstName.length < 2) {
                    errors.push('First Name is invalid')
                }
            } else {
                errors.push('First Name is missing')
            }

            if (lastName !== undefined) {
                if (lastName.length < 1) {
                    errors.push('Last Name is invalid')
                }
            } else {
                errors.push('Last Name is missing')
            }

            if (dob !== undefined) {
                const date = new Date(dob);
                if (isNaN(date.getTime())) {
                    errors.push('Dob is invalid');
                } else {
                    const today = new Date();
                    if (date > today) {
                        errors.push('Dob cannot be in the future');
                    }
                }
            } else {
                errors.push('Dob is missing')
            }

            if (emailId !== undefined) {
                const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
                var emailCheck = emailPattern.test(emailId)
                if (emailCheck === false) {
                    errors.push('Email Id is invalid');
                } else {
                    let query;
                    let params;

                    if (isUpdate === true) {
                        query = /*sql*/`
                                    SELECT 
                                        COUNT(*) AS count
                                    FROM warden 
                                    WHERE emailId = ?
                                        AND wardenId != ?
                                        AND deletedAt IS NULL`
                        params = [emailId, wardenId];
                    } else {
                        query = /*sql*/`
                                    SELECT 
                                        COUNT(*) AS count
                                    FROM warden 
                                    WHERE emailId = ? 
                                        AND deletedAt IS NULL`;
                        params = [emailId];
                    }

                    const validateEmailId = await mysqlQuery(query, params, mysqlClient);
                    if (validateEmailId[0].count > 0) {
                        errors.push("Email Id already exists");
                    }
                }
            } else {
                errors.push('Email Id is missing');
            }
        } 

    if (update === "changepassword" || Object.entries(query).length === 0) {
        if (password !== undefined) {
            if (password.length < 6 && !update) {
                errors.push('Password is invalid')
            } else if (update === "changepassword") {
                const oldPassword = body.oldPassword;
                const getExistsPassword = await mysqlQuery(/*sql*/`
                    SELECT 
                        password 
                    FROM 
                        warden 
                    WHERE 
                        wardenId = ?`,
                    [wardenId], mysqlClient)
                
                if (getExistsPassword[0].password !== oldPassword) {
                    errors.push('Incorrect current password')
                } else if (password.length < 6) {
                    errors.push('New password is invalid')
                } 
            }
        } else {
            errors.push('Password is missing')
        }
    }

    if (Object.entries(query).length === 0) {
        if (req.fileValidationError) {
            errors.push(req.fileValidationError)
        }

        if (superAdmin !== undefined) {
            if (![0, 1].includes(parseInt(superAdmin))) {
                errors.push('SuperAdmin is invalid')
            }
        } else {
            errors.push('SuperAdmin is missing')
        }
    }
        return errors
    } catch(error) {
        req.log.error(error)
    }
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
    app.get('/api/warden/:wardenId/avatar', readWardenAvatarById)
    app.put('/api/warden/:wardenId/editavatar', multerMiddleware, updateWardenAvatar)
    app.delete('/api/warden/:wardenId/deleteavatar', deleteWardenAvatar)
    app.get('/api/warden', readWardens)
    app.get('/api/warden/:wardenId', readWardenById)
    app.post('/api/warden', multerMiddleware, createWarden)
    app.put('/api/warden/:wardenId', multerMiddleware, updateWardenById)
    app.delete('/api/warden/:wardenId', deleteWardenById)
    app.post('/api/login', authentication)
    app.get('/api/logout', userLogOut)
}
