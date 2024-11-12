const { getUserProfile, getAppUrl } = require('../../utilityclient/query')
module.exports = (app) => {
    app.get('/login', (req, res) => {
        if (req.session.isLogged === true) {
            res.render('pages/home', {
                appURL: getAppUrl(),
                user: getUserProfile(req.session),
                breadsCrumb: [{ name: 'Home', link: '/home' }]
            })
        } else {
            res.render('pages/login', {
                appURL: getAppUrl()
            })
        }
    });

    app.get('/api/logout', (req, res) => {
        res.render('pages/login', {
            appURL: getAppUrl()
        })
    })

    app.get('/home', (req, res) => {
        if (req.session.isLogged === true) {
            res.render('pages/home', {
                appURL: getAppUrl(),
                user: getUserProfile(req.session),
                breadsCrumb: [{ name: 'Home', link: '/home' }]
            })
        }
        else {
            res.redirect(`${getAppUrl()}/login`)
        }
    })
}
