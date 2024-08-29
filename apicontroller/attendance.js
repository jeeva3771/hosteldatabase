const { mysqlQuery, insertedBy } = require('../utilityclient.js')
const ALLOWED_UPDATE_KEYS = [
    "studentId",
    "roomId",
    "blockFloorId",
    "blockId",
    "date",
    "isPresent"
]
async function readAttendances(req, res) {
    const mysqlClient = req.app.mysqlClient
    try {
        const attendances = await mysqlQuery(/*sql*/`SELECT * FROM attendance`, [], mysqlClient)
        res.status(200).send(attendances)
    } catch (error) {
        res.status(500).send(error.message)
    }
}

async function readAttendance(req, res) {
    const mysqlClient = req.app.mysqlClient;
    const attendanceId = req.params.attendanceId;
    try {
        const attendance = await mysqlQuery(/*sql*/`select * from attendance where attendanceId = ?`, [attendanceId], mysqlClient)
        if (attendance.length === 0) {
            return res.status(404).send("attendanceId not valid");
        }
        res.status(200).send(attendance[0])
    } catch (error) {
        res.status(500).send(error.message)
    }
}

async function createAttendance(req, res) {
    const mysqlClient = req.app.mysqlClient
    const {
        studentId,
        roomId,
        blockFloorId,
        blockId,
        date = new Date().toISOString().slice(0, 10),
        isPresent,
        wardenId = `${insertedBy}`
    } = req.body

    const isValidInsert = validateInsertItems(req.body);
    if (isValidInsert.length > 0) {
        return res.status(400).send(isValidInsert);
    }

    try {
        const dayAttendance = await mysqlQuery(/*sql*/`INSERT INTO 
            attendance(studentId,roomId,blockFloorId,blockId,date,isPresent,wardenId)
            VALUES(?,?,?,?,?,?,?)`,
            [studentId, roomId, blockFloorId, blockId, date, isPresent, wardenId],
            mysqlClient
        )
        if (dayAttendance.affectedRows === 0) {
            res.status(400).send("no insert was made")
        } else {
            res.status(201).send('insert successfull')
        }
    } catch (error) {
        res.status(500).send(error.message)
    }
}

async function updateAttendance(req, res) {
    const mysqlClient = req.app.mysqlClient
    const attendanceId = req.params.attendanceId;

    const values = []
    const updates = []

    ALLOWED_UPDATE_KEYS.forEach(key => {
        const keyValue = req.body[key]
        if (keyValue !== undefined) {
            values.push(keyValue)
            updates.push(` ${key} = ?`)
        }
    })

    updates.push(`updatedBy = ${insertedBy}`)
    values.push(attendanceId)

    try {
        const attendance = await mysqlQuery(/*sql*/`SELECT * FROM attendance WHERE attendanceId = ?`,
            [attendanceId],
            mysqlClient
        )
        if (attendance.length === 0) {
            return res.status(404).send('attendanceId not found')
        }

        const isUpdate = await mysqlQuery(/*sql*/`UPDATE attendance SET ${updates.join(', ')} WHERE attendanceId = ?`,
            values, mysqlClient)
        if (isUpdate.affectedRows === 0) {
            res.status(204).send("attendanceId not found or no changes made")
        }

        const getUpdatedAttendance = await mysqlQuery(/*sql*/`SELECT * FROM attendance WHERE attendanceId = ?`,
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

async function attendanceList(req, res) {
    const mysqlClient = req.app.mysqlClient;
    const studentId = req.params.studentId;

    try {
        const student = await mysqlQuery(/*sql*/`SELECT * FROM student WHERE studentId = ?`,
            [studentId],
            mysqlClient
        )
        if (student.length === 0) {
            return res.status(404).send('studentId is invalid')
        }

        const studentCount = await mysqlQuery(/*sql*/`SELECT * FROM attendance WHERE studentId = ? AND date >= ?  AND date <= ?`,
            [studentId, req.startOfTheMonth, req.endOfTheMonth], mysqlClient
        )
        return res.status(200).send(studentCount)
    } catch (error) {
        return res.status(500).send(error.message)
    }
}

function validateInsertItems(body) {
    const {
        studentId,
        roomId,
        blockFloorId,
        blockId,
        isPresent
    } = body

    const errors = []

    if (studentId !== undefined) {
        if (isNaN(studentId) || studentId <= 0) {
            errors.push('studentId is invalid')
        }
    } else {
        errors.push('studentId is missing')
    }

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

    // if (date !== undefined) {
    //     if (isNaN(Date.parse(date))) {
    //         errors.push('date is invalid')
    //     }
    // } else {
    //     errors.push('date is missing')
    // }

    if (isPresent !== undefined) {
        if (![0, 1].includes(isPresent)) {
            errors.push('isPresent is invalid')
        }
    } else {
        errors.push('isPresent is missing')
    }
    return errors
}

module.exports = (app) => {
    app.get('/api/attendance', readAttendances)
    app.get('/api/attendance/:attendanceId', readAttendance)
    app.post('/api/attendance', createAttendance)
    app.put('/api/attendance/:attendanceId', updateAttendance)
    app.get('/api/attendance/student/:studentId', attendanceList)
}
