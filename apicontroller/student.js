function readStudent(req, res) {
    const mysqlClient = req.app.mysqlClient
    try {
        mysqlClient.query('select * from student', (err, result) => {
            if (err) {
                res.status(409).send(err.sqlMessage)
            } else {
                res.status(200).send(result)
            }
        })
    } catch (error) {
        res.status(500).send(error)
    }
}

function readOneStudent(req, res) {
    const mysqlClient = req.app.mysqlClient;
    const studentId = req.params.studentId;
    try {
        mysqlClient.query('select * from student where studentId = ?', [studentId], (err, result) => {
            if (err) {
                res.status(404).send(err.sqlMessage)
            } else {
                res.status(200).send(result[0])
            }
        })
    } catch (error) {
        res.status(500).send(error)
    }
}

function createStudent(req, res) {
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

    if (roomId === '' || blockFloorId === '' || blockId === '' || name === '' || registerNumber === '' || dob === '' || courseId === '' || joinedDate === '' || phoneNumber === '' || emailId === '' || fatherName === '' || fatherNumber === '' || address === '') {
        res.status(400).send(err.sqlMessage)
    }

    const mysqlClient = req.app.mysqlClient

    try {
        mysqlClient.query('insert into student (roomId,blockFloorId,blockId,name,registerNumber,dob,courseId,joinedDate,phoneNumber,emailId,fatherName,fatherNumber,address,createdBy) values(?,?,?,?,?,?,?,?,?,?,?,?,?,?)', [roomId, blockFloorId, blockId, name, registerNumber, dob, courseId, joinedDate, phoneNumber, emailId, fatherName, fatherNumber, address, createdBy], (err, result) => {
            if (err) {
                res.status(409).send(err.sqlMessage)
            } else {
                res.status(201).send('insert successfully')
            }
        })
    } catch (error) {
        res.status(500).send(error)
    }
}

function updateStudent(req, res) {
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
        updatedBy = null
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

    if (updatedBy) {
        values.push(updatedBy)
        updates.push(' updatedBy = ?')
    }

    values.push(studentId)
    const mysqlClient = req.app.mysqlClient

    try {
        mysqlClient.query('update student set ' + updates.join(',') + ' where studentId = ?', values, (err, result) => {
            if (err) {
                return res.status(409).send(err.sqlMessage)
            } else {
                mysqlClient.query('select * from student where studentId = ?', [studentId], (err2, result2) => {
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
        res.status(500).send(error)
    }
}

async function deleteStudent(req, res) {
    const studentId = req.params.studentId;
    const mysqlClient = req.app.mysqlClient;

    try {
        mysqlClient.query('select * from student where studentId = ?', [studentId], (err, result) => {
            if (err) {
                return res.status(400).send(err.sqlMessage)
            } else {
                mysqlClient.query('update student set deletedAt = now() where studentId = ?', [studentId], (err2, result2) => {
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
        res.status(500).send(error)
    }
}


module.exports = (app) => {
    app.get('/api/student', readStudent)
    app.get('/api/student/:studentId', readOneStudent)
    app.post('/api/student', createStudent)
    app.put('/api/student/:studentId', updateStudent)
    app.delete('/api/student/:studentId', deleteStudent)

}
