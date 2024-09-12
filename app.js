const express = require('express')
const mysql = require('mysql')
const logger = require('morgan')
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
const homeUi = require('./ui/homeui.js')
const courseUi = require('./ui/courseui.js')
const blockUi = require('./ui/blockui.js')


const app = express()
app.use(logger('dev'))
app.use(express.json())
app.use(cookieParser());
app.use(session({
    secret: 'dhoni',
    resave: true,
    saveUninitialized: true,
    cookie : {
     maxAge:(1000 * 60 * 15)
   } 
 }));
app.use(bodyParser.urlencoded({ extended: true }));


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/uicontroller/views'));

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

        app.listen(1000, () => {
            console.log('listen 1000port')
        })
    }
})
