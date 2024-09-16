function loadAttendancePage(req, res) {
    res.render('pages/attendance/attendancelist.ejs')
}

function loadAddAttendance(req, res) {
    res.render('pages/attendance/attendanceform.ejs', { attendanceId: '' })
}

function loadEditAttendance(req, res) {
    const attendanceId = req.params.attendanceId
    res.render('pages/attendance/attendanceform.ejs', { attendanceId: attendanceId })
}

module.exports = (app) => {
    app.get('/attendance', loadAttendancePage)
    app.get('/attendance/add', loadAddAttendance)
    app.get('/attendance/:attendanceId', loadEditAttendance)
}