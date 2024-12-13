const { mysqlQuery } = require('../utilityclient/query');
const sendEmail = require('../utilityclient/email');
const otpGenerator = require('otp-generator');

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
        const studentDetails = await mysqlQuery(/*sql*/`
            SELECT
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
        let studentName = studentDetails[0].name;
        let studentRegNo = studentDetails[0].registerNumber;
        const studentOtp = studentDetails[0].otp;
        const studentOtpAttempt = studentDetails[0].otpAttempt || 0;
        const studentOtpTiming = studentDetails[0].otpTiming;
        
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

function studentLogOut(req, res) {
    req.session.destroy((err) => {
        if (err) logger.error();
        res.redirect('/student/login')
    })
}

module.exports = (app) => {
    app.post('/api/student/generateotp', generateOtp)
    app.put('/api/student/verifyotp/authentication', verifyOtpStudentAuthentication)
    app.get('/api/student/attendancereport', studentAttendanceReport)
    app.get('/api/student/logout', studentLogOut)
}
