const express = require('express')
const mysql = require('mysql')
const logger = require('morgan')

const course = require('./apicontroller/course.js')

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

        app.listen(1000, () => {
            console.log('listen 1000port')
        })
    }
})
