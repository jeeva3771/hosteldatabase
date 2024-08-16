function readAttendance(req, res) {
    const mysqlClient = req.app.mysqlClient
    try {
        mysqlClient.query('select * from attendance', (err, attendances) => {
            if (err) {
                res.status(500).send(err.sqlMessage)
            } else {
                res.status(200).send(attendances)
            }
        })
    } catch (error) {
        res.status(500).send(error)
    }
}

function readOneAttendance(req, res) {
    const mysqlClient = req.app.mysqlClient;
    const attendanceId = req.params.attendanceId;
    try {
        mysqlClient.query('select * from attendance where attendanceId = ?', [attendanceId], (err, attendance) => {
            if (err) {
                res.status(500).send(err.sqlMessage)
            } else {
                res.status(200).send(attendance[0])
            }
        })
    } catch (error) {
        res.status(500).send(error)
    }
}

function createAttendance(req, res) {
    const { studentId,
            roomId,
            blockFloorId,
            blockId,
            date,
            isPresent,
            wardenId
        } = req.body

    if (studentId === '' || roomId === '' || blockFloorId === '' || blockId === '' || date === '' || isPresent === '' || wardenId === '' ) {
        res.status(400).send(err.sqlMessage)
    }

    const mysqlClient = req.app.mysqlClient

    try {
        mysqlClient.query('insert into attendance(studentId,roomId,blockFloorId,blockId,date,ispresent,wardenId) values(?,?,?,?,?,?,?)', [studentId,roomId,blockFloorId,blockId,date,isPresent,wardenId], (err, result) => {
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



module.exports = (app) => {
    app.get('/api/attendance', readAttendance)
    app.get('/api/attendance/:attendanceId', readOneAttendance)
    app.post('/api/attendance', createAttendance)

}
