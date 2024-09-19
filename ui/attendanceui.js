function attendancePageUi(req, res) {
    if (req.session.isLogged) {
        res.render('pages/attendance/attendancelist.ejs');
    } else {
        res.status(401).redirect('http://localhost:1000/login');
    }
}

function addAttendanceUi(req, res) {
    if (req.session.isLogged) {
        res.render('pages/attendance/attendanceform.ejs', { attendanceId: '' });
    } else {
        res.status(401).redirect('http://localhost:1000/login');
    }
}

function editAttendanceUi(req, res) {
    const attendanceId = req.params.attendanceId;

    if (req.session.isLogged) {
        res.render('pages/attendance/attendanceform.ejs', { attendanceId: attendanceId });
    } else {
        res.status(401).redirect('http://localhost:1000/login');
    }
}

module.exports = (app) => {
    app.get('/attendance', attendancePageUi)
    app.get('/attendance/add', addAttendanceUi)
    app.get('/attendance/:attendanceId', editAttendanceUi)
}