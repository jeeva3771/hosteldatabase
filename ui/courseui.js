function coursePageUi(req, res) {
    res.status(200).render('pages/course/courselist.ejs', {userName : req.session.data});
}

function addCourseUi(req, res) {
    res.render('pages/course/courseform.ejs', { courseId: '' })
}

function editCourseUi(req, res) {
    const courseId = req.params.courseId;
    res.render('pages/course/courseform.ejs', { courseId: courseId });
}

module.exports = (app) => {
    app.get('/course', coursePageUi)
    app.get('/course/add', addCourseUi)
    app.get('/course/:courseId', editCourseUi)
}
