const { getUserProfile } = require('../utilityclient.js')

function wardenPageUi(req, res) {
    if (!req.session || !req.session.data || req.session.data.superAdmin !== 1) {
        res.status(403).redirect('/error')
    } else {
        res.render('pages/warden/wardenlist.ejs', {
            user: getUserProfile(req.session)
        });
    }
}

function addWardenUi(req, res) {
    res.render('pages/warden/wardenform.ejs', {
        wardenId: '',
        user: getUserProfile(req.session)
    });
}

function editWardenUi(req, res) {
    const wardenId = req.params.wardenId;
    res.render('pages/warden/wardenform.ejs', {
        wardenId: wardenId,
        user: getUserProfile(req.session)
    });
}

function errorUi(req, res) {
    res.render('pages/error.ejs', {
        user: getUserProfile(req.session)
    })
}

module.exports = (app) => {
    app.get('/warden', wardenPageUi)
    app.get('/warden/add', addWardenUi)
    app.get('/warden/:wardenId', editWardenUi)
    app.get('/error', errorUi)
}
