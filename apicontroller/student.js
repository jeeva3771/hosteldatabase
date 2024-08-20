const { mysqlQuery } = require('../utilityclient.js')

async function readStudents(req, res) {
    const mysqlClient = req.app.mysqlClient
    try {
        const students = await mysqlQuery('select * from student where deletedAt is null', [], mysqlClient);
        res.status(200).send(students)
    }
    catch (error) {
        res.status(500).send(error.message)
    }
}

async function readStudent(req, res) {
    const mysqlClient = req.app.mysqlClient;
    const studentId = req.params.studentId;
    try {
        const isValid = await validateStudentById(req)
        if (!isValid) {
            return res.status(404).send("StudentId not valid")
        }
        const student = await mysqlQuery('select * from student where studentId = ?', [studentId], mysqlClient)
        res.status(200).send(student[0])
    }
    catch (error) {
        res.status(500).send(error.message)
    }
}

async function createStudent(req, res) {
    const {
        roomId,
        blockFloorId,
        blockId,
        name,
        registerNumber,
        dob,
        courseId,
        joinedDate,
        phoneNumber,
        emailId,
        fatherName,
        fatherNumber,
        address,
        createdBy = 6
    } = req.body

    const isValidInsert = await validateInsertItems(req);
    if (!isValidInsert) {
        return res.status(400).send("Invalid input data for student creation");
    }

    const mysqlClient = req.app.mysqlClient

    try {
        const newStudent = await mysqlQuery('insert into student (roomId,blockFloorId,blockId,name,registerNumber,dob,courseId,joinedDate,phoneNumber,emailId,fatherName,fatherNumber,address,createdBy) values(?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
            [roomId, blockFloorId, blockId, name, registerNumber, dob, courseId, joinedDate, phoneNumber, emailId, fatherName, fatherNumber, address, createdBy],
            mysqlClient)
        if (newStudent.affectedRows === 0) {
            res.status(400).send("no insert was made")
        } else {
            res.status(201).send('insert successfully')
        }
    }
    catch (error) {
        res.status(500).send(error.message)
    }
}

async function updateStudent(req, res) {
    const studentId = req.params.studentId;

    const {
        roomId = null,
        blockFloorId = null,
        blockId = null,
        name = null,
        registerNumber = null,
        dob = null,
        courseId = null,
        joinedDate = null,
        phoneNumber = null,
        emailId = null,
        fatherName = null,
        fatherNumber = null,
        address = null,
        updatedBy = 8
    } = req.body;

    const values = []
    const updates = []

    if (roomId) {
        values.push(roomId)
        updates.push(' roomId = ?')
    }

    if (blockFloorId) {
        values.push(blockFloorId)
        updates.push(' blockFloorId = ?')
    }

    if (blockId) {
        values.push(blockId)
        updates.push(' blockId = ?')
    }

    if (name) {
        values.push(name)
        updates.push(' name = ?')
    }

    if (registerNumber) {
        values.push(registerNumber)
        updates.push(' roomCapacity = ?')
    }

    if (dob) {
        values.push(dob)
        updates.push(' dob = ?')
    }

    if (courseId) {
        values.push(courseId)
        updates.push(' courseId = ?')
    }

    if (joinedDate) {
        values.push(joinedDate)
        updates.push(' joinedDate = ?')
    }

    if (courseId) {
        values.push(courseId)
        updates.push(' updatedBy = ?')
    }

    if (phoneNumber) {
        values.push(phoneNumber)
        updates.push(' phoneNumber = ?')
    }

    if (emailId) {
        values.push(emailId)
        updates.push(' emailId = ?')
    }

    if (fatherName) {
        values.push(fatherName)
        updates.push(' fatherName = ?')
    }

    if (fatherNumber) {
        values.push(fatherNumber)
        updates.push(' fatherNumber = ?')
    }

    if (address) {
        values.push(address)
        updates.push(' address = ?')
    }

    values.push(8)
    updates.push(' updatedBy = ?')

    values.push(studentId)
    const mysqlClient = req.app.mysqlClient

    try {
        const student = await validateStudentById(studentId, mysqlClient);
        if (!student || student.deletedAt !== null) {
            return res.status(404).send("Student not found or already deleted");
        }

        const isUpdate = await mysqlQuery('update student set ' + updates.join(',') + ' where studentId = ? and deletedAt is null',
            values, mysqlClient)
        if (isUpdate.affectedRows === 0) {
            res.status(204).send("student not found or no changes made")
        }

        const getUpdatedStudent = await mysqlQuery('select * from student where studentId = ?',
            [studentId], mysqlClient)
        res.status(200).send({
            status: 'successfull',
            data: getUpdatedStudent[0]
        })
    }
    catch (error) {
        console.log(error)
        res.status(500).send(error.message)
    }
}

async function deleteStudent(req, res) {
    const studentId = req.params.studentId;
    const mysqlClient = req.app.mysqlClient;

    try {
        const isValid = await validateStudentById(req)
        if (!isValid) {
            return res.status(404).send("studentId is not defined")
        }

        const deletedStudent = await mysqlQuery('update student set deletedAt = now(), deletedBy = 8 where studentId = ? and deletedAt is null',
            [studentId], mysqlClient)
        if (deletedStudent.affectedRows === 0) {
            return res.status(404).send("Room not found or already deleted")
        }

        const getDeletedStudent = await mysqlQuery('select * from student where studentId = ?', [studentId], mysqlClient)
        res.status(200).send({
            status: 'deleted',
            data: getDeletedStudent[0]
        })
    }
    catch (error) {
        res.status(500).send(error.message)
    }
}

function getStudentById(studentId, mysqlClient) {
    return new Promise((resolve, reject) => {
        mysqlClient.query('select * from student where studentId = ?', [studentId], (err, student) => {
            if (err) {
                return reject(err)
            }
            resolve(student.length ? student[0] : null)
        })
    })
}

async function validateStudentById(req) {
    const studentId = req.params.studentId
    const mysqlClient = req.app.mysqlClient
    var student = await getStudentById(studentId, mysqlClient)
    if (student !== null) {
        return true
    }
    return false
}

async function validateInsertItems(req) {
    const {
        roomId,
        blockFloorId,
        blockId,
        name,
        registerNumber,
        dob,
        courseId,
        joinedDate,
        phoneNumber,
        emailId,
        fatherName,
        fatherNumber,
        address
    } = req.body

    if (roomId === '' || blockFloorId === '' || blockId === '' || name === '' || registerNumber === '' ||
        dob === '' || courseId === '' || joinedDate === '' || phoneNumber === '' || emailId === '' ||
        fatherName === '' || fatherNumber === '' || address === '') {
        return false
    }
    return true
}

module.exports = (app) => {
    app.get('/api/student', readStudents)
    app.get('/api/student/:studentId', readStudent)
    app.post('/api/student', createStudent)
    app.put('/api/student/:studentId', updateStudent)
    app.delete('/api/student/:studentId', deleteStudent)

}
