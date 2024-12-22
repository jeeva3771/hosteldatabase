const { mysqlQuery } = require('../utilityclient/query');
const sendEmail = require('../utilityclient/email');
const otpGenerator = require('otp-generator');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '..', 'studentuploads'))
    },
    filename: function (req, file, cb) {
        const studentId = req.params.studentId;
        cb(null, `${studentId}.jpg`);
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
const multerMiddleware = upload.single('studentImage');


const OTP_LIMIT_NUMBER = 6;
const OTP_OPTION = {
    digits: true,
    upperCaseAlphabets: true,
    lowerCaseAlphabets: false,
    specialChars: false
}

async function generateOtp(req, res) {
    const mysqlClient = req.app.mysqlClient;
    const currentTime = new Date().getTime();
    const {
        emailId = null
    } = req.body

    try {
        const studentResult = await mysqlQuery(/*sql*/`SELECT otpTiming FROM student 
            WHERE emailId = ? 
            AND deletedAt IS NULL`, [emailId], mysqlClient)

        if (studentResult.length === 0) {
            return res.status(404).send('Invalid Email.')
        }

        const studentOtpTiming = studentResult[0].otpTiming
        const blockedTime = new Date(studentOtpTiming).getTime()

        if (currentTime < blockedTime) {
            return res.status(401).send('Student is blocked for a few hours')
        }

        var otp = otpGenerator.generate(OTP_LIMIT_NUMBER, OTP_OPTION);

        const sendOtp = await mysqlQuery(/*sql*/`UPDATE student SET otp = ? WHERE emailId = ?
        AND deletedAt IS NULL`,
            [otp, emailId],
            mysqlClient
        )

        if (sendOtp.affectedRows === 0) {
            return res.status(404).send('Enable to send OTP.')
        }

        const mailOptions = {
            to: emailId,
            subject: 'One-Time Password',
            html: `Your one-time password (OTP) is <b>${otp}</b>. Please use this code to verify your identity.`
        }
        await sendEmail(mailOptions)

        req.session.student = emailId
        return res.status(200).send('success')
    } catch (error) {
        req.log.error(error)
        res.status(500).send(error.message)
    }
}

async function verifyOtpStudentAuthentication(req, res) {
    const mysqlClient = req.app.mysqlClient;
    const emailId = req.session.student;
    const { otp = null } = req.body;
    const currentTime = new Date().getTime();
    const otpAttemptMax = 3;

    try {
        const [studentDetails] = await mysqlQuery(/*sql*/`
            SELECT
                studentId,
                name,
                registerNumber, 
                otp,
                otpAttempt,
                otpTiming
            FROM student 
            WHERE emailId = ? AND deletedAt IS NULL`,
            [emailId], mysqlClient);

        if (studentDetails.length === 0) {
            return res.status(404).send('Oops! Something went wrong. Please contact warden or admin.')
        }
        let studentId = studentDetails.studentId;
        let studentName = studentDetails.name;
        let studentRegNo = studentDetails.registerNumber;
        const studentOtp = studentDetails.otp;
        const studentOtpAttempt = studentDetails.otpAttempt || 0;
        const studentOtpTiming = studentDetails.otpTiming;
        
        const blockedTime = new Date(studentOtpTiming).getTime();
        if (currentTime < blockedTime) {
            return res.status(401).send('Access is currently blocked. Please retry after the designated wait time.')
        }

        if (studentOtpAttempt >= otpAttemptMax) {
            const updatedStudent = await mysqlQuery(/*sql*/`
                UPDATE 
                    student SET 
                    otp = null,
                    otpAttempt = null, 
                    otpTiming = DATE_ADD(NOW(), INTERVAL 3 HOUR)
                WHERE emailId = ? AND deletedAt IS NULL `,
                [emailId], mysqlClient)

            req.session.destroy(err => {
                if (err) {
                    return res.status(500).send('Error destroying session.');
                }

                if (updatedStudent.affectedRows === 0) {
                    return res.status(404).send('Oops! Something went wrong. Please contact warden or admin.')
                }
                return res.status(401).send('You are temporarily blocked. Please try again in 3 hours.')
            });
        }

        if (otp === studentOtp) {
            const studentLog = await mysqlQuery(/*sql*/`
                UPDATE 
                    student SET
                    otp = null,
                    otpTiming = null
                WHERE emailId = ? AND deletedAt IS NULL`,
                [emailId], mysqlClient)

            if (studentLog.affectedRows === 0) {
                return res.status(404).send('Oops! Something went wrong. Please contact admin.')
            } else {
                req.session.studentInfo = {
                    studentId: studentId,
                    name: studentName,
                    regNo: studentRegNo

                }
                req.session.isLoggedStudent = true
            }
            return res.status(200).send('success');
        } else {
            if (studentOtpAttempt === 2) {
                var updateBlockedTime = await mysqlQuery(/*sql*/`
                    UPDATE
                        student SET
                        otp = null,
                        otpAttempt = null,
                        otpTiming = DATE_ADD(NOW(), INTERVAL 3 HOUR) 
                    WHERE emailId = ? AND deletedAt IS NULL`,
                    [emailId], mysqlClient)

                if (updateBlockedTime.affectedRows === 0) {
                    return res.status(404).send('Oops! Something went wrong. Please contact warden or admin.')
                } else {
                    req.session.isLoggedStudent = false;
                    req.session.student = NULL;
                }
                return res.status(401).send('You are temporarily blocked. Please try again in 3 hours.')
            } else {
                var updateOtpAttempt = await mysqlQuery(/*sql*/`
                    UPDATE 
                        student SET 
                        otpAttempt = ? + 1
                    WHERE emailId = ? AND deletedAt IS NULL`,
                    [studentOtpAttempt, emailId], mysqlClient)

                if (updateOtpAttempt.affectedRows === 0) {
                    return res.status(404).send('Oops! Something went wrong. Please contact warden or admin.')
                }
                return res.status(400).send({ errorType: 'OTP', message: 'Invalid OTP. Please try again.' })
            }
        }
    } catch (error) {
        req.log.error(error)
        return res.status(500).send(error.message)
    }
}

async function studentAttendanceReport(req, res) {
    const mysqlClient = req.app.mysqlClient;
    const {
        month,
        year,
        studentName,
        registerNumber
    } = req.query;
    var errors = []
    let queryParameters = [month, year, studentName, registerNumber];

    if (isNaN(month)) {
        errors.push('month')
    }

    if (isNaN(year)) {
        errors.push('year')
    }

    if (errors.length > 0) {
        let errorMessage;
        if (errors.length === 1) {
            errorMessage = `Please select a ${errors[0]} before generating the report.`
        } else {
            errorMessage = `Please select a ${errors.join(", ")} before generating the report.`
        }
        return res.status(400).send(errorMessage)
    }

    try {
        let sqlQuery = /*sql*/`
        SELECT 
            DATE_FORMAT(a.checkInDate, "%Y-%m-%d") AS checkIn,
            a.isPresent
        FROM 
            attendance AS a
        INNER JOIN 
            student AS s ON s.studentId = a.studentId
        WHERE 
            MONTH(a.checkInDate) = ?
            AND YEAR(a.checkInDate) = ?
            AND s.name = ?
            AND s.registerNumber = ?`;
        
        const studentReport = await mysqlQuery(sqlQuery, queryParameters, mysqlClient)

        if (studentReport.length === 0) {
            return res.status(404).send('Student attendance report not found for the selected month and year.')
        }

        const formattedReport = studentReport.reduce((acc, { checkIn, isPresent }) => {
            acc[checkIn] = isPresent;
            return acc;
        }, {});

        return res.status(200).send(formattedReport);
    } catch (error) {
        req.log.error(error)
        res.status(500).send(error.message)
    }
}

async function studentDetails(req, res) {
    const mysqlClient = req.app.mysqlClient;
    const studentId = req.session.studentInfo.studentId;
    try {
        const [student] = await mysqlQuery(/*sql*/`
            SELECT 
                s.*,
                bk.blockCode,
                b.floorNumber,
                r.roomNumber,
                c.courseName,
                DATE_FORMAT(s.dob, "%y-%b-%D") AS birth,
                DATE_FORMAT(s.joinedDate, "%y-%b-%D") AS joinDate,
                DATE_FORMAT(s.createdAt, "%y-%b-%D %r") AS createdTimeStamp
            FROM student AS s
            LEFT JOIN 
                block AS bk ON bk.blockId = s.blockId
            LEFT JOIN 
                blockfloor AS b ON b.blockFloorId = s.blockFloorId
            LEFT JOIN 
                room AS r ON r.roomId = s.roomId
            LEFT JOIN 
                course AS c ON c.courseId = s.courseId
            WHERE 
                s.deletedAt IS NULL 
                AND s.studentId = ?`,
            [studentId]
        , mysqlClient)

        if (!student) {
            return res.status(404).send('Student not found');
        }
        res.status(200).send(student)
    } catch (error) {
        req.log.error(error)
        res.status(500).send(error.message)
    }
}

function studentLogOut(req, res) {
    req.session.destroy((err) => {
        if (err) logger.error();
        res.redirect('/student/login')
    })
}

function readStudentImageById(req, res) {
    const studentId = req.params.studentId;
    try {
        var fileName = `${studentId}.jpg`;
        const baseDir = path.join(__dirname, '..', 'studentuploads');
        const imagePath = path.join(baseDir, fileName);
        const defaultImagePath = path.join(baseDir, 'studentdefault.jpg');

        const imageToServe = fs.existsSync(imagePath) ? imagePath : defaultImagePath;

        res.setHeader('Content-Type', 'image/jpeg');
        fs.createReadStream(imageToServe).pipe(res);
    } catch (error) {
        console.log(error)
        req.log.error(error);
        res.status(500).send(error.message);
    }
}

async function readStudentName(req, res) {
    const mysqlClient = req.app.mysqlClient;
    const studentId = req.session.studentInfo.studentId;

    try {
        const [student] = await mysqlQuery(/*sql*/`
            SELECT 
                name
            FROM student 
            WHERE studentId = ? 
                AND deletedAt IS NULL`,
            [studentId]
        , mysqlClient)

        if (!student) {
            return res.status(404).send('Student not found');
        }
        res.status(200).send(student)
    } catch (error) {
        req.log.error(error)
        res.status(500).send(error.message)
    }
}

module.exports = (app) => {
    app.get('/api/student/name', readStudentName)
    app.get('/api/student/:studentId/image', readStudentImageById)
    app.post('/api/student/generateotp', generateOtp)
    app.put('/api/student/verifyotp/authentication', verifyOtpStudentAuthentication)
    app.get('/api/student/attendancereport', studentAttendanceReport)
    app.get('/api/student/details', studentDetails)
    app.get('/api/student/logout', studentLogOut)
}
