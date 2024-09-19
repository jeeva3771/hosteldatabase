function blockFloorPageUi(req, res) {
    if (req.session.isLogged) {
        res.render('pages/blockfloor/blockfloorlist.ejs');
    } else {
        res.status(401).redirect('http://localhost:1000/login');
    }
}

function addBlockFloorUi(req, res) {
    if (req.session.isLogged) {
    res.render('pages/blockfloor/blockfloorform.ejs', { blockFloorId: '' });
    } else {
        res.status(401).redirect('http://localhost:1000/login');
    }
}

function editBlockFloorUi(req, res) {
    const blockFloorId = req.params.blockFloorId;

    if (req.session.isLogged) {
    res.render('pages/blockfloor/blockfloorform.ejs', { blockFloorId: blockFloorId });
    } else {
        res.status(401).redirect('http://localhost:1000/login');
    }
}

module.exports = (app) => {
    app.get('/blockfloor', blockFloorPageUi)
    app.get('/blockfloor/add', addBlockFloorUi)
    app.get('/blockfloor/:blockFloorId', editBlockFloorUi)
}
