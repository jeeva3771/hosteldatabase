const { readAuthenticationName } = require('../utilityclient.js')
module.exports = (app) => {
    app.get('/login', (req, res) => {
        res.render('pages/login')
    });

    app.get('/home', (req, res) => {
        if (req.session.isLogged === true) {
            res.render('pages/home', {
                // userName: readAuthenticationName()
                userName: req.session.data
            })
        } else {                 
            res.redirect('http://localhost:1000/login')
        }
    })
}
// <!-- <p><%=userName.firstName%> <%=userName.lastName%></p>  -->
