const { getUserProfile } = require('../../utilityclient/query')

function blockPageUi(req, res) {
    res.render('pages/block/blocklist.ejs', {
        appURL: process.env.APP_URL,
        user: getUserProfile(req.session),
        breadCrumb: [
            {name:'Home', link:'/home'},
            {name:'Block', link:'/block'}
        ]
    });
}

function addBlockUi(req, res) {
    res.render('pages/block/blockform.ejs', {
        appURL: process.env.APP_URL,
        blockId: '',
        user: getUserProfile(req.session),
        breadCrumb: [
            {name:'Home', link:'/home'},
            {name:'Block', link:'/block'},
            {name:'Add', link:'/block/add'}
        ]
    });
}

function editBlockUi(req, res) {
    const blockId = req.params.blockId;
    res.render('pages/block/blockform.ejs', {
            appURL: process.env.APP_URL,
            blockId: blockId,
            user: getUserProfile(req.session),
            breadCrumb: [
                {name:'Home', link:'/home'},
                {name:'Block', link:'/block'},
                {name:'Edit', link:'/block/add'}
            ]
        });
}

module.exports = (app) => {
    app.get('/block', blockPageUi)
    app.get('/block/add', addBlockUi)
    app.get('/block/:blockId', editBlockUi)
}
