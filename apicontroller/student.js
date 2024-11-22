const { mysqlQuery } = require('../utilityclient/query')
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '..', 'studentuploads'))
    },
    filename: function (req, file, cb) {
        const operation = req.query.operation;
        const studentId = req.params.studentId;
        console.log(studentId, operation)
        if (operation === 'update' && studentId) {
            console.log('studentId, operation')

            cb(null, `${studentId}.jpg`);
        } else {
            console.log('dkfojof')
            cb(null, file.fieldname + '-' + uniqueSuffix)
        }
    }
})

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/jpeg') {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG are allowed'), false);
    }
};

const upload = multer({ storage, fileFilter })
const multerMiddleware = upload.single('studentImage');

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
    const orderBy = req.query.orderby;
    const sort = req.query.sort;
    const searchQuery = req.query.search || '';
    const searchPattern = `%${searchQuery}%`;
    let queryParameters = null;

    let studentsQuery = /*sql*/`
        SELECT 
            s.*,
            bk.blockCode,
            b.floorNumber,
            r.roomNumber,
            c.courseName,
            w.firstName AS createdFirstName,
            w.lastName AS createdLastName,
            DATE_FORMAT(s.dob, "%y-%b-%D") AS birth,
            DATE_FORMAT(s.joinedDate, "%y-%b-%D") AS joinDate,
            DATE_FORMAT(s.createdAt, "%y-%b-%D %r") AS createdTimeStamp
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
            WHERE 
            s.deletedAt IS NULL 
            AND (s.name LIKE ? OR s.registerNumber LIKE ? OR
                w.firstName LIKE ? OR w.lastName Like ?) 
            ORDER BY 
            ${orderBy} ${sort}`;

    let countQuery = /*sql*/ `
        SELECT COUNT(*) AS totalStudentCount 
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
        WHERE 
            s.deletedAt IS NULL 
        AND (s.name LIKE ? OR s.registerNumber LIKE ? OR
            w.firstName LIKE ? OR w.lastName Like ?)  
        ORDER BY 
        ${orderBy} ${sort}`;

    if (limit >= 0) {
        studentsQuery += ' LIMIT ? OFFSET ?';
        queryParameters = [searchPattern, searchPattern, searchPattern, searchPattern, limit, offset];
    } else {
        queryParameters = [searchPattern, searchPattern, searchPattern, searchPattern];
    }

    const countQueryParameters = [searchPattern, searchPattern, searchPattern, searchPattern];

    try {
        const [students, totalCount] = await Promise.all([
            mysqlQuery(studentsQuery, queryParameters, mysqlClient),
            mysqlQuery(countQuery, countQueryParameters, mysqlClient)
        ]);
        res.status(200).send({
            students: students,
            studentCount: totalCount[0].totalStudentCount
        });

    } catch (error) {
        console.log(error)
        res.status(500).send(error.message);
    }
}

async function readStudentById(req, res) {
    const mysqlClient = req.app.mysqlClient;
    const studentId = req.params.studentId;
    try {
        const student = await mysqlQuery(/*sql*/`SELECT 
            s.*,
            bk.blockCode,
            b.floorNumber,
            r.roomNumber,
            c.courseName,
            w.firstName AS createdFirstName,
            w.lastName AS createdLastName,
            w2.firstName AS updatedFirstName,
            w2.lastName AS updatedLastName,
            DATE_FORMAT(s.dob, "%y-%b-%D") AS birth,
            DATE_FORMAT(s.joinedDate, "%y-%b-%D") AS joinDate,
            DATE_FORMAT(s.createdAt, "%y-%b-%D %r") AS createdTimeStamp,
            DATE_FORMAT(s.updatedAt, "%y-%b-%D %r") AS updatedTimeStamp
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
            s.deletedAt IS NULL AND studentId = ?`,
            [studentId], mysqlClient)
        if (student.length === 0) {
            return res.status(404).send("StudentId not valid");
        }
        res.status(200).send(student[0])
    } catch (error) {
        res.status(500).send(error.message)
    }
}

function readStudentProfileById(req, res) {
    const studentId = req.params.studentId;
    try {
        var fileName = `${studentId}.jpg`;

        const baseDir = path.join(__dirname, '..', 'studentuploads');
        const imagePath = path.join(baseDir, fileName);
        const defaultImagePath = path.join(baseDir, 'studentdefault.jpg');

        const imageToServe = fs.existsSync(imagePath) ? imagePath : defaultImagePath;

        res.setHeader('Content-Type', 'image/jpeg');
        fs.createReadStream(imageToServe).pipe(res);

    } catch (error) {
        res.status(500).send(error.message)
    }
}

