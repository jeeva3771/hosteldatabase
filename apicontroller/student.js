const { mysqlQuery } = require('../utilityclient.js')
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
    const mysqlClient = req.app.mysqlClient;
    const limit = req.query.limit ? parseInt(req.query.limit) : null;
    const page = req.query.page ? parseInt(req.query.page) : null;
    const offset = limit && page ? (page - 1) * limit : null;
    const orderBy = req.query.orderby || 's.name';
    const sort = req.query.sort || 'ASC';
    const searchQuery = req.query.search || '';

    var studentsQuery = /*sql*/`
        SELECT 
            s.*,
            bk.blockCode,
            b.floorNumber,
            r.roomNumber,
            c.courseName,
            w.firstName AS createdFirstName,
            w.lastName AS createdLastName,
            w2.firstName AS updatedFirstName,
            w2.lastName AS updatedLastName,
            DATE_FORMAT(s.dob, "%y-%b-%D") AS dob,
            DATE_FORMAT(s.joinedDate, "%y-%b-%D") AS joinedDate,
            DATE_FORMAT(s.createdAt, "%y-%b-%D %r") AS createdAt,
            DATE_FORMAT(s.updatedAt, "%y-%b-%D %r") AS updatedAt
            FROM student AS s
            LEFT JOIN 
            block AS bk ON bk.blockId = s.blockId
            LEFT JOIN 
            blockfloor AS b ON b.blockFloorId = s.blockFloorId
            LEFT JOIN 
            room AS r ON r.roomId = s.roomId
            LEFT JOIN 
            course AS c ON c.courseId = s.courseId
            LEFT JOIN 
            warden AS w ON w.wardenId = s.createdBy
            LEFT JOIN 
            warden AS w2 ON w2.wardenId = s.updatedBy
            WHERE 
            s.deletedAt IS NULL 
            AND (s.name LIKE ? OR s.registerNumber LIKE ? OR s.emailId LIKE ? OR s.phoneNumber LIKE ?) 
            ORDER BY 
            ${orderBy} ${sort}`;

    if (limit && offset !== null) {
        studentsQuery += ` LIMIT ? OFFSET ?`;
    }

    const countQuery = /*sql*/ `
        SELECT COUNT(*) AS totalStudentCount 
        FROM student 
        WHERE deletedAt IS NULL`;

    try {
        const searchPattern = `%${searchQuery}%`;
        const queryParameters = [searchPattern, searchPattern, searchPattern, searchPattern]
        const [students, totalCount] = await Promise.all([
            mysqlQuery(studentsQuery, queryParameters, mysqlClient),
            mysqlQuery(countQuery, [], mysqlClient)
        ]);
        console.log(students)
        res.status(200).send({
            students: students,
            studentCount: totalCount[0].totalStudentCount
        });

    } catch (error) {
        console.log(error)
        res.status(500).send(error.message);
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
        address
    } = req.body;
    const createdBy = req.session.data.wardenId
    const validateExistingItems = [
        { name: 'phoneNumber', value: phoneNumber },
        { name: 'fatherNumber', value: fatherNumber },
        { name: 'emailId', value: emailId },
        { name: 'registerNumber', value: registerNumber }
    ]
    const existErrors = []
    const mysqlClient = req.app.mysqlClient;

    const isValidInsert = validateInsertItems(req.body);
    if (isValidInsert.length > 0) {
        return res.status(400).send(isValidInsert);
    }

    try {
        await Promise.all(validateExistingItems.map(async (item) => {
            const checkExisting = await mysqlQuery(
            /*sql*/`SELECT * FROM student WHERE phoneNumber = ? OR fatherNumber = ? OR emailId = ? OR registerNumber = ?`,
                [item.value, item.value, item.value, item.value],
                mysqlClient
            );

            if (checkExisting.length > 0) {
                existErrors.push(`${item.name} already exists`);
            }
        }));

        if (existErrors.length > 0) {
            return res.status(409).send(existErrors);
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
    } catch (error) {
        res.status(500).send(error.message)
    }
}

async function updateStudent(req, res) {
    const studentId = req.params.studentId;
    const mysqlClient = req.app.mysqlClient;
    const updatedBy = req.session.data.wardenId;
    const values = []
    const updates = []

    ALLOWED_UPDATE_KEYS.forEach((key) => {
        keyValue = req.body[key]
        if (keyValue !== undefined) {
            values.push(keyValue)
            updates.push(` ${key} = ?`)
        }
    })

    updates.push(`updatedBy = ?`)
    values.push(updatedBy, studentId)

    try {
        const student = await validateStudentById(studentId, mysqlClient);
        if (!student) {
            return res.status(404).send("Student not found or already deleted");
        }

        const isValidInsert = validateInsertItems(req.body, true);
        if (isValidInsert.length > 0) {
            return res.status(400).send(isValidInsert)
        }

        const isUpdate = await mysqlQuery(/*sql*/`UPDATE student SET  ${updates.join(', ')} WHERE studentId = ? AND deletedAt IS NULL`,
            values, mysqlClient)
        if (isUpdate.affectedRows === 0) {
            res.status(204).send("student not found or no changes made")
        }

        const getUpdatedStudent = await mysqlQuery(/*sql*/`SELECT * FROM student WHERE studentId = ?`,
            [studentId], mysqlClient)
        res.status(200).send({
            status: 'successfull',
            data: getUpdatedStudent[0]
        })
    }
    catch (error) {
        res.status(500).send(error.message)
    }
}

async function deleteStudent(req, res) {
    const studentId = req.params.studentId;
    const mysqlClient = req.app.mysqlClient;
    const deletedBy = req.session.data.wardenId;

    try {
        const isValid = await validateStudentById(studentId, mysqlClient)
        if (!isValid) {
            return res.status(404).send("studentId is not defined")
        }

        const deletedStudent = await mysqlQuery(/*sql*/`UPDATE student SET deletedAt = NOW(), deletedBy = ? WHERE studentId = ? AND deletedAt IS NULL`,
            [deletedBy, studentId],
            mysqlClient
        )
        if (deletedStudent.affectedRows === 0) {
            return res.status(404).send("Room not found or already deleted")
        }

        const getDeletedStudent = await mysqlQuery(/*sql*/`SELECT * FROM student WHERE studentId = ?`,
            [studentId],
            mysqlClient
        )
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
        mysqlClient.query(/*sql*/`select * from student where studentId = ?`, [studentId], (err, student) => {
            if (err) {
                return reject(err)
            }
            resolve(student.length ? student[0] : null)
        })
    })
}

async function validateStudentById(studentId, mysqlClient) {
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
        if (address.length < 5) {
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
