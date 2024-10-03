const { getUserProfile } = require('../utilityclient.js')

function coursePageUi(req, res) {
    res.status(200).render('pages/course/courselist.ejs', {
        user: getUserProfile(req.session)
    });
}

function addCourseUi(req, res) {
    res.render('pages/course/courseform.ejs', {
        courseId: '',
        user: getUserProfile(req.session)
    })
}

function editCourseUi(req, res) {
    const courseId = req.params.courseId;
    res.render('pages/course/courseform.ejs', {
        courseId: courseId,
        user: getUserProfile(req.session)
    });
}

module.exports = (app) => {
    app.get('/course', coursePageUi)
    app.get('/course/add', addCourseUi)
    app.get('/course/:courseId', editCourseUi)
}
