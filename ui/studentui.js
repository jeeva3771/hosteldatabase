const { getUserProfile } = require('../utilityclient/query')

function studentPageUi(req, res) {
    res.render('pages/student/studentlist.ejs', {
        user: getUserProfile(req.session),
        breadcrumb: [
            {name:'Home', link:'/home'},
            {name:'Student', link:'/student'}
        ]
    });
}

function addStudentUi(req, res) {
    res.render('pages/student/studentform.ejs', {
        studentId: '',
        user: getUserProfile(req.session),
        breadcrumb: [
            {name:'Home', link:'/home'},
            {name:'Student', link:'/student'},
            {name:'Add', link:'/student/add'}
        ]
    });
}

function editStudentUi(req, res) {
    const studentId = req.params.studentId;
    res.render('pages/student/studentform.ejs', {
        studentId: studentId,
        user: getUserProfile(req.session),
        breadcrumb: [
            {name:'Home', link:'/home'},
            {name:'Student', link:'/student'},
            {name:'Edit', link:'/student/add'}
        ]
    });
}

module.exports = (app) => {
    app.get('/student', studentPageUi)
    app.get('/student/add', addStudentUi)
    app.get('/student/:studentId', editStudentUi)
}
