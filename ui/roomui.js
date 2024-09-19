function roomPageUi(req, res) {
    if (req.session.isLogged) {
        res.render('pages/room/roomlist.ejs');
    } else {
        res.status(401).redirect('http://localhost:1000/login');
    }
}

function addRoomUi(req, res) {
    if (req.session.isLogged) {
    res.render('pages/room/roomform.ejs', { roomId: '' });
    } else {
        res.status(401).redirect('http://localhost:1000/login');
    }
}

function editRoomUi(req, res) {
    const roomId = req.params.roomId
    if (req.session.isLogged) {
    res.render('pages/room/roomform.ejs', { roomId: roomId });
    } else {
        res.status(401).redirect('http://localhost:1000/login');
    }
}

module.exports = (app) => {
    app.get('/room', roomPageUi)
    app.get('/room/add', addRoomUi)
    app.get('/room/:roomId', editRoomUi)
}