function coursePageUi(req, res) {
    if (req.session.isLogged) {
        res.status(200).render('pages/course/courselist.ejs');
    } else {
        res.status(401).redirect('http://localhost:1000/login');
    }
}

function addCourseUi(req, res) {
    if (req.session.isLogged) {
        res.render('pages/course/courseform.ejs', { courseId: '' })
    } else {
        res.status(401).redirect('http://localhost:1000/login')
    }
}

function editCourseUi(req, res) {
    if (req.session.isLogged) {
        const courseId = req.params.courseId;
        res.render('pages/course/courseform.ejs', { courseId: courseId });
    } else {
        res.status(401).redirect('http://localhost:1000/login');
    }
}

module.exports = (app) => {
    app.get('/course', coursePageUi)
    app.get('/course/add', addCourseUi)
    app.get('/course/:courseId', editCourseUi)
}
