const { mysqlQuery } = require('../utilityclient/query')

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

 async function readRoomStudents (req, res) {
    const mysqlClient = req.app.mysqlClient;
    const { roomId } = req.params;
    const { checkIn } = req.query; 

    try {
        const studentsWithAttendance = await mysqlQuery(
            /*sql*/ `
            SELECT s.studentId, s.name, a.isPresent, a.checkInDate
            FROM student AS s
            LEFT JOIN attendance AS a ON s.studentId = a.studentId AND a.roomId = ? AND a.checkInDate = ?
            WHERE s.roomId = ?`,
            [roomId, checkIn, roomId],
            mysqlClient
        );

        if (studentsWithAttendance.length === 0) {
            return res.status(404).send('No students found for the specified room.');
        }

        res.status(200).send(studentsWithAttendance);
    } catch (error) {
        res.status(500).send('Error fetching student and attendance data: ' + error.message);
    }
};

async function createAttendance(req, res) {
        const mysqlClient = req.app.mysqlClient;
        const { blockId, blockFloorId, roomId } = req.params;
        const { checkInDate, isPresent } = req.body;
        const wardenId = req.session.data.wardenId;

    
        try {
            const errors = await validateInsertItems(req.params, req.body, mysqlClient);
            if (errors.length > 0) {
                return res.status(400).send(errors); 
            }
            
            const students = await mysqlQuery(/*sql*/`SELECT * FROM student WHERE roomId = ?`,
                [roomId],
                mysqlClient
            );

            if (students.length === 0) {
                return res.status(404).send('No students found for the specified room.');
            }
    
            const attendancePromises = students.map((student) => {
                console.log(student)
                return mysqlQuery(
                    /*sql*/ `
                    INSERT INTO attendance (studentId, roomId, blockId, blockFloorId, checkInDate, isPresent, wardenId)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE
                        checkInDate = VALUES(checkInDate),
                        isPresent = VALUES(isPresent),
                        wardenId = VALUES(wardenId)
                    `,
                    [student.studentId, roomId, blockId, blockFloorId, checkInDate, isPresent, wardenId],
                    mysqlClient
                );
            });
    
            await Promise.all(attendancePromises);
    
            res.status(201).send('Attendance successfully recorded for all students in the room.');
        } catch (error) {
            res.status(500).send(error.message);
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

        const attendanceList = await mysqlQuery(/*sql*/`SELECT * FROM attendance WHERE checkInDate >= ? AND checkInDate <= ? AND studentId = ? `,
            [startDate, endDate, studentId],
            mysqlClient
        )
        res.status(200).send(attendanceList)
    } catch (error) {
        res.status(500).send(error.message)
    }
}

async function validateInsertItems(params, body, mysqlClient) {
    const {
        roomId,
        blockFloorId,
        blockId
    } = params

    const {
        checkInDate,
        isPresent
    } = body

    const errors = []

    if (roomId !== undefined) {
        if (isNaN(roomId) || roomId <= 0) {
            errors.push('roomId is invalid')
        }
    } else {
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

    const isValidateEntry = await mysqlQuery(/*sql*/ `SELECT studentId FROM student WHERE blockId = ? AND blockFloorId = ? AND  roomId = ?`,
        [blockId, blockFloorId, roomId],
        mysqlClient
    );
    if (isValidateEntry.length === 0) {
        errors.push('RoomId or BlockFloorId or BlockId is not valid');
    }
    return errors
}

module.exports = (app) => {
    app.get('/api/attendance', readAttendances)
    app.get('/api/attendance/:attendanceId', readAttendanceById)
    app.get('/api/attendance/student/:roomId', readRoomStudents)
    app.post('/api/attendance/:blockId/:blockFloorId/:roomId', createAttendance)
    app.get('/api/attendance/student/:studentId', attendanceListById)
}
