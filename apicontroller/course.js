function readCourse(req, res) {
    const mysqlClient = req.app.mysqlClient
    try {
        mysqlClient.query('select * from course', (err, result) => {
            if (err) {
                res.status(409).send(err.sqlMessage)
            } else {
                res.status(200).send(result)
            }
        })
    } catch (error) {
        console.log(error)
    }
}

function readOneCourse(req, res) {
    const mysqlClient = req.app.mysqlClient;
    const courId = req.params.courseId;
    try {
        mysqlClient.query('select * from course where courseId = ?', [courId], (err, result) => {
            if (err) {
                res.status(404).send(err.sqlMessage)
            } else {
                res.status(200).send(result[0])
            }
        })
    } catch (error) {
        console.log(error)
    }
}

function createCourse(req, res) {
    const { courseName } = req.body

    if (courseName === '') {
        res.status(400).send(err.sqlMessage)
    }

    const mysqlClient = req.app.mysqlClient

    try {
        mysqlClient.query('insert into course(courseName) values(?)', [courseName], (err, result) => {
            if (err) {
                res.status(409).send(err.sqlMessage)
            } else {
                res.status(201).send('insert successfully')
            }
        })
    } catch (error) {
        console.error(error)
    }

}

function updateCourse(req, res) {
    const courseId = req.params.courseId;

    const { courseName = null } = req.body;

    const values = []
    const updates = []

    if (courseName) {
        values.push(courseName)
        updates.push(' courseName = ?')
    }

    values.push(courseId)
    const mysqlClient = req.app.mysqlClient

    try {
        mysqlClient.query('update course set ' + updates.join(',') + ' where courseId = ?', values, (err, result) => {
            if (err) {
                return res.status(409).send(err.sqlMessage)
            } else {
                mysqlClient.query('select * from course where courseId = ?', [courseId], (err2, result2) => {
                    if (err2) {
                        res.status(409).send(err2.sqlMessage)
                    } else {
                        res.status(200).send({
                            status: 'successfull',
                            data: result2[0]
                        })
                    }
                })
            }
        })
    } catch (error) {
        console.log(error)
    }
}

function deleteCourse(req, res) {
    const courseId = req.params.courseId;
    const mysqlClient = req.app.mysqlClient;

    try {
        mysqlClient.query('select * from course where courseId = ?', [courseId], (err, result) => {
            if (err) {
                return res.status(400).send(err.sqlMessage)
            } else {
                mysqlClient.query('delete from course where courseId = ?', [courseId], (err2, result2) => {
                    if (err2) {
                        res.status(400).send(err.sqlMessage)
                    } else {
                        res.status(200).send({
                            status: 'deleted',
                            data: result[0]
                        })
                    }
                })
            }
        })
    } catch (error) {
        console.log(error)
    }
}


module.exports = (app) => {
    app.get('/api/course', readCourse)
    app.get('/api/course/:courseId', readOneCourse)
    app.post('/api/course', createCourse)
    app.put('/api/course/:courseId', updateCourse)
    app.put('/api/course/:courseId', updateCourse)
    app.delete('/api/course/:courseId', deleteCourse)
}