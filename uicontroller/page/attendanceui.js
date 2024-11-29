const { getUserProfile } = require('../../utilityclient/query');
const { getAppUrl } = require('../../utilityclient/url');

function attendancePageUi(req, res) {
    const avatarWardenId = req.session.warden.wardenId;
    res.render('pages/attendance/attendancelist.ejs', {
        appURL: getAppUrl(),
        avatarWardenId: avatarWardenId,
        user: getUserProfile(req.session),
        breadCrumbs : [ 
            {name:'Home', link:'/home'},
            {name:'Attendance', link:'/attendance'}
        ]
        });
}

function addOrEditAttendanceUi(req, res) {
    const avatarWardenId = req.session.warden.wardenId;
    res.render('pages/attendance/attendanceform.ejs', {
        appURL: getAppUrl(),
        avatarWardenId: avatarWardenId,
        user: getUserProfile(req.session),
        breadCrumbs : [ 
            {name:'Home', link:'/home'},
            {name:'Attendance', link:'/attendance'},
        ]
    });
}

function getAttendanceStudentReportUi(req, res) {
    const avatarWardenId = req.session.warden.wardenId;
    res.render('pages/attendance/report.ejs', {
        appURL: getAppUrl(),
        avatarWardenId: avatarWardenId,
        user: getUserProfile(req.session),
        breadCrumbs : [ 
            {name:'Home', link:'/home'},
            {name:'Attendance', link:'/attendance'},
            {name:'Report', link:'/attendance/report'}
        ]
    })
}

module.exports = (app) => {
    app.get('/attendance', attendancePageUi)
    app.get('/attendance/add', addOrEditAttendanceUi)
    app.get('/attendance/report', getAttendanceStudentReportUi)
}
