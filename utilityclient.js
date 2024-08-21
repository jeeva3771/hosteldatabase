function mysqlQuery(sql, options, mysqlClient) {
    return new Promise((resolve, reject) => {
        try {
            mysqlClient.query(sql, options || [], (err, rooms) => {
                if (err) {
                    return reject(err.sqlMessage)
                } 
                resolve(rooms)    
            })
        } catch (error) {
            reject(error.message)
        }
    })
}


module.exports = {
    mysqlQuery,
    insertedBy: 8
}