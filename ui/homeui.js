module.exports = (app) => {
    app.get('/login', (req, res) => {
        res.render('pages/login')
    });

    app.get('/home', (req, res) => {
        if (req.session.isLogged === true) {
            res.render('pages/home', { name: req.session.data })
        } else {
            res.redirect('http://localhost:1000/login')
        }
    })
}
