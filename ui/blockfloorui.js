function blockFloorPageUi(req, res) {
    res.render('pages/blockfloor/blockfloorlist.ejs');
}

function addBlockFloorUi(req, res) {
    res.render('pages/blockfloor/blockfloorform.ejs', { blockFloorId: '' });
}

function editBlockFloorUi(req, res) {
    const blockFloorId = req.params.blockFloorId;
    res.render('pages/blockfloor/blockfloorform.ejs', { blockFloorId: blockFloorId });
}

module.exports = (app) => {
    app.get('/blockfloor', blockFloorPageUi)
    app.get('/blockfloor/add', addBlockFloorUi)
    app.get('/blockfloor/:blockFloorId', editBlockFloorUi)
}
