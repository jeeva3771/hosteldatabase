function wardenPageUi(req, res) {
    res.render('pages/warden/wardenlist.ejs');
}

function addWardenUi(req, res) {
    res.render('pages/warden/wardenform.ejs', { wardenId: '', isEdit: false});
}

function editWardenUi(req, res) {
    const wardenId = req.params.wardenId;
    res.render('pages/warden/wardenform.ejs', { wardenId: wardenId, isEdit: false});
}

module.exports = (app) => {
    app.get('/warden', wardenPageUi)
    app.get('/warden/add', addWardenUi)
    app.get('/warden/:wardenId', editWardenUi)
}
