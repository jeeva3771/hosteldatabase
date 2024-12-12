const { getUserProfile } = require('../../utilityclient/query');
const { getAppUrl } = require('../../utilityclient/url');


function roomPageUi(req, res) {
    const avatarWardenId = req.session.warden.wardenId;
    res.render('pages/room/roomlist.ejs', {
        appURL: getAppUrl(),
        avatarWardenId: avatarWardenId,
        user: getUserProfile(req.session),
        breadCrumbs : [ 
            {name:'Home', link:getAppUrl('home')},
            {name:'Room', link:getAppUrl('room')}
        ]
    });
}

function addRoomUi(req, res) {
    const avatarWardenId = req.session.warden.wardenId;
    res.render('pages/room/roomform.ejs', {
        appURL: getAppUrl(),
        avatarWardenId: avatarWardenId,
        roomId: '',
        user: getUserProfile(req.session),
        breadCrumbs : [ 
            {name:'Home', link:getAppUrl('home')},
            {name:'Room', link:getAppUrl('room')},
            {name:'Add', link:getAppUrl('room/add')}
        ]

    });
}

function editRoomUi(req, res) {
    const avatarWardenId = req.session.warden.wardenId;
    const roomId = req.params.roomId;
    res.render('pages/room/roomform.ejs', {
        appURL: getAppUrl(),
        avatarWardenId: avatarWardenId,
        roomId: roomId,
        user: getUserProfile(req.session),
        breadCrumbs : [ 
            {name:'Home', link:getAppUrl('home')},
            {name:'Room', link:getAppUrl('room')},
            {name:'Edit', link:getAppUrl('room/add')}
        ]
    });
}

module.exports = (app) => {
    app.get('/room', roomPageUi)
    app.get('/room/add', addRoomUi)
    app.get('/room/:roomId', editRoomUi)
}
