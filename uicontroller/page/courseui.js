const { getUserProfile } = require('../../utilityclient/query')
const { getAppUrl } = require('../../utilityclient/url')

function coursePageUi(req, res) {
    res.status(200).render('pages/course/courselist.ejs', {
        appURL: getAppUrl(),
        user: getUserProfile(req.session),
        breadcrumb: [
            {name:'Home', link:'/home'},
            {name:'Course', link:'/course'},
        ]
    });
}

function addCourseUi(req, res) {
    res.render('pages/course/courseform.ejs', {
        appURL: getAppUrl(),
        courseId: '',
        user: getUserProfile(req.session),
        breadcrumb: [
            {name:'Home', link:'/home'},
            {name:'Course', link:'/course'},
            {name:'Add', link:'/course/add'}
        ]
    })
}

function editCourseUi(req, res) {
    const courseId = req.params.courseId;
    res.render('pages/course/courseform.ejs', {
        appURL: getAppUrl(),
        courseId: courseId,
        user: getUserProfile(req.session),
        breadcrumb: [
            {name:'Home', link:'/home'},
            {name:'Course', link:'/course'},
            {name:'Edit', link:'/course/add'}
        ]
    });
}

module.exports = (app) => {
    app.get('/course', coursePageUi)
    app.get('/course/add', addCourseUi)
    app.get('/course/:courseId', editCourseUi)
}
