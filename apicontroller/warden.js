function readWarden(req, res) {
    const mysqlClient = req.app.mysqlClient
    try {
        mysqlClient.query('select * from warden where deletedAt is null', (err, wardens) => {
            if (err) {
                res.status(500).send(err.sqlMessage)
            } else {
                res.status(200).send(wardens)
            }
        })
    } catch (error){
        res.status(500).send(error)
    }
}

function readOneWarden(req, res) {
    const wardenId = req.params.wardenId
    const mysqlClient = req.app.mysqlClient
    try {
        mysqlClient.query('select * from warden where wardenId = ?', [wardenId], (err, warden) => {
            if (err) {
                res.status(500).send(err.sqlMessage)
            } else {
                res.status(200).send(warden[0])
            }
        })
    } catch (error){
        res.status(500).send(error)
    }
}

function createWarden(req, res) {
    const { name,
            dob,
            username,
            password,
            createdBy = 6
        } = req.body

    if (name === '' || dob === '' || username === '' || password === '') {
        res.status(400).send(err.sqlMessage)
    }

    const mysqlClient = req.app.mysqlClient

    try {
        mysqlClient.query('insert into warden (name,dob,username,password,createdBy) values(?,?,?,?,?)', [name, dob, username, password, createdBy], (err, result) => {
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

function updateWarden(req, res) {
    const wardenId = req.params.wardenId;

    const { name = null,
            dob = null,
            username = null,
            password = null,
            updatedBy = null
        } = req.body;

    const values = []
    const updates = []

    if (name) {
        values.push(name)
        updates.push(' name = ?')
    }

    if (dob) {
        values.push(dob)
        updates.push(' dob = ?')
    }

    if (username) {
        values.push(username)
        updates.push(' username = ?')
    }

    if (password) {
        values.push(password)
        updates.push(' password = ?')
    }

    if (updatedBy) {
        values.push(updatedBy)
        updates.push(' updatedBy = ?')
    }

    values.push(wardenId)
    const mysqlClient = req.app.mysqlClient

    try {
        mysqlClient.query('update warden set ' + updates.join(',') + ' where wardenId = ?', values, (err, result) => {
            if (err) {
                return res.status(409).send(err.sqlMessage)
            } else {
                mysqlClient.query('select * from warden where wardenId = ?', [wardenId], (err2, result2) => {
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

function deleteWarden(req, res) {
    const wardenId = req.params.wardenId;
    const mysqlClient = req.app.mysqlClient;

    try {
        mysqlClient.query('select * from warden where wardenId = ?', [wardenId], (err, result) => {
            if (err) {
                return res.status(400).send(err.sqlMessage)
            } else {
                mysqlClient.query('update warden set deletedAt = now() where wardenId = ?', [wardenId], (err2, result2) => {
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
    app.get('/api/warden', readWarden)
    app.get('/api/warden/:wardenId', readOneWarden)
    app.post('/api/warden', createWarden)
    app.put('/api/warden/:wardenId', updateWarden)
    app.delete('/api/warden/:wardenId', deleteWarden)
}
