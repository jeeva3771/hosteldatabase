const { mysqlQuery } = require('../utilityclient.js')

const ALLOWED_UPDATE_KEYS = [
    "studentId",
    "roomId",
    "blockFloorId",
    "blockId",
    "checkInDate",
    "isPresent"
]
async function readAttendances(req, res) {
    const mysqlClient = req.app.mysqlClient;
    const limit = req.query.limit ? parseInt(req.query.limit) : null;
    const page = req.query.page ? parseInt(req.query.page) : null;
    const offset = limit && page ? (page - 1) * limit : null;
    const orderBy = req.query.orderby || 'a.attendanceId';
    const sort = req.query.sort || 'ASC';
    const searchQuery = req.query.search || '';
    const searchPattern = `%${searchQuery}%`;
    const queryParameters = [searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern]

    var attendancesQuery = /*sql*/`
        SELECT 
            a.*,
            s.name,
            s2.registerNumber,
            r.roomNumber,
            b.floorNumber,
            bk.blockCode,
            w.firstName AS reviewedWardenFirstName,
            w.LastName AS reviewedWardenLastName,
            w2.firstName AS updatedWardenFirstName,
            w2.LastName AS updatedWardenLastName,
        DATE_FORMAT(a.checkInDate, "%y-%b-%D") AS checkIn,
        DATE_FORMAT(a.createdAt, "%y-%b-%D %r") AS createdTimeStamp,
        DATE_FORMAT(a.updatedAt, "%y-%b-%D %r") AS updatedTimeStamp
        FROM attendance AS a
        LEFT JOIN
            student AS s ON s.studentId = a.studentId
        LEFT JOIN
            student AS s2 ON s2.studentId = a.studentId
        LEFT JOIN 
            room AS r ON r.roomId = a.roomId  
        LEFT JOIN 
            blockfloor AS b ON b.blockFloorId = a.blockFloorId 
        LEFT JOIN 
            block AS bk ON bk.blockId = a.blockId
        LEFT JOIN
            warden AS w ON w.wardenId = a.wardenId
        LEFT JOIN 
            warden AS w2 ON w2.wardenId = a.updatedBy
        WHERE
        (s.name LIKE ? OR S2.registerNumber LIKE ? OR bk.blockCode LIKE ? OR b.floorNumber LIKE ? OR r.roomNumber LIKE ? OR a.checkInDate LIKE ? OR a.isPresent LIKE ?)
        ORDER BY 
         ${orderBy} ${sort}`;

    if (limit && offset !== null) {
        attendancesQuery += ` LIMIT ? OFFSET ?`;
        queryParameters.push(limit, offset)
    }

    const countQuery = /*sql*/ `
        SELECT COUNT(*) AS totalAttendanceCount 
        FROM attendance`;

    try {
        const [attendances, totalCount] = await Promise.all([
            mysqlQuery(attendancesQuery, queryParameters, mysqlClient),
            mysqlQuery(countQuery, [], mysqlClient)
        ]);

        res.status(200).send({
            attendances: attendances,
            attendanceCount: totalCount[0].totalAttendanceCount
        });

    } catch (error) {
        res.status(500).send(error.message);
    }
}

async function readAttendanceById(req, res) {
    const mysqlClient = req.app.mysqlClient;
    const attendanceId = req.params.attendanceId;
    try {
        const attendance = await mysqlQuery(/*sql*/`
             SELECT 
            a.*,
            s.name,
            s2.registerNumber,
            r.roomNumber,
            b.floorNumber,
            bk.blockCode,
            w.firstName AS reviewedWardenFirstName,
            w.LastName AS reviewedWardenLastName,
            w2.firstName AS updatedWardenFirstName,
            w2.LastName AS updatedWardenLastName,
        DATE_FORMAT(a.checkInDate, "%y-%b-%D") AS checkIn,
        DATE_FORMAT(a.createdAt, "%y-%b-%D %r") AS createdTimeStamp,
        DATE_FORMAT(a.updatedAt, "%y-%b-%D %r") AS updatedTimeStamp
        FROM attendance AS a
        LEFT JOIN
            student AS s ON s.studentId = a.studentId
        LEFT JOIN
            student AS s2 ON s2.studentId = a.studentId
        LEFT JOIN 
            room AS r ON r.roomId = a.roomId  
        LEFT JOIN 
            blockfloor AS b ON b.blockFloorId = a.blockFloorId 
        LEFT JOIN 
            block AS bk ON bk.blockId = a.blockId
        LEFT JOIN
            warden AS w ON w.wardenId = a.wardenId
        LEFT JOIN 
            warden AS w2 ON w2.wardenId = a.updatedBy 
        WHERE 
            attendanceId = ?`,
        [attendanceId],
        mysqlClient
        );

        if (attendance.length === 0) {
            return res.status(404).send("attendanceId not valid");
        }
        res.status(200).send(attendance[0])
    } catch (error) {
        res.status(500).send(error.message)
    }
}

