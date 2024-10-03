const { getUserProfile } = require('../utilityclient.js')

function blockPageUi(req, res) {
    res.render('pages/block/blocklist.ejs', {
        user: getUserProfile(req.session)
    });
}

function addBlockUi(req, res) {
    res.render('pages/block/blockform.ejs', {
        blockId: '',
        user: getUserProfile(req.session)
    });
}

function editBlockUi(req, res) {
    const blockId = req.params.blockId;
    res.render('pages/block/blockform.ejs', {
            blockId: blockId,
            user: getUserProfile(req.session)
        });
}

module.exports = (app) => {
    app.get('/block', blockPageUi)
    app.get('/block/add', addBlockUi)
    app.get('/block/:blockId', editBlockUi)
}
