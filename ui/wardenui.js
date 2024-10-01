function wardenPageUi(req, res) {
    res.render('pages/warden/wardenlist.ejs');
}

function addWardenUi(req, res) {
    res.render('pages/warden/wardenform.ejs', { wardenId: '' });
}

function editWardenUi(req, res) {
    const wardenId = req.params.wardenId;
    res.render('pages/warden/wardenform.ejs', { wardenId: wardenId });
}

function errorUi(req, res) {
    res.render('pages/error.ejs')
}

module.exports = (app) => {
    app.get('/warden', wardenPageUi)
    app.get('/warden/add', addWardenUi)
    app.get('/warden/:wardenId', editWardenUi)
    app.get('/error', errorUi)
}
