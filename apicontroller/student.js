const { mysqlQuery, insertedBy } = require('../utilityclient.js')
const ALLOWED_UPDATE_KEYS = [
    "roomId",
    "blockFloorId",
    "blockId",
    "name",
    "registerNumber",
    "dob",
    "courseId",
    "joinedDate",
    "phoneNumber",
    "emailId",
    "fatherName",
    "fatherNumber",
    "address"
]

async function readStudents(req, res) {
    const mysqlClient = req.app.mysqlClient
    try {
        const students = await mysqlQuery(/*sql*/`SELECT * FROM student WHERE deletedAt IS NULL`, [], mysqlClient);
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
        const student = await mysqlQuery(/*sql*/`SELECT * FROM student WHERE studentId = ?`, [studentId], mysqlClient)
        if (student.length === 0) {
            return res.status(404).send("StudentId not valid");
        }
        res.status(200).send(student[0])
    } catch (error) {
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
        createdBy = `${insertedBy}`
    } = req.body
    const mysqlClient = req.app.mysqlClient;

    const isValidInsert = validateInsertItems(req.body);
    if (isValidInsert) {
        return res.status(400).send(isValidInsert);
    }

    try {
        const checkExisting = await mysqlQuery(/*sql*/`SELECT * FROM student WHERE  phoneNumber = ? OR fatherNumber = ? OR emailId = ? OR registerNumber = ?`,
            [phoneNumber, fatherNumber, emailId, registerNumber],
            mysqlClient
        )
        if (checkExisting.length > 0) {
            return res.status(409).send("phoneNumber or fatherNumber or emailId or registerNumber already exists");
        }

        const newStudent = await mysqlQuery(/*sql*/`INSERT INTO student (roomId,blockFloorId,blockId,name,registerNumber,dob,courseId,joinedDate,phoneNumber,emailId,fatherName,fatherNumber,address,createdBy)
            VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [roomId, blockFloorId, blockId, name, registerNumber, dob, courseId, joinedDate, phoneNumber, emailId, fatherName, fatherNumber, address, createdBy],
            mysqlClient)
        if (newStudent.affectedRows === 0) {
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

function validateInsertItems(body, isUpdate = false) {
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
    } = body
    const phoneNumberPattern = /^(\d{10}|\(\d{3}\)\s?\d{3}-\d{4}|\d{3}-\d{3}-\d{4}|\d{3}\s\d{3}\s\d{4})$/;
    const errors = []

    if (roomId !== undefined) {
        if (isNaN(roomId) || roomId <= 0)
            errors.push('roomId is invalid')
    } else if (!isUpdate) {
        errors.push('roomId is missing')
    }

    if (blockFloorId !== undefined) {
        if (isNaN(blockFloorId) || blockFloorId <= 0)
            errors.push('blockFloorId is invalid')
    } else if (!isUpdate) {
        errors.push('blockFloorId is missing')
    }

    if (blockId !== undefined) {
        if (isNaN(blockId) || blockId <= 0)
            errors.push('blockId is invalid')
    } else if (!isUpdate) {
        errors.push('blockId is missing')
    }

    if (name !== undefined) {
        if (name.length < 2) {
            errors.push('name is invalid')
        }
    } else if (!isUpdate) {
        errors.push('name is missing')
    }

    if (registerNumber !== undefined) {
        if (registerNumber.length < 2) {
            errors.push('registerNumber is invalid')
        }
    } else if (!isUpdate) {
        errors.push('registerNumber is missing')
    }

    if (dob !== undefined) {
        const date = new Date(dob);
        if (isNaN(date.getTime())) {
            errors.push('dob is invalid');
        } else {
            const today = new Date();
            if (date > today) {
                errors.push('dob cannot be in the future');
            }
        }
    } else if (!isUpdate) {
        errors.push('dob is missing')
    }

    if (courseId !== undefined) {
        if (isNaN(courseId) || courseId <= 0)
            errors.push('courseId is invalid')
    } else if (!isUpdate) {
        errors.push('courseId is missing')
    }

    if (joinedDate !== undefined) {
        const date = new Date(joinedDate);
        if (isNaN(date.getTime())) {
            errors.push('joinedDate is invalid');
        } else {
            const today = new Date();
            if (date > today) {
                errors.push('joinedDate cannot be in the future');
            }
        }
    } else if (!isUpdate) {
        errors.push('dob is missing')
    }

    if (phoneNumber !== undefined) {
        var phoneNumberCheck = phoneNumberPattern.test(phoneNumber)
        if (phoneNumberCheck === false) {
            errors.push('phoneNumber is invalid');
        }
    } else if (!isUpdate) {
        errors.push('phoneNumber is missing');
    }

    if (emailId !== undefined) {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        var emailCheck = emailPattern.test(emailId)
        if (emailCheck === false) {
            errors.push('emailId is invalid');
        }
    } else if (!isUpdate) {
        errors.push('emailId is missing');
    }

    if (fatherName !== undefined) {
        if (fatherName.length < 2) {
            errors.push('fatherName is invalid')
        }
    } else if (!isUpdate) {
        errors.push('fatherName is missing')
    }

    if (fatherNumber !== undefined) {
        var phoneNumberCheck = phoneNumberPattern.test(fatherNumber)
        if (phoneNumberCheck === false) {
            errors.push('fatherNumber is invalid');
        }
    } else if (!isUpdate) {
        errors.push('fatherNumber is missing');
    }

    if (address !== undefined) {
        if (address.length < 2) {
            errors.push('address is invalid')
        }
    } else if (!isUpdate) {
        errors.push('address is missing')
    }

    return errors
}


module.exports = (app) => {
    app.get('/api/student', readStudents)
    app.get('/api/student/:studentId', readStudent)
    app.post('/api/student', createStudent)
    app.put('/api/student/:studentId', updateStudent)
    app.delete('/api/student/:studentId', deleteStudent)

}
