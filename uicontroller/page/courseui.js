const { getUserProfile } = require('../../utilityclient/query')
const { getAppUrl } = require('../../utilityclient/url')

function coursePageUi(req, res) {
    const avatarWardenId = req.session.warden.wardenId;
    res.status(200).render('pages/course/courselist.ejs', {
        appURL: getAppUrl(),
        avatarWardenId: avatarWardenId,
        user: getUserProfile(req.session),
        breadCrumbs: [
            {name:'Home', link:getAppUrl('home')},
            {name:'Others', link:''},
            {name:'Course', link:getAppUrl('course')},
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
            {name:'Home', link:getAppUrl('home')},
            {name:'Others', link:''},
            {name:'Course', link:getAppUrl('course')},
            {name:'Add', link:getAppUrl('course/add')}
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
            {name:'Home', link:getAppUrl('home')},
            {name:'Others', link:''},
            {name:'Course', link:getAppUrl('course')},
            {name:'Edit', link:getAppUrl('course/add')}
        ]
    });
}

module.exports = (app) => {
    app.get('/course', coursePageUi)
    app.get('/course/add', addCourseUi)
    app.get('/course/:courseId', editCourseUi)
}
