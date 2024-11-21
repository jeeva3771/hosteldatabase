const { getUserProfile } = require('../../utilityclient/query');
const { getAppUrl } = require('../../utilityclient/url');

function blockFloorPageUi(req, res) {
    res.render('pages/blockfloor/blockfloorlist.ejs', {
        appURL: getAppUrl(),
        user: getUserProfile(req.session),
        breadCrumbs: [
            {name:'Home', link:'/home'},
            {name:'Blockfloor', link:'/blockfloor'}
        ]
    });
}

function addBlockFloorUi(req, res) {
    res.render('pages/blockfloor/blockfloorform.ejs', {
        appURL: getAppUrl(),
        blockFloorId: '',
        user: getUserProfile(req.session),
        breadCrumbs: [
            {name:'Home', link:'/home'},
            {name:'Blockfloor', link:'/blockfloor'},
            {name:'Add', link:'/blockfloor/add'}
        ]
    });
}

function editBlockFloorUi(req, res) {
    const blockFloorId = req.params.blockFloorId;
    res.render('pages/blockfloor/blockfloorform.ejs', {
        appURL: getAppUrl(),
        blockFloorId: blockFloorId,
        user: getUserProfile(req.session),
        breadCrumbs: [
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
