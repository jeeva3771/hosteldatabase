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
        name: `${session.data.firstName.charAt(0).toUpperCase()}${session.data.firstName.slice(1)}${session.data.lastName}`
    }
}

module.exports = {
    mysqlQuery,
    getUserProfile
}



