const { getUserProfile } = require('../utilityclient/query')

function roomPageUi(req, res) {
    res.render('pages/room/roomlist.ejs', {
        user: getUserProfile(req.session),
        breadcrumb : [ 
            {name:'Home', link:'/home'},
            {name:'Room', link:'/room'}
        ]
    });
}

function addRoomUi(req, res) {
    res.render('pages/room/roomform.ejs', {
        roomId: '',
        user: getUserProfile(req.session),
        breadcrumb : [ 
            {name:'Home', link:'/home'},
            {name:'Room', link:'/room'},
            {name:'Add', link:'/room/add'}
        ]

    });
}

function editRoomUi(req, res) {
    const roomId = req.params.roomId;
    res.render('pages/room/roomform.ejs', {
        roomId: roomId,
        user: getUserProfile(req.session),
        breadcrumb : [ 
            {name:'Home', link:'/home'},
            {name:'room', link:'/room'},
            {name:'Edit', link:'/room/add'}
        ]

    });
}

module.exports = (app) => {
    app.get('/room', roomPageUi)
    app.get('/room/add', addRoomUi)
    app.get('/room/:roomId', editRoomUi)
}
