function studentPageUi(req, res) {
    if (req.session.isLogged) {
        res.render('pages/student/studentlist.ejs');
    } else {
        res.status(401).redirect('http://localhost:1000/login');
    }
}

function addStudentUi(req, res) {
    if (req.session.isLogged) {
        res.render('pages/student/studentform.ejs', { studentId: '' });
    } else {
        res.status(401).redirect('http://localhost:1000/login');
    }

}

function editStudentUi(req, res) {
    const studentId = req.params.studentId;
    if (req.session.isLogged) {
        res.render('pages/student/studentform.ejs', { studentId: studentId });
    } else {
        res.status(401).redirect('http://localhost:1000/login');
    }
}

module.exports = (app) => {
    app.get('/student', studentPageUi)
    app.get('/student/add', addStudentUi)
    app.get('/student/:studentId', editStudentUi)
}
