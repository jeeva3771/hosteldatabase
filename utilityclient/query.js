const bcrypt = require('bcrypt');

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
        name: `${session.warden.firstName[0].toUpperCase()}${session.warden.firstName.slice(1)}${session.warden.lastName}`,
        professional: `${session.warden.superAdmin === 1 ? 'Admin' : 'Warden'}`
    }
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

function hashPassword(password) {
    return bcrypt.hash(password, parseInt(process.env.HASH_SALTROUNDS))
}

function isPasswordValid(enteredPassword, storedHashedPassword) {
    return bcrypt.compare(enteredPassword, storedHashedPassword)
}

module.exports = {
    mysqlQuery,
    getUserProfile,
    deleteFile,
    hashPassword,
    isPasswordValid
}



