const dotenv = require('dotenv');
const express = require('express');
const mysql = require('mysql');
const pino = require('pino');
const pinoHttp = require('pino-http');
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const fileStoreOptions = {};
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


//uicontroller
const homeUi = require('./uicontroller/page/homeui.js');
const courseUi = require('./uicontroller/page/courseui.js');
const blockUi = require('./uicontroller/page/blockui.js');
const blockFloorUi = require('./uicontroller/page/blockfloorui.js');
const roomUi = require('./uicontroller/page/roomui.js');
const wardenUi = require('./uicontroller/page/wardenui.js');
const studentUi = require('./uicontroller/page/studentui.js');
const attendanceUi = require('./uicontroller/page/attendanceui.js');

const { getAppUrl } = require('./utilityclient/url.js');

const app = express()
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json())
app.use(cookieParser());
app.use(session({
    store: new FileStore(fileStoreOptions),
    secret: 'keyboard',
    resave: true,
    saveUninitialized: false,
    cookie: {
        maxAge: (1000 * 60 * 15)
    }
}));
const logger = pino({
     level: 'info'
});

const pageSessionExclude = [
    '/login',
    '/login/',
    '/api/login/',
    '/warden/resetpassword',
    '/api/warden/generateotp',
    '/api/warden/resetpassword'
]
app.use((req, res, next) => {
    if (pageSessionExclude.includes(req.originalUrl)) {
        return next()
    }

    if (req.originalUrl !== '/login') {
        if (req.session.isLogged !== true) {
            return res.status(401).redirect(getAppUrl('login'))
        }
    }
    return next()
})

app.use((req, res, next) => {
    req.startTime = Date.now(); // Set request start time
    next();
});

app.use(
    pinoHttp({
        logger,
        customLogLevel: (res, err) => (res.statusCode >= 500 ? 'error' : 'info'),
        customSuccessMessage: (req, res) => `Request to ${req.url} processed`,
        genReqId: (req) => {
            req.startTime = Date.now();
            // Use UUID for unique request IDs
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
    database: process.env.DB_NAME
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
        studentUse(app)

        homeUi(app)
        courseUi(app)
        blockUi(app)
        blockFloorUi(app)
        roomUi(app)
        wardenUi(app)
        studentUi(app)
        attendanceUi(app)

        app.listen(process.env.APP_PORT, () => {
            logger.info(`listen ${process.env.APP_PORT} port`)
        })
    }
})

