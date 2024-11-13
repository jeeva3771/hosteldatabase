const { getUserProfile, getAppUrl } = require('../../utilityclient/query')
module.exports = (app) => {

    app.get('/login', (req, res) => {
        if (req.session.isLogged === true) {
            res.status(200).redirect('pages/home', {
                appURL: getAppUrl(),
                user: getUserProfile(req.session),
                breadsCrumb: [{ name: 'Home', link: '/home' }]
            })
        } else {
            res.status(200).render('pages/login', {
                appURL: getAppUrl()
            })
        }
    });

    app.get('/api/logout', (req, res) => {
        res.status(200).render('pages/login', {
            appURL: getAppUrl()
        })
    })

    app.get('/home', (req, res) => {
        if (req.session.isLogged === true) {
            res.status(200).render('pages/home', {
                appURL: getAppUrl(),
                user: getUserProfile(req.session),
                breadsCrumb: [{ name: 'Home', link: '/home' }]
            })
        }
        else {
            res.status(200).redirect(`${getAppUrl()}login`)
        }
    })
}

///////////////////


app.get(getAppUrl(), (req, res) => {
    if (req.session.isLogged === true) {
        res.status(302).redirect(`${getAppUrl()}home`)
    } else {
        res.status(200).render('pages/login', {
            appURL: getAppUrl()
        })
    }
})