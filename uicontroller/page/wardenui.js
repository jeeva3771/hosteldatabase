const { getUserProfile } = require('../../utilityclient/query')
const { getAppUrl } = require('../../utilityclient/url');

function wardenPageUi(req, res) {
    if (!req.session || !req.session.warden || req.session.warden.superAdmin !== 1) {
        res.status(403).redirect('/warden/error')
    } else {
        res.render('pages/warden/wardenlist.ejs', {
            appURL: getAppUrl(),
            user: getUserProfile(req.session),
            breadCrumbs: [
                {name:'Home', link:'/home'},
                {name:'Warden', link:'/warden'},
            ]
        });
    }
}

function addWardenUi(req, res) {
    res.render('pages/warden/wardenform.ejs', {
        appURL: getAppUrl(),
        wardenId: '',
        user: getUserProfile(req.session),
        breadCrumbs: [
            {name:'Home', link:'/home'},
            {name:'Warden', link:'/warden'},
            {name:'Add', link:'/warden/add'}
        ]
    });
}

function editWardenUi(req, res) {
    const wardenId = req.params.wardenId;
    res.render('pages/warden/wardenform.ejs', {
        appURL: getAppUrl(),
        wardenId: wardenId,
        user: getUserProfile(req.session),
        breadCrumbs: [
            {name:'Home', link:'/home'},
            {name:'Warden', link:'/warden'},
            {name:'Edit', link:'/warden/add'}
        ]
    });
}

function errorUi(req, res) {
    res.render('pages/error.ejs', {
        user: getUserProfile(req.session)
    })
}

function resetPasswordUi(req, res) {
    res.render('pages/resetpassword.ejs')
}

function wardenProfileUi(req, res) {
    // const wardenId = req.params.wardenId;
    res.render('pages/warden/wardenprofile.ejs',{
        appURL: getAppUrl(),
        wardenId: 105,
        user: getUserProfile(req.session),
        breadCrumbs : [ 
            {name:'Home', link:'/home'},
            {name:'User', link:''},
            {name:'Profile', link:'/warden/profile'}
        ]
    })
}

module.exports = (app) => {
    app.get('/warden/profile', wardenProfileUi)
    app.get('/warden/resetpassword', resetPasswordUi)
    app.get('/warden', wardenPageUi)
    app.get('/warden/add', addWardenUi)
    app.get('/warden/:wardenId', editWardenUi)
    app.get('/warden/error', errorUi)
}


