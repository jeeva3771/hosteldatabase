const { getUserProfile } = require('../../utilityclient/query')
const { getAppUrl } = require('../../utilityclient/url');

function wardenPageUi(req, res) {
    const avatarWardenId = req.session.warden.wardenId;
    if (!req.session || !req.session.warden || req.session.warden.superAdmin !== 1) {
        return res.status(403).redirect('/error')
    } else {
        res.render('pages/warden/wardenlist.ejs', {
            appURL: getAppUrl(),
            avatarWardenId: avatarWardenId,
            user: getUserProfile(req.session),
            breadCrumbs: [
                {name:'Home', link:getAppUrl('home')},
                {name:'Warden', link:getAppUrl('warden')},
            ]
        });
    }
}

function addWardenUi(req, res) {
    const avatarWardenId = req.session.warden.wardenId;
    res.render('pages/warden/wardenform.ejs', {
        appURL: getAppUrl(),
        avatarWardenId: avatarWardenId,
        wardenId: '',
        user: getUserProfile(req.session),
        breadCrumbs: [
            {name:'Home', link:getAppUrl('home')},
            {name:'Warden', link:getAppUrl('warden')},
            {name:'Add', link:getAppUrl('warden/add')}
        ]
    });
}

function editWardenUi(req, res) {
    const avatarWardenId = req.session.warden.wardenId;
    const wardenId = req.params.wardenId;
    res.render('pages/warden/wardenform.ejs', {
        appURL: getAppUrl(),
        wardenId: wardenId,
        avatarWardenId: avatarWardenId,
        user: getUserProfile(req.session),
        breadCrumbs: [
            {name:'Home', link:getAppUrl('home')},
            {name:'Warden', link:getAppUrl('warden')},
            {name:'Edit', link:getAppUrl('warden/add')}
        ]
    });
}

function resetPasswordUi(req, res) {
    res.render('pages/resetpassword.ejs', {
        appURL: getAppUrl()
    })
}

function wardenDetailsUi(req, res) {
    const avatarWardenId = req.session.warden.wardenId;
    res.render('pages/warden/wardendetails.ejs',{
        appURL: getAppUrl(),
        avatarWardenId: avatarWardenId,
        user: getUserProfile(req.session),
        breadCrumbs : [ 
            {name:'Home', link:getAppUrl('home')},
            {name:'User', link:''},
            {name:'UserDetails', link:getAppUrl('warden/details')}
        ]
    })
}

module.exports = (app) => {
    app.get('/warden/details', wardenDetailsUi)
    app.get('/warden/resetpassword', resetPasswordUi)
    app.get('/warden', wardenPageUi)
    app.get('/warden/add', addWardenUi)
    app.get('/warden/:wardenId', editWardenUi)
}
