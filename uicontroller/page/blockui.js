const { getUserProfile } = require('../../utilityclient/query')
const { getAppUrl } = require('../../utilityclient/url');

function blockPageUi(req, res) {
    const avatarWardenId = req.session.warden.wardenId;
    res.render('pages/block/blocklist.ejs', {
        appURL: getAppUrl(),
        avatarWardenId: avatarWardenId,
        user: getUserProfile(req.session),
        breadCrumbs: [
            {name:'Home', link:'/home'},
            {name:'Block', link:'#tables-nav'},
            {name:'Block', link:'/block'}
        ]
    });
}

function addBlockUi(req, res) {
    const avatarWardenId = req.session.warden.wardenId;
    res.render('pages/block/blockform.ejs', {
        appURL: getAppUrl(),
        avatarWardenId: avatarWardenId,
        blockId: '',
        user: getUserProfile(req.session),
        breadCrumbs: [
            {name:'Home', link:'/home'},
            {name:'Block', link:'/block'},
            {name:'Add', link:'/block/add'}
        ]
    });
}

function editBlockUi(req, res) {
    const avatarWardenId = req.session.warden.wardenId;
    const blockId = req.params.blockId;
    res.render('pages/block/blockform.ejs', {
            appURL: getAppUrl(),
            avatarWardenId: avatarWardenId,
            blockId: blockId,
            user: getUserProfile(req.session),
            breadCrumbs: [
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
