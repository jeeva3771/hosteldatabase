function blockPageUi(req, res) {
    if (req.session.isLogged) {
        res.render('pages/block/blocklist.ejs');
    } else {
        res.status(401).redirect('http://localhost:1000/login');
    }
}

function addBlockUi(req, res) {
    if (req.session.isLogged) {
        res.render('pages/block/blockform.ejs', { blockId: '' });
    } else {
        res.status(401).redirect('http://localhost:1000/login');
    }
}

function editBlockUi(req, res) {
    const blockId = req.params.blockId;
    if (req.session.isLogged) {
        res.render('pages/block/blockform.ejs', { blockId: blockId });
    } else {
        res.status(401).redirect('http://localhost:1000/login');
    }
}

module.exports = (app) => {
    app.get('/block', blockPageUi)
    app.get('/block/add', addBlockUi)
    app.get('/block/:blockId', editBlockUi)
}
