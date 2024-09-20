const { mysqlQuery, insertedBy } = require('../utilityclient.js')
const ALLOWED_UPDATE_KEY = [
    "courseName"
]

async function readCourses(req, res) {
    const mysqlClient = req.app.mysqlClient;
    const limit = parseInt(req.query.limit);
    const page = parseInt(req.query.page);
    const offset = (page - 1) * limit;
    var orderBy = ''
    if (req.method === 'POST') {
        return orderBy += 'c.createdAt DESC'
    } else {
        orderBy += 'c.courseName ASC'
    }

    const coursesQuery = /*sql*/ `
        SELECT 
            c.*,
            w.name AS created,
            w2.name AS updated,
            DATE_FORMAT(c.createdAt, "%Y-%m-%d %T") AS createdAt,
            DATE_FORMAT(c.updatedAt, "%Y-%m-%d %T") AS updatedAt
        FROM 
            course AS c 
        LEFT JOIN
            warden AS w ON w.wardenId = c.createdBy
        LEFT JOIN 
            warden AS w2 ON w2.wardenId = c.updatedBy
        WHERE 
            c.deletedAt IS NULL
        ORDER BY 
        ${orderBy}
        LIMIT ? 
        OFFSET ?`;

    const countQuery = /*sql*/ `
        SELECT COUNT(*) AS totalCourseCount 
        FROM course 
        WHERE deletedAt IS NULL`;

    try {
        const [courses, totalCount] = await Promise.all([
            mysqlQuery(coursesQuery, [limit, offset], mysqlClient),
            mysqlQuery(countQuery, [], mysqlClient)
        ]);

        res.status(200).send({
            courses: courses,
            courseCount: totalCount[0].totalCourseCount
        });

    } catch (error) {
        res.status(500).send(error.message);
    }
}

async function readCourse(req, res) {
    const mysqlClient = req.app.mysqlClient;
    const courseId = req.params.courseId;
    try {
        const course = await mysqlQuery(/*sql*/`SELECT * FROM course WHERE courseId = ?`,
            [courseId],
            mysqlClient
        )
        if (course.length === 0) {
            return res.status(404).send("courseId not valid")
        }
        res.status(200).send(course[0])
    }
    catch (error) {
        res.status(500).send(error.message)
    }
}

async function createCourse(req, res) {
    const mysqlClient = req.app.mysqlClient
    const { courseName } = req.body
    const createdBy = req.session.data.wardenId

    const isValidInsert = validateInsertItems(req.body);
    if (isValidInsert) {
        return res.status(400).send(isValidInsert);
    }

    try {
        const existingCourseName = await mysqlQuery(/*sql*/`SELECT * FROM course WHERE courseName = ?`, [courseName], mysqlClient);
        if (existingCourseName.length > 0) {
            return res.status(409).send("courseName already exists");
        }

        const newCourse = await mysqlQuery(/*sql*/`INSERT INTO course(courseName, createdBy) VALUES(?,?)`, [courseName, createdBy], mysqlClient)
        if (newCourse.affectedRows === 0) {
            res.status(400).send("no insert was made")
        } else {
            res.status(201).send("insert successfull")
        }
    } catch (error) {
        console.log(error)
        res.status(500).send(error.message)
    }
}

async function updateCourse(req, res) {
    const courseId = req.params.courseId;
    const mysqlClient = req.app.mysqlClient;
    const updatedBy = req.session.data.wardenId;
    const values = []
    const updates = []

    ALLOWED_UPDATE_KEY.forEach(key => {
        const keyValue = req.body[key]
        if (keyValue !== undefined) {
            values.push(keyValue)
            updates.push(` ${key} = ?`)
        }
    })

    updates.push("updatedBy = ?")
    values.push(updatedBy, courseId)

    try {
        const course = await validateCourseById(courseId, mysqlClient);
        if (!course) {
            return res.status(404).send("course not found or already deleted");
        }

        const existingCourseName = await mysqlQuery(/*sql*/`SELECT * FROM course WHERE courseName = ?`, values, mysqlClient);
        if (existingCourseName.length > 0) {
            return res.status(409).send("courseName already exists");
        }

        const isValidInsert = validateInsertItems(req.body, true);
        if (isValidInsert) {
            return res.status(400).send(isValidInsert);
        }

        const isUpdate = await mysqlQuery(/*sql*/`UPDATE course SET ${updates.join(', ')} WHERE courseId = ? AND deletedAt IS NULL`,
            values, mysqlClient)
        if (isUpdate.affectedRows === 0) {
            return res.status(204).send("course not found or no changes made")
        }

        const getUpdatedCourse = await mysqlQuery(/*sql*/`SELECT * FROM course WHERE courseId = ?`,
            [courseId],
            mysqlClient
        )
        res.status(200).send({
            status: 'successfull',
            data: getUpdatedCourse[0]
        })
    } catch (error) {
        res.status(500).send(error.message)
    }
}

async function deleteCourse(req, res) {
    const courseId = req.params.courseId;
    const mysqlClient = req.app.mysqlClient;
    const deletedBy = req.session.data.wardenId;

    try {
        const course = await validateCourseById(courseId, mysqlClient);
        if (!course) {
            return res.status(404).send("Course not found or already deleted");
        }

        const deleteCourse = await mysqlQuery(/*sql*/ `UPDATE course SET deletedAt = NOW(), deletedBy = ? 
            WHERE courseId = ? AND deletedAt IS NULL`,
            [deletedBy, courseId],
            mysqlClient
        );

        if (deleteCourse.affectedRows === 0) {
            return res.status(404).send("course not found or already deleted")
        }

        const getDeletedCourse = await mysqlQuery(/*sql*/`SELECT * FROM course WHERE courseId = ?`,
            [courseId],
            mysqlClient
        )
        res.status(200).send({
            status: 'deleted',
            data: getDeletedCourse[0]
        });

    } catch (error) {
        res.status(500).send(error.message)
    }
}

function getCourseById(courseId, mysqlClient) {
    return new Promise((resolve, reject) => {
        mysqlClient.query(/*sql*/`SELECT * FROM course WHERE courseId = ? AND deletedAt IS NULL`, [courseId], (err, course) => {
            if (err) {
                return reject(err)
            }
            resolve(course.length ? course[0] : null)
        })
    })
}

async function validateCourseById(courseId, mysqlClient) {
    var course = await getCourseById(courseId, mysqlClient)
    if (course !== null) {
        return true
    }
    return false
}

function validateInsertItems(body, isUpdate = false) {
    const { courseName } = body

    if (courseName !== undefined) {
        if (courseName.length <= 1) {
            return "courseName is invalid"
        }
    } else if (!isUpdate) {
        return "courseName is missing"
    }
    return
}

module.exports = (app) => {
    app.get('/api/course', readCourses)
    app.get('/api/course/:courseId', readCourse)
    app.post('/api/course', createCourse)
    app.put('/api/course/:courseId', updateCourse)
    app.put('/api/course/:courseId', updateCourse)
    app.delete('/api/course/:courseId', deleteCourse)
}