function roomPageUi(req, res) {
    res.render('pages/room/roomlist.ejs');
}

function addRoomUi(req, res) {
    res.render('pages/room/roomform.ejs', { roomId: '' });
}

function editRoomUi(req, res) {
    const roomId = req.params.roomId;
    res.render('pages/room/roomform.ejs', { roomId: roomId });
}

module.exports = (app) => {
    app.get('/room', roomPageUi)
    app.get('/room/add', addRoomUi)
    app.get('/room/:roomId', editRoomUi)
}
