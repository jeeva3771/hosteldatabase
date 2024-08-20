const express = require('express')
const mysql = require('mysql')
const logger = require('morgan')

//apicontroller
const course = require('./apicontroller/course.js')
const block = require('./apicontroller/block.js')
const warden = require('./apicontroller/warden.js')
const blockFloor = require('./apicontroller/blockfloor.js')
const room = require('./apicontroller/room.js')
const student = require('./apicontroller/student.js')
const attendance = require('./apicontroller/attendance.js')

const app = express()
app.use(logger('dev'))
app.use(express.json())

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

        app.listen(1000, () => {
            console.log('listen 1000port')
        })
    }
})
