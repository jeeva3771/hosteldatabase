const { getAppUrl } = require('../../utilityclient/url');

function studentGenerateOtp(req, res) {
    res.render('pages/studentlogin.ejs', {
        appURL: getAppUrl()
    })
}

function getStudentReportUi(req, res) {
    const studentName = req.session.studentInfo.name;
    const studentRegNo = req.session.studentInfo.regNo;

    if (req.session.isLoggedStudent === true) {
        res.render('pages/studentuse/report.ejs', {
            appURL: getAppUrl(),
            studentName: studentName,
            studentRegNo: studentRegNo
        })
    }
}

function studentLogOut(req, res) {
    res.render('pages/studentlogin.ejs', {
        appURL: getAppUrl()
    })
}

module.exports = (app) => {
    app.get('/student/login', studentGenerateOtp)
    app.get('/student/attendance/report', getStudentReportUi)
    app.get('/student/logout', studentLogOut)
}