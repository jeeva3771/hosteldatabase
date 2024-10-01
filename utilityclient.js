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

function readAuthenticationName(req, res) {
    console.log(req.session.data)
    var sessionData = req.session.data
    return sessionData
}

module.exports = {
    mysqlQuery,
    readAuthenticationName
}

// module.exports.mysqlQuery = mysqlQuery;
// module.exports.readAuthenticationName = readAuthenticationName;




