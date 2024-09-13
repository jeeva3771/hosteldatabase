function loadBlockFloorPage(req, res) {
    res.render('pages/blockfloor/blockfloorlist.ejs')
}

function loadAddBlockFloor(req, res) {
    res.render('pages/blockfloor/blockfloorform.ejs', { blockFloorId: '' })
}

function loadEditBlockFloor(req, res) {
    const blockFloorId = req.params.blockFloorId
    res.render('pages/blockfloor/blockfloorform.ejs', { blockFloorId: blockFloorId })
}

module.exports = (app) => {
    app.get('/blockfloor', loadBlockFloorPage)
    app.get('/blockfloor/add', loadAddBlockFloor)
    app.get('/blockfloor/:blockFloorId', loadEditBlockFloor)
}