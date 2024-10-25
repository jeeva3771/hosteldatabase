const express = require('express');
const mysql = require('mysql');
const logger = require('pino')();
const pinoReqLogger = require('pino-http')();
const path = require('path');

var cookieParser = require('cookie-parser');
var session = require('express-session');
var bodyParser = require('body-parser');
var FileStore = require('session-file-store')(session);
var fileStoreOptions = {};

//apicontroller
const course = require('./apicontroller/course.js')
const block = require('./apicontroller/block.js')
const warden = require('./apicontroller/warden.js')
const blockFloor = require('./apicontroller/blockfloor.js')
const room = require('./apicontroller/room.js')
const student = require('./apicontroller/student.js')
const attendance = require('./apicontroller/attendance.js')

//uicontroller
const homeUi = require('./ui/homeui.js')
const courseUi = require('./ui/courseui.js')
const blockUi = require('./ui/blockui.js')
const blockFloorUi = require('./ui/blockfloorui.js')
const roomUi = require('./ui/roomui.js')
const wardenUi = require('./ui/wardenui.js')
const studentUi = require('./ui/studentui.js')
const attendanceUi = require('./ui/attendanceui.js')

const app = express()
app.use(express.json())
app.use(pinoReqLogger)
app.use(cookieParser());
app.use(session({
    store: new FileStore(fileStoreOptions),
    secret: 'keyboard',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: (1000 * 60 * 15)
    }
}));
const urlOption = ['/login','/warden/resetPassword','/api/warden/newPassword','/api/warden/generateOtp']

// app.use((req, res, next) => {
//     if(req.originalUrl === urlOption(includes)) {

//     }
// })

app.use((req, res, next) => {
    if (req.originalUrl === '/login' || (req.originalUrl === '/api/login'  && req.method === 'POST')) {
        return next();
    }

    if ((req.originalUrl === '/warden/resetPassword') || (req.originalUrl === '/warden/resetPassword' && req.method === 'POST')) {
        return next();
    }

    if ((req.originalUrl === '/api/warden/generateOtp' && req.method === 'POST') || req.originalUrl === '/api/warden/generateOtp') {
        return next();
    }

    if ((req.originalUrl === '/api/warden/validateOtp/newPassword' && req.method === 'PUT') || req.originalUrl === '/api/warden/validateOtp/newPassword') {
        return next();
    }

    if (req.originalUrl !== '/login') {
        if (req.session.isLogged !== true) {
            return res.status(401).redirect('http://localhost:1000/login')
        }
    } else {
        if (req.session.isLogged === true) {
            return res.status(200).redirect('http://localhost:1000/home')
        }
    }
    return next()
})

app.use(bodyParser.urlencoded({ extended: true }));


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/uicontroller/views'));
app.use(express.static(path.join(__dirname, 'public')));

app.mysqlClient = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'hosteldatabase'
})

app.mysqlClient.connect(function (err) {
    if (err) {
        console.error(err)
    } else {
        console.log('mysql connected')

        course(app)
        block(app)
        warden(app)
        blockFloor(app)
        room(app)
        student(app)
        attendance(app)
        homeUi(app)
        courseUi(app)
        blockUi(app)
        blockFloorUi(app)
        roomUi(app)
        wardenUi(app)
        studentUi(app)
        attendanceUi(app)

        app.listen(1000, () => {
            logger.info('listen 1000port')
        })
    }
})

