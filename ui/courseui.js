function loadCoursePage(req, res) {
    res.render('pages/course/courselist.ejs')
}

module.exports = (app) => {
    app.get('/course', loadCoursePage)
}