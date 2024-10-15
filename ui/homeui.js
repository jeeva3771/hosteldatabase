const { getUserProfile } = require('../utilityclient.js')
module.exports = (app) => {
    app.get('/login', (req, res) => {
        res.render('pages/login')
    });

    app.get('/home', (req, res) => {
        if (req.session.isLogged === true) {
            res.render('pages/home', {
                user: getUserProfile(req.session),
                bred: [{ name: 'Home', link: '/home' }]
            })
        }
        else {
            res.redirect('http://localhost:1000/login')
        }
    })
}
