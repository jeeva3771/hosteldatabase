function loadBlockPage(req, res) {
    res.render('pages/block/blocklist.ejs')
}

function loadAddBlock(req, res) {
    res.render('pages/course/courseform.ejs', { blockId: '' })
}

function loadEditBlock(req, res) {
    const blockId = req.params.blockId
    res.render('pages/course/courseform.ejs', { blockId: blockId })
}

module.exports = (app) => {
    app.get('/block', loadBlockPage)
    app.get('/block/add', loadAddBlock)
    app.get('/block/:blockId', loadEditBlock)
}