const { getUserProfile } = require('../../utilityclient/query')
const { getAppUrl } = require('../../utilityclient/url')

function coursePageUi(req, res) {
    const avatarWardenId = req.session.warden.wardenId;
    res.status(200).render('pages/course/courselist.ejs', {
        appURL: getAppUrl(),
        avatarWardenId: avatarWardenId,
        user: getUserProfile(req.session),
        breadCrumbs: [
            {name:'Home', link:'/home'},
            {name:'Others', link:''},
            {name:'Course', link:'/course'},
        ]
    });
}

function addCourseUi(req, res) {
    const avatarWardenId = req.session.warden.wardenId;
    res.render('pages/course/courseform.ejs', {
        appURL: getAppUrl(),
        avatarWardenId: avatarWardenId,
        courseId: '',
        user: getUserProfile(req.session),
        breadCrumbs: [
            {name:'Home', link:'/home'},
            {name:'Others', link:''},
            {name:'Course', link:'/course'},
            {name:'Add', link:'/course/add'}
        ]
    })
}

function editCourseUi(req, res) {
    const avatarWardenId = req.session.warden.wardenId;
    const courseId = req.params.courseId;
    res.render('pages/course/courseform.ejs', {
        appURL: getAppUrl(),
        avatarWardenId: avatarWardenId,
        courseId: courseId,
        user: getUserProfile(req.session),
        breadCrumbs: [
            {name:'Home', link:'/home'},
            {name:'Others', link:''},
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
