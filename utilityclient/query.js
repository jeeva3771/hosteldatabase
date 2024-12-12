function mysqlQuery(sql, options, mysqlClient) {
    return new Promise((resolve, reject) => {
        try {
            mysqlClient.query(sql, options || [], (err, data) => {
                if (err) {
                    return reject(err.sqlMessage)
                }
                resolve(data)
            })
        } catch (error) {
            reject(error.message)
        }
    })
}

function getUserProfile(session) {
    return {
        name: `${session.warden.firstName.charAt(0).toUpperCase()}${session.warden.firstName.slice(1)}${session.warden.lastName}`,
        professional: `${session.warden.superAdmin === 1 ? 'Admin' : 'Warden'}`
    }
}

async function handleFileUpload(req, res, multerMiddleware, multer) {
    return new Promise((resolve, reject) => {
        multerMiddleware(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                return reject(err); 
            } else if (req.fileValidationError) {
                return reject(res.status(400).send(req.fileValidationError)); 
            }
            resolve();
        });
    });
}

// async function handleFileUpload(req, res, multerMiddleware, multer) {
//     multerMiddleware(req, res, (err) => {
//         if (err instanceof multer.MulterError) {
//             res.status(400).send(err.message);
//             return;
//         }
        
//         if (req.fileValidationError) {
//             res.status(400).send(req.fileValidationError);
//             return;
//         }
//         return;
//     });
// }

function deleteFile(uploadedFilePath, fs) {
    return new Promise((resolve, reject) => {
        console.log(`Does file exist? ${fs.existsSync(uploadedFilePath)}`);

        if (!fs.existsSync(uploadedFilePath)) {
            console.log(`File not found: ${uploadedFilePath}`);
            return resolve();
        }

        fs.unlink(uploadedFilePath, (err) => {
            if (err) {
                return reject(err);
            }
            resolve();
        });
    });
}

async function attendanceReport(req, res) {
    const mysqlClient = req.app.mysqlClient;
    const {
        month,
        year,
        studentName,
        registerNumber
    } = req.query;
    var errors = []
    let queryParameters = [month, year, studentName];

    if (isNaN(month)) {
        errors.push('month')
    }

    if (isNaN(year)) {
        errors.push('year')
    }

    if (studentName === "Select a Student") {
        errors.push('student')
    }

    if (errors.length > 0) {
        let errorMessage;

        if (errors.length === 1) {
            errorMessage = `Please select a ${errors[0]} before generating the report.`
        } else {
            errorMessage = `Please select a ${errors.join(", ")} before generating the report.`
        }

        return res.status(400).send(errorMessage)
    }

    try {
        let sqlQuery = /*sql*/`
        SELECT 
            DATE_FORMAT(a.checkInDate, "%Y-%m-%d") AS checkIn,
            a.isPresent
        FROM 
            attendance AS a
        INNER JOIN 
            student AS s ON s.studentId = a.studentId
        WHERE 
            MONTH(a.checkInDate) = ?
            AND YEAR(a.checkInDate) = ?
            AND s.name = ?`;
        
        if (registerNumber) {
            sqlQuery += ' AND s.registerNumber = ?'
            queryParameters.push(registerNumber)
        }
        
        const studentReport = await mysqlQuery(sqlQuery, queryParameters, mysqlClient)

        if (studentReport.length === 0) {
            return res.status(404).send('Student attendance report not found for the selected month and year.')
        }

        const formattedReport = studentReport.reduce((acc, { checkIn, isPresent }) => {
            acc[checkIn] = isPresent;
            return acc;
        }, {});

        return res.status(200).send(formattedReport);
    } catch (error) {
        req.log.error(error)
        res.status(500).send(error.message)
    }
}

module.exports = {
    mysqlQuery,
    getUserProfile,
    handleFileUpload,
    deleteFile,
    attendanceReport
}



