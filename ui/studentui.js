const { getUserProfile } = require('../utilityclient.js')

function studentPageUi(req, res) {
    res.render('pages/student/studentlist.ejs', {
        user: getUserProfile(req.session)
    });
}

function addStudentUi(req, res) {
    res.render('pages/student/studentform.ejs', {
        studentId: '',
        user: getUserProfile(req.session)
    });
}

function editStudentUi(req, res) {
    const studentId = req.params.studentId;
    res.render('pages/student/studentform.ejs', {
        studentId: studentId,
        user: getUserProfile(req.session)
    });
}

module.exports = (app) => {
    app.get('/student', studentPageUi)
    app.get('/student/add', addStudentUi)
    app.get('/student/:studentId', editStudentUi)
}
