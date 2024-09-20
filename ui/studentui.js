function studentPageUi(req, res) {
    res.render('pages/student/studentlist.ejs');
}

function addStudentUi(req, res) {
    res.render('pages/student/studentform.ejs', { studentId: '' });
}

function editStudentUi(req, res) {
    const studentId = req.params.studentId;
    res.render('pages/student/studentform.ejs', { studentId: studentId });
}

module.exports = (app) => {
    app.get('/student', studentPageUi)
    app.get('/student/add', addStudentUi)
    app.get('/student/:studentId', editStudentUi)
}
