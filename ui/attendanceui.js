const { getUserProfile } = require('../utilityclient.js')

function attendancePageUi(req, res) {
    res.render('pages/attendance/attendancelist.ejs', {
        user: getUserProfile(req.session)
    });
}

function addAttendanceUi(req, res) {
    res.render('pages/attendance/attendanceform.ejs', {
        user: getUserProfile(req.session)
    });
}

module.exports = (app) => {
    app.get('/attendance', attendancePageUi)
    app.get('/attendance/add', addAttendanceUi)
}
