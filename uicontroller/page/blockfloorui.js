const { getUserProfile } = require('../../utilityclient/query')

function blockFloorPageUi(req, res) {
    res.render('pages/blockfloor/blockfloorlist.ejs', {
        appURL: process.env.APP_URL,
        user: getUserProfile(req.session),
        breadCrumb: [
            {name:'Home', link:'/home'},
            {name:'Blockfloor', link:'/blockfloor'}
        ]
    });
}

function addBlockFloorUi(req, res) {
    res.render('pages/blockfloor/blockfloorform.ejs', {
        appURL: process.env.APP_URL,
        blockFloorId: '',
        user: getUserProfile(req.session),
        breadCrumb: [
            {name:'Home', link:'/home'},
            {name:'Blockfloor', link:'/blockfloor'},
            {name:'Add', link:'/blockfloor/add'}
        ]
    });
}

function editBlockFloorUi(req, res) {
    const blockFloorId = req.params.blockFloorId;
    res.render('pages/blockfloor/blockfloorform.ejs', {
        appURL: process.env.APP_URL,
        blockFloorId: blockFloorId,
        user: getUserProfile(req.session),
        breadCrumb: [
            {name:'Home', link:'/home'},
            {name:'Blockfloor', link:'/blockfloor'},
            {name:'Edit', link:'/blockfloor/add'}
        ]
    });
}

module.exports = (app) => {
    app.get('/blockfloor', blockFloorPageUi)
    app.get('/blockfloor/add', addBlockFloorUi)
    app.get('/blockfloor/:blockFloorId', editBlockFloorUi)
}
