function readAuthenticationName(req, res) {
    var sessionData = req.session.data
    return sessionData
}

module.exports = (app) => {
    app.get('/api/authentication-name', (req, res) => {
        const sessionData = readAuthenticationName(req, res);
        res.status(200).send(sessionData);
    });
}

module.exports.mysqlQuery = mysqlQuery;
module.exports.readAuthenticationName = readAuthenticationName;
