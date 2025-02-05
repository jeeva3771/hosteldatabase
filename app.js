const dotenv = require('dotenv');
const express = require('express');
const mysql = require('mysql2');
const pino = require('pino');
const pinoHttp = require('pino-http');
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');
// const FileStore= require('session-file-store')(session);
// const FileStoreStudent = require('session-file-store')(session);
const MySQLStore = require('express-mysql-session')(session);


const { v4: uuidv4 } = require('uuid');

dotenv.config({ path: `env/${process.env.NODE_ENV}.env` });

//apicontroller
const course = require('./apicontroller/course.js');
const block = require('./apicontroller/block.js');
const warden = require('./apicontroller/warden.js');
const blockFloor = require('./apicontroller/blockfloor.js');
const room = require('./apicontroller/room.js');
const student = require('./apicontroller/student.js');
const attendance = require('./apicontroller/attendance.js');
const studentUse = require('./apicontroller/studentuse.js');
const home = require('./apicontroller/home.js');


//uicontroller
const homeUi = require('./uicontroller/page/homeui.js');
const courseUi = require('./uicontroller/page/courseui.js');
const blockUi = require('./uicontroller/page/blockui.js');
const blockFloorUi = require('./uicontroller/page/blockfloorui.js');
const roomUi = require('./uicontroller/page/roomui.js');
const wardenUi = require('./uicontroller/page/wardenui.js');
const studentUi = require('./uicontroller/page/studentui.js');
const attendanceUi = require('./uicontroller/page/attendanceui.js');
const studentUseUi = require('./uicontroller/page/studentuseui.js');
const othersUi = require('./uicontroller/page/othersui.js');

const { getAppUrl, getStudentAppUrl } = require('./utilityclient/url.js');

const logger = pino({
    level: 'info'
});

const dbOptions = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    ssl: {
        rejectUnauthorized: true
    }
};

const sessionStore = new MySQLStore(dbOptions);

function setupApplication(app) {
    app.use(express.static(path.join(__dirname, 'public')));
    app.use(express.json())
    app.use(cookieParser());
    app.use(
        pinoHttp({
            logger,
            customLogLevel: (res, err) => (res.statusCode >= 500 ? 'error' : 'info'),
            customSuccessMessage: (req, res) => `Request to ${req.url} processed`,
            genReqId: (req) => {
                req.startTime = Date.now();
                return req.id || uuidv4();
            },
            customAttributeKeys: {
                reqId: 'requestId',
            },
        })
    );
    
    // Middleware to log the total process time
    app.use((req, res, next) => {
        res.on('finish', () => {
            const processTime = Date.now() - req.startTime;
            req.log.info({ processTime }, `Request processed in ${processTime}ms`);
        });
        next();
    });
    
    app.set('view engine', 'ejs');
    app.set('views', path.join(__dirname, '/uicontroller/views'));

    app.mysqlClient = mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        waitForConnections: true,
        connectionLimit: 5, // Adjust based on your server limit
        queueLimit: 0
    })    

    app.use(session({
        store: sessionStore,
        secret: process.env.SESSION_SECRET,
        resave: false   ,
        saveUninitialized: false,
        cookie: {
            maxAge: (1000 * 60 * 15) // 15 mins
        }
    })); 
};

const studentApp = express()
const wardenApp = express()

setupApplication(wardenApp)
setupApplication(studentApp)

const pageWardenSessionExclude = [
    '/login/',
    '/api/login/',
    '/warden/resetpassword/',
    '/api/warden/generateotp/',
    '/api/warden/resetpassword/'
]

const pageStudentSessionExclude = [
    '/student/login/',
    '/api/student/generateotp/',
    '/api/student/verifyotp/authentication/'
]

// only works for warden
wardenApp.use((req, res, next) => {
    if (pageWardenSessionExclude.includes(req.originalUrl)) {
        return next()
    }
    
    if (req.originalUrl !== '/login') {
        if (req.session.isLogged !== true) {
            return res.status(401).redirect(getAppUrl('login'))
        }
    }
    return next()
})

wardenApp.mysqlClient.connect(function (err) {
    if (err) {
        console.error(err)
    } else {
        console.log('mysql connected')

        course(wardenApp)
        block(wardenApp)
        warden(wardenApp)
        blockFloor(wardenApp)
        room(wardenApp)
        student(wardenApp)
        attendance(wardenApp)
        studentUse(wardenApp)
        home(wardenApp)

        homeUi(wardenApp)
        courseUi(wardenApp)
        blockUi(wardenApp)
        blockFloorUi(wardenApp)
        roomUi(wardenApp)
        wardenUi(wardenApp)
        studentUi(wardenApp)
        attendanceUi(wardenApp)
        studentUseUi(wardenApp)
        othersUi(wardenApp)

        wardenApp.listen(process.env.APP_PORT, () => {
            logger.info(`listen ${process.env.APP_PORT} port`)
        })
    }
})

// only works for student
studentApp.use((req, res, next) => {
    if (pageStudentSessionExclude.includes(req.originalUrl)) {
        return next()
    }

    if (req.originalUrl !== '/student/login/') {
        if (req.session.isLoggedStudent !== true ) {
            return res.status(401).redirect(getStudentAppUrl('student/login'))
        }
    }
    return next()
})

studentApp.mysqlClient.connect(function (err) {
    if (err) {
        console.error(err)
    } else {
        console.log('mysql connected')
        studentUse(studentApp)
        studentUseUi(studentApp)
        studentApp.listen(process.env.STUDENT_APP_PORT, () => {
            logger.info(`listen ${process.env.STUDENT_APP_PORT} port`)
        })
    }
})
