var nodemailer = require('nodemailer');
function mysqlQuery(sql, options, mysqlClient) {
    return new Promise((resolve, reject) => {
        try {
            mysqlClient.query(sql, options || [], (err, data) => {
                if (err) {
                    return reject(err.sqlMessage)
                }
                resolve(data)
            })
        } catch (error) {
            reject(error.message)
        }
    })
}

function getUserProfile(session) {
    return {
        name: `${session.data.firstName.charAt(0).toUpperCase()}${session.data.firstName.slice(1)}${session.data.lastName}`
    }
}

async function sendEmail(emailId, otp, res) {
    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'jeeva37710@gmail.com',
            pass: 'yios kuac qbqn igcd'
        }
    });

    var mailOptions = {
        from: 'jeeva37710@gmail.com',
        to: emailId,
        subject: 'Password Reset OTP',
        html: `Your OTP code is <b>${otp}</b>. Please use this to complete your verification.`
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            // return res.status(500).send(error.message)
            console.log(error)
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
}

module.exports = {
    mysqlQuery,
    getUserProfile,
    sendEmail
}



