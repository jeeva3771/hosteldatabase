const { getUserProfile } = require('../utilityclient.js')

function blockFloorPageUi(req, res) {
    res.render('pages/blockfloor/blockfloorlist.ejs', {
        user: getUserProfile(req.session)
    });
}

function addBlockFloorUi(req, res) {
    res.render('pages/blockfloor/blockfloorform.ejs', {
        blockFloorId: '',
        user: getUserProfile(req.session)
    });
}

function editBlockFloorUi(req, res) {
    const blockFloorId = req.params.blockFloorId;
    res.render('pages/blockfloor/blockfloorform.ejs', {
        blockFloorId: blockFloorId,
        user: getUserProfile(req.session)
    });
}

module.exports = (app) => {
    app.get('/blockfloor', blockFloorPageUi)
    app.get('/blockfloor/add', addBlockFloorUi)
    app.get('/blockfloor/:blockFloorId', editBlockFloorUi)
}
