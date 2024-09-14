function loadWardenPage(req, res) {
    res.render('pages/warden/wardenlist.ejs')
}

function loadAddWarden(req, res) {
    res.render('pages/warden/wardenform.ejs', { wardenId: '' })
}

function loadEditWarden(req, res) {
    const wardenId = req.params.wardenId
    res.render('pages/warden/wardenform.ejs', { wardenId: wardenId })
}

module.exports = (app) => {
    app.get('/warden', loadWardenPage)
    app.get('/warden/add', loadAddWarden)
    app.get('/warden/:wardenId', loadEditWarden)
}