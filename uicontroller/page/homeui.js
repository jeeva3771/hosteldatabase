const { getUserProfile } = require('../../utilityclient/query');
const { getAppUrl } = require('../../utilityclient/url');

module.exports = (app) => {
    app.get('/login', (req, res) => {
        if (req.session.isLogged === true) {
            res.status(302).redirect(getAppUrl('home'))
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

    app.get(['/home','/'], (req, res) => {
        const avatarWardenId = req.session.warden.wardenId;
        if (req.session.isLogged === true) {
            res.render('pages/home', {
                avatarWardenId: avatarWardenId,
                appURL: getAppUrl(),
                user: getUserProfile(req.session),
                breadCrumbs: [
                    { name: 'Home', link: '/home' },
                    { name: 'Dashboard', link: '/home' }
                ]
            })
        }
        else {
            res.status(302).redirect(getAppUrl('login'))
        }
    })
}
