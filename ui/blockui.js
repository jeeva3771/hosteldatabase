function blockPageUi(req, res) {
    res.render('pages/block/blocklist.ejs');
}

function addBlockUi(req, res) {
    res.render('pages/block/blockform.ejs', { blockId: '' });
}

function editBlockUi(req, res) {
    const blockId = req.params.blockId;
    res.render('pages/block/blockform.ejs', { blockId: blockId });
}

module.exports = (app) => {
    app.get('/block', blockPageUi)
    app.get('/block/add', addBlockUi)
    app.get('/block/:blockId', editBlockUi)
}
