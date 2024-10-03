const { getUserProfile } = require('../utilityclient.js')

function roomPageUi(req, res) {
    res.render('pages/room/roomlist.ejs', {
        user: getUserProfile(req.session)
    });
}

function addRoomUi(req, res) {
    res.render('pages/room/roomform.ejs', {
        roomId: '',
        user: getUserProfile(req.session)

    });
}

function editRoomUi(req, res) {
    const roomId = req.params.roomId;
    res.render('pages/room/roomform.ejs', {
        roomId: roomId,
        user: getUserProfile(req.session)

    });
}

module.exports = (app) => {
    app.get('/room', roomPageUi)
    app.get('/room/add', addRoomUi)
    app.get('/room/:roomId', editRoomUi)
}
