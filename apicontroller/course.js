const { mysqlQuery } = require('../utilityclient.js')

async function readCourses(req, res) {
    const mysqlClient = req.app.mysqlClient
    try {
        const courses = await mysqlQuery('select * from course', [], mysqlClient);
        res.status(200).send(courses)
    }
    catch (error) {
        res.status(500).send(error.message)
    }
}

async function readCourse(req, res) {
    const mysqlClient = req.app.mysqlClient;
    const courseId = req.params.courseId;
    try {
        const isValid = await validateCourseById(req)
        if (!isValid) {
            return res.status(404).send("courseId not valid")
        }

        const course = await mysqlQuery('select * from course where courseId = ?', [courseId], mysqlClient)
        res.status(200).send(course[0])
    }
    catch (error) {
        res.status(500).send(error.message)
    }
}

async function createCourse(req, res) {
    const { courseName } = req.body

    const isValidInsert = await validateInsertItems(req);
    if (!isValidInsert) {
        return res.status(400).send("Invalid input data for course creation");
    }

    const mysqlClient = req.app.mysqlClient

    try {
        const newCourse = await mysqlQuery('insert into course(courseName) values(?)', [courseName], mysqlClient)
        if (newCourse.affectedRows === 0) {
            res.status(400).send("no insert was made")
        } else {
            res.status(201).send('insert successfully')
        }
    }
    catch (error) {
        console.log(error)
        res.status(500).send(error.message)
    }
}

async function updateCourse(req, res) {
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
        const course = await validateCourseById(courseId, mysqlClient);
        if (!course) {
            return res.status(404).send("course not found or already deleted");
        }

        const isUpdate = await mysqlQuery('update course set ' + updates.join(',') + ' where courseId = ?',
            values, mysqlClient)
        if (isUpdate.affectedRows === 0) {
            res.status(204).send("course not found or no changes made")
        }

        const getUpdatedCourse = await mysqlQuery('select * from course where courseId = ?', [courseId], mysqlClient)
        res.status(200).send({
            status: 'successfull',
            data: getUpdatedCourse[0]
        })
    }
    catch (error) {
        res.status(500).send(error.message)
    }
}

async function deleteCourse(req, res) {
    const courseId = req.params.courseId;
    const mysqlClient = req.app.mysqlClient;

    try {
        const course = await validateCourseById(courseId, mysqlClient);
        if (!course) {
            return res.status(404).send("Course not found or already deleted");
        }

        const deleteCourse = await mysqlQuery('delete from course where courseId = ?', [courseId], mysqlClient)
        res.status(200).send({
            status: 'deleted',
        })
    }
    catch (error) {
        res.status(500).send(error.message)
    }
}

function getCourseById(courseId, mysqlClient) {
    return new Promise((resolve, reject) => {
        mysqlClient.query('select * from course where courseId = ?', [courseId], (err, course) => {
            if (err) {
                return reject(err)
            }
            resolve(course.length ? course[0] : null)
        })
    })
}

async function validateCourseById(req) {
    const courseId = req.params.courseId
    const mysqlClient = req.app.mysqlClient
    var course = await getCourseById(courseId, mysqlClient)
    if (course !== null) {
        return true
    }
    return false
}

async function validateInsertItems(req) {
    const { courseName } = req.body

    if (courseName === '') {
        return false
    }
    return true
}

module.exports = (app) => {
    app.get('/api/course', readCourses)
    app.get('/api/course/:courseId', readCourse)
    app.post('/api/course', createCourse)
    app.put('/api/course/:courseId', updateCourse)
    app.put('/api/course/:courseId', updateCourse)
    app.delete('/api/course/:courseId', deleteCourse)
}