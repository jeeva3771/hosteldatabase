function loadCoursePage(req, res) {
    res.render('pages/course/courselist.ejs')
}

function loadAddCourse(req, res) {
    res.render('pages/course/courseform.ejs', { courseId: '' })
}

function loadEditCourse(req, res) {
    const courseId = req.params.courseId
    res.render('pages/course/courseform.ejs', { courseId: courseId })
}

module.exports = (app) => {
    app.get('/course', loadCoursePage)
    app.get('/course/add', loadAddCourse)
    app.get('/course/:courseId', loadEditCourse)
}