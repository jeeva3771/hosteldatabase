function wardenPageUi(req, res) {
    if (req.session.isLogged) {
    res.render('pages/warden/wardenlist.ejs');
    } else {
        res.status(401).redirect('http://localhost:1000/login');
    }
}

function addWardenUi(req, res) {
    if (req.session.isLogged) {
    res.render('pages/warden/wardenform.ejs', { wardenId: '' });
    } else {
        res.status(401).redirect('http://localhost:1000/login');
    }
}

function editWardenUi(req, res) {
    const wardenId = req.params.wardenId;

    if (req.session.isLogged) {
    res.render('pages/warden/wardenform.ejs', { wardenId: wardenId });
    } else {
        res.status(401).redirect('http://localhost:1000/login');
    }
}

module.exports = (app) => {
    app.get('/warden', wardenPageUi)
    app.get('/warden/add', addWardenUi)
    app.get('/warden/:wardenId', editWardenUi)
}