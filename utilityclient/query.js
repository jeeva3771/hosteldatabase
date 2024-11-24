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


module.exports = {
    mysqlQuery,
    getUserProfile,
    handleFileUpload,
    deleteFile
}



