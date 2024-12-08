const { getUserProfile } = require('../../utilityclient/query');
const { getAppUrl } = require('../../utilityclient/url');

function studentPageUi(req, res) {
    const avatarWardenId = req.session.warden.wardenId;
    res.render('pages/student/studentlist.ejs', {
        appURL: getAppUrl(),
        avatarWardenId: avatarWardenId,
        user: getUserProfile(req.session),
        breadCrumbs: [
            {name:'Home', link:'/home'},
            {name:'Student', link:'/student'}
        ]
    });
}

function addStudentUi(req, res) {
    const avatarWardenId = req.session.warden.wardenId;
    res.render('pages/student/studentform.ejs', {
        appURL: getAppUrl(),
        avatarWardenId: avatarWardenId,
        studentId: '',
        user: getUserProfile(req.session),
        breadCrumbs: [
            {name:'Home', link:'/home'},
            {name:'Student', link:'/student'},
            {name:'Add', link:'/student/add'}
        ]
    });
}

function editStudentUi(req, res) {
    const avatarWardenId = req.session.warden.wardenId;
    const studentId = req.params.studentId;
    res.render('pages/student/studentform.ejs', {
        appURL: getAppUrl(),
        avatarWardenId: avatarWardenId,
        studentId: studentId,
        user: getUserProfile(req.session),
        breadCrumbs: [
            {name:'Home', link:'/home'},
            {name:'Student', link:'/student'},
            {name:'Edit', link:'/student/add'}
        ]
    });
}

module.exports = (app) => {
    app.get('/student/student', studentPageUi)
    app.get('/student/student/add', addStudentUi)
    app.get('/student/student/:studentId', editStudentUi)
}
