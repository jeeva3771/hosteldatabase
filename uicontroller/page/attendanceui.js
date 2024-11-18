const { getUserProfile } = require('../../utilityclient/query')

function attendancePageUi(req, res) {
    res.render('pages/attendance/attendancelist.ejs', {
        user: getUserProfile(req.session),
        breadCrumbs : [ 
            {name:'Home', link:'/home'},
            {name:'Attendance', link:'/attendance'}
        ]
        });
}

function addOrEditAttendanceUi(req, res) {
    res.render('pages/attendance/attendanceform.ejs', {
        user: getUserProfile(req.session),
        breadCrumbs : [ 
            {name:'Home', link:'/home'},
            {name:'Attendance', link:'/attendance'},
        ]
    });
}

function getAttendanceStudentReportUi(req, res) {
    res.render('pages/attendance/report.ejs', {
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
