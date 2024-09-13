function loadRoomPage(req, res) {
    res.render('pages/room/roomlist.ejs')
}

function loadAddRoom(req, res) {
    res.render('pages/room/roomform.ejs', { roomId: '' })
}

function loadEditRoom(req, res) {
    const roomId = req.params.roomId
    res.render('pages/room/roomform.ejs', { roomId: roomId })
}

module.exports = (app) => {
    app.get('/room', loadRoomPage)
    app.get('/room/add', loadAddRoom)
    app.get('/room/:roomId', loadEditRoom)
}