function loadStudentPage(req, res) {
    res.render('pages/student/studentlist.ejs')
}

function loadAddStudent(req, res) {
    res.render('pages/student/studentform.ejs', { studentId: '' })
}

function loadEditStudent(req, res) {
    const studentId = req.params.studentId
    res.render('pages/student/studentform.ejs', { studentId: studentId })
}

module.exports = (app) => {
    app.get('/student', loadStudentPage)
    app.get('/student/add', loadAddStudent)
    app.get('/student/:studentId', loadEditStudent)
}