const { getAppUrl } = require('../../utilityclient/url');

function studentGenerateOtp(req, res) {
    res.render('pages/studentemailverify.ejs', {
        appURL: getAppUrl()
    })
}

function getStudentReportUi(req, res) {
    const studentName = req.session.student.name;
    const studentRegNo = req.session.student.regNo;
    if (req.session.isLoggedStudent === true) {
        res.render('pages/studentuse/report.ejs', {
            appURL: getAppUrl(),
            studentName: studentName,
            studentRegNo: studentRegNo
        })
    }
}

function studentLogOut(req, res) {
    res.render('pages/studentemailverify.ejs', {
        appURL: getAppUrl()
    })
}

module.exports = (app) => {
    app.get('/student/emailverify/generateotp', studentGenerateOtp)
    app.get('/student/attendance/report', getStudentReportUi)
    app.get('/api/student/logout/studlog', studentLogOut)
}