// async function createAttendance(req, res) {
//     const mysqlClient = req.app.mysqlClient
//     const {
//         studentId,
//         roomId,
//         blockFloorId,
//         blockId,
//         checkInDate = new Date().toISOString().slice(0, 10),
//         isPresent
//     } = req.body
//     const wardenId = req.session.data.wardenId

//     const isValidInsert = validateInsertItems(req.body);
//     if (isValidInsert.length > 0) {
//         return res.status(400).send(isValidInsert);
//     }

//     try {
//         const dayAttendance = await mysqlQuery(/*sql*/`INSERT INTO 
//             attendance(studentId, roomId, blockFloorId, blockId, checkInDate, isPresent, wardenId)
//             VALUES(?,?,?,?,?,?,?)`,
//             [studentId, roomId, blockFloorId, blockId, checkInDate, isPresent, wardenId],
//             mysqlClient
//         )
//         if (dayAttendance.affectedRows === 0) {
//             res.status(400).send("no insert was made")
//         } else {
//             res.status(201).send('insert successfull')
//         }
//     } catch (error) {
//         res.status(500).send(error.message)
//     }
// }

async function createAttendance(req, res) {
    const mysqlClient = req.app.mysqlClient;
    const { blockId, blockFloorId, roomId, attendance, checkInDate = new Date().toISOString().slice(0, 10) } = req.body;
    const wardenId = req.session.data.wardenId;

    if (!blockId || !blockFloorId || !roomId) {
        return res.status(400).send('Block ID, Block Floor ID, and Room ID are required.');
    }

    if (!attendance || Object.keys(attendance).length === 0) {
        return res.status(400).send('Attendance data is missing.');
    }

    try {
        const block = await mysqlQuery(/*sql*/ `SELECT * FROM block WHERE blockId = ?`, [blockId], mysqlClient);
        if (block.length === 0) {
            return res.status(404).send('Block not found.');
        }

        const blockFloor = await mysqlQuery(/*sql*/ `SELECT * FROM blockfloor WHERE blockFloorId = ? AND blockId = ?`, [blockFloorId, blockId], mysqlClient);
        if (blockFloor.length === 0) {
            return res.status(404).send('Block floor not found for the specified block.');
        }

        const room = await mysqlQuery(/*sql*/ `SELECT * FROM room WHERE roomId = ? AND blockId = ? AND blockFloorId = ?`, [roomId, blockId, blockFloorId], mysqlClient);
        if (room.length === 0) {
            return res.status(404).send('Room not found for the specified block and block floor.');
        }

        const students = await mysqlQuery(/*sql*/ `SELECT studentId FROM student WHERE roomId = ?`, [roomId], mysqlClient);
        if (students.length === 0) {
            return res.status(404).send('No students found for the specified room.');
        }

        for (const student of students) {
            const isPresent = attendance[student.studentId]; 
            if (typeof isPresent !== 'undefined') {
                await mysqlQuery(/*sql*/`
                    INSERT INTO attendance (studentId, roomId, blockId, blockFloorId, checkInDate, isPresent, wardenId)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE isPresent = ?, checkInDate = ?`,
                    [student.studentId, roomId, blockId, blockFloorId, checkInDate, isPresent, wardenId],
                    mysqlClient
                );
            }
        }
        res.status(201).send('Attendance successfully recorded.');
    } catch (error) {
        res.status(500).send(error.message);
    }
}


