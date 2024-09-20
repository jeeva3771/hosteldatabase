function attendancePageUi(req, res) {
    res.render('pages/attendance/attendancelist.ejs');
}

function addAttendanceUi(req, res) {
    res.render('pages/attendance/attendanceform.ejs', { attendanceId: '' });
}


function editAttendanceUi(req, res) {
    const attendanceId = req.params.attendanceId;
    res.render('pages/attendance/attendanceform.ejs', { attendanceId: attendanceId });
}

module.exports = (app) => {
    app.get('/attendance', attendancePageUi)
    app.get('/attendance/add', addAttendanceUi)
    app.get('/attendance/:attendanceId', editAttendanceUi)
}
