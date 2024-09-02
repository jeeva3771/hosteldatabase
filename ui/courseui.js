// module.exports = (app) => {
//     app.get('/', async function (req, res) {
//         const response = await fetch('http://localhost:1000/api/course')
//         const courses = await response.json()
//         res.render('pages/course/courselist.ejs', {courses})
//     })
// }

const { mysqlQuery } = require("../utilityclient")

async function loadCourse(req, res) {
    const mysqlClient = req.app.mysqlClient
    const courses = await mysqlQuery(/*sql*/`SELECT *,
    DATE_FORMAT(createdAt, "%m-%d-%Y %T") as createdAt,
    DATE_FORMAT(updatedAt, "%m-%d-%Y %T") as updatedAt
    FROM course WHERE deletedAt IS NULL`, [],
    mysqlClient 
    )
    res.render('pages/course/courselist.ejs', {courses})

}



module.exports = (app) => {
    app.get('/', loadCourse)
}

