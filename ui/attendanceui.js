const { getUserProfile } = require('../utilityclient.js')

function attendancePageUi(req, res) {
    res.render('pages/attendance/attendancelist.ejs', {
        user: getUserProfile(req.session),
        bred : [ {name:'Home', link:'/home'},
            {name:'Attendance', link:'/attendance'}
        ]
        });
}

function addAttendanceUi(req, res) {
    res.render('pages/attendance/attendanceform.ejs', {
        user: getUserProfile(req.session),
        bred : [ 
            {name:'Home', link:'/home'},
            {name:'Attendance', link:'/attendance'},
            {name:'Add', link:'/attendance/add'}
        ]
    });
}

module.exports = (app) => {
    app.get('/attendance', attendancePageUi)
    app.get('/attendance/add', addAttendanceUi)
}