async function updateAttendanceById(req, res) {
    const mysqlClient = req.app.mysqlClient
    const attendanceId = req.params.attendanceId;
    const updatedBy = req.session.data.wardenId;

    const values = []
    const updates = []

    ALLOWED_UPDATE_KEYS.forEach(key => {
        const keyValue = req.body[key]
        if (keyValue !== undefined) {
            values.push(keyValue)
            updates.push(` ${key} = ? `)
        }
    })

    updates.push('updatedBy = ?')
    values.push(updatedBy, attendanceId)

    try {
        const attendance = await mysqlQuery(/*sql*/`SELECT * FROM attendance WHERE attendanceId = ? `,
            [attendanceId],
            mysqlClient
        )
        if (attendance.length === 0) {
            return res.status(404).send('attendanceId not found')
        }

        const isValidInsert = validateInsertItems(req.body, true);
        if (isValidInsert.length > 0) {
            return res.status(400).send(isValidInsert)
        }

        const isUpdate = await mysqlQuery(/*sql*/`UPDATE attendance SET ${updates.join(', ')} WHERE attendanceId = ? `,
            values, mysqlClient)
        if (isUpdate.affectedRows === 0) {
            res.status(204).send("attendanceId not found or no changes made")
        }

        const getUpdatedAttendance = await mysqlQuery(/*sql*/`SELECT * FROM attendance WHERE attendanceId = ? `,
            [attendanceId],
            mysqlClient)
        res.status(200).send({
            status: 'successfull',
            data: getUpdatedAttendance[0]
        })
    } catch (error) {
        res.status(500).send(error.message)
    }
}

async function attendanceListById(req, res) {
    const mysqlClient = req.app.mysqlClient;
    const studentId = req.params.studentId;
    const { startDate, endDate } = req.query

    try {
        const student = await mysqlQuery(/*sql*/`SELECT * FROM student WHERE studentId = ? `,
            [studentId],
            mysqlClient
        )
        if (student.length === 0) {
            return res.status(404).send('studentId is invalid')
        }

        const attendanceList = await mysqlQuery(/*sql*/`SELECT * FROM attendance WHERE DATE >= ? AND DATE <= ? AND studentId = ? `,
            [startDate, endDate, studentId],
            mysqlClient
        )
        return res.status(200).send(attendanceList)
    } catch (error) {
        return res.status(500).send(error.message)
    }
}

function validateInsertItems(body, isUpdate = false) {
    const {
        studentId,
        roomId,
        blockFloorId,
        blockId,
        checkInDate,
        isPresent
    } = body

    const errors = []

    if (studentId !== undefined) {
        if (isNaN(studentId) || studentId <= 0) {
            errors.push('studentId is invalid')
        }
    } else if (!isUpdate) {
        errors.push('studentId is missing')
    }

    if (roomId !== undefined) {
        if (isNaN(roomId) || roomId <= 0) {
            errors.push('roomId is invalid')
        }
    } else if (!isUpdate) {
        errors.push('roomId is missing')
    }

    if (blockFloorId !== undefined) {
        if (isNaN(blockFloorId) || blockFloorId <= 0) {
            errors.push('blockFloorId is invalid')
        }
    } else {
        errors.push('blockFloorId is missing')
    }

    if (blockId !== undefined) {
        if (isNaN(blockId) || blockId <= 0) {
            errors.push('blockId is invalid')
        }
    } else {
        errors.push('blockId is missing')
    }

    if (isPresent !== undefined) {
        if (![0, 1].includes(isPresent)) {
            errors.push('isPresent is invalid')
        }
    } else {
        errors.push('isPresent is missing')
    }

    if (checkInDate !== undefined) {
        const date = new Date(checkInDate);
        if (isNaN(date.getTime())) {
            errors.push('checkInDate is invalid');
        } else {
            const today = new Date();
            if (date > today) {
                errors.push('checkInDate cannot be in the future');
            }
        }
    } else {
        errors.push('checkInDate is missing')
    }
    return errors
}

module.exports = (app) => {
    app.get('/api/attendance', readAttendances)
    app.get('/api/attendance/:attendanceId', readAttendanceById)
    app.post('/api/attendance', createAttendance)
    app.put('/api/attendance/:attendanceId', updateAttendanceById)
    app.get('/api/attendance/student/:studentId', attendanceListById)
}