async function readStudentsByRoomId(req, res) {
    const mysqlClient = req.app.mysqlClient;
    const roomId = req.params.roomId;
    try {
        const students = await mysqlQuery(/*sql*/`SELECT * FROM student WHERE roomId = ? AND deletedAt IS NULL`,
            [roomId],
            mysqlClient
        )

        if (students.length === 0) {
            return res.status(404).send("RoomId not valid");
        }

        res.status(200).send(students)
    } catch (error) {
        res.status(500).send(error.message)
    }
}

async function getStudentsForAttendanceReport(req, res) {
    const mysqlClient = req.app.mysqlClient
    try {
        var studentsForAttendanceReport = await mysqlQuery(/*sql*/`
        SELECT name, registerNumber FROM student WHERE deletedAt IS NULL ORDER BY name ASC`,
            [], mysqlClient
        )

        if (studentsForAttendanceReport.length === 0) {
            return res.status(404).send('No content found')
        }

        return res.status(200).send(studentsForAttendanceReport)
    } catch (error) {
        res.status(200).send(error.message)
    }
}

async function createStudent(req, res) {
    const existErrors = []
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
    const createdBy = req.session.warden.wardenId
    const validateExistingItems = [
        { name: 'phoneNumber', value: phoneNumber },
        { name: 'fatherNumber', value: fatherNumber },
        { name: 'emailId', value: emailId },
        { name: 'registerNumber', value: registerNumber }
    ]
    const mysqlClient = req.app.mysqlClient;
    const isValidInsert = validateInsertItems(req.body);
    if (isValidInsert.length > 0) {
        return res.status(400).send(isValidInsert);
    }

    try {
        await Promise.all(validateExistingItems.map(async (item) => {
            const checkExisting = await mysqlQuery(
            /*sql*/`SELECT COUNT(*) AS count FROM student WHERE phoneNumber = ? OR fatherNumber = ? OR emailId = ? OR registerNumber = ?`,
                [item.value, item.value, item.value, item.value],
                mysqlClient
            );

            if (checkExisting[0].count > 0) {
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
            res.status(400).send("No insert was made")
        }
        res.status(201).send('Insert successfully')
    } catch (error) {
        res.status(500).send(error.message)
    }
}

function updateStudentProfile(req, res) {
    let uploadedFilePath;
    const wardenId = req.session.warden.wardenId;

    if (wardenId !== req.session.warden.wardenId && req.session.warden.superAdmin !== 1) {
        return res.status(409).send('Warden is not valid to edit')
    }

    if (!req.file) {
        uploadedFilePath = path.join(__dirname, '..', 'studentuploads', 'studentdefault.jpg');
    } else {
        uploadedFilePath = req.file.path;
    }

    try {
        sharp(fs.readFileSync(uploadedFilePath))
            .resize({
                width: parseInt(process.env.IMAGE_WIDTH),
                height: parseInt(process.env.IMAGE_HEIGHT),
                fit: sharp.fit.cover,
                position: sharp.strategy.center,
            })
            .toFile(uploadedFilePath);
        return res.status(200).json('Student profile updated successfully');
    } catch (error) {
        console.error(error);
        return res.status(500).json('Internal server error');
    }
}

async function updateStudentById(req, res) {
    const studentId = req.params.studentId;
    const mysqlClient = req.app.mysqlClient;
    const updatedBy = req.session.warden.wardenId;
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

function deleteStudentProfile(req, res) {
    const studentId = req.params.studentId;
    // const wardenId = req.session.warden.wardenId;
    // if (wardenId !== req.session.warden.wardenId && req.session.warden.superAdmin !== 1) {
    //     return res.status(409).send('Warden is not valid to delete')
    // }

    try {
        const rootDir = path.resolve(__dirname, '../');
        const profilePath = path.join(rootDir, 'studentuploads', `${studentId}.jpg`);

        fs.unlink(profilePath, (err) => {
            if (err) {
                return res.status(500).send('Profile reference removed but file deletion failed');
            }
            res.status(200).send('Profile removed successfully');
        });
    } catch (error) {
        console.log(error)
        res.status(500).send('Internal Server Error');
    }
}

async function deleteStudentById(req, res) {
    const studentId = req.params.studentId;
    const mysqlClient = req.app.mysqlClient;
    const deletedBy = req.session.warden.wardenId;

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
    app.get('/api/student/:studentId/profile', readStudentProfileById)
    app.put('/api/student/:studentId/editprofile', multerMiddleware, updateStudentProfile)
    app.delete('/api/student/:studentId/deleteprofile', deleteStudentProfile)
    app.get('/api/student', readStudents)
    app.get('/api/student/getstudent', getStudentsForAttendanceReport)
    app.get('/api/student/:studentId', readStudentById)
    app.get('/api/student/room/:roomId', readStudentsByRoomId)
    app.post('/api/student', multerMiddleware, createStudent)
    app.put('/api/student/:studentId', updateStudentById)
    app.delete('/api/student/:studentId', deleteStudentById)
}
