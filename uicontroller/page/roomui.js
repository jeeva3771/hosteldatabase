const { getUserProfile } = require('../../utilityclient/query');
const { getAppUrl } = require('../../utilityclient/url');


function roomPageUi(req, res) {
    res.render('pages/room/roomlist.ejs', {
        appURL: getAppUrl(),
        user: getUserProfile(req.session),
        breadsCrumb : [ 
            {name:'Home', link:'/home'},
            {name:'Room', link:'/room'}
        ]
    });
}

function addRoomUi(req, res) {
    res.render('pages/room/roomform.ejs', {
        appURL: getAppUrl(),
        roomId: '',
        user: getUserProfile(req.session),
        breadsCrumb : [ 
            {name:'Home', link:'/home'},
            {name:'Room', link:'/room'},
            {name:'Add', link:'/room/add'}
        ]

    });
}

function editRoomUi(req, res) {
    const roomId = req.params.roomId;
    res.render('pages/room/roomform.ejs', {
        appURL: getAppUrl(),
        roomId: roomId,
        user: getUserProfile(req.session),
        breadsCrumb : [ 
            {name:'Home', link:'/home'},
            {name:'Room', link:'/room'},
            {name:'Edit', link:'/room/add'}
        ]

    });
}

module.exports = (app) => {
    app.get('/room', roomPageUi)
    app.get('/room/add', addRoomUi)
    app.get('/room/:roomId', editRoomUi)
}
