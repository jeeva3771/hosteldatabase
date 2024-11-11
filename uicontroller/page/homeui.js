const { getUserProfile } = require('../../utilityclient/query')
module.exports = (app) => {
    app.get('/login', (req, res) => {
        res.render('pages/login', {            
            appURL: process.env.APP_URL
        })
    });

    app.get('/home', (req, res) => {
        if (req.session.isLogged === true) {
            res.render('pages/home', {
                appURL: process.env.APP_URL,
                user: getUserProfile(req.session),
                breadCrumb: [{ name: 'Home', link: '/home' }]
            })
        }
        else {
            res.redirect('http://localhost:1005/login')
        }
    })
}
