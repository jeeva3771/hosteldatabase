module.exports = (app) => {
    app.get('/login', (req, res) => {
        res.render('pages/login')
    });

    app.get('/home', (req, res) => {
        if (req.session.isLogged) {
            res.render('pages/home', { name: req.session.data })
        } else {
            res.redirect('http://localhost:1000/login')
        }
    })

    app.get('/logout', (req, res) => {
        req.session.destroy ((err) => {
            if (err) throw err;
            res.redirect('http://localhost:1000/login')
        })
    })

    app.get('/signup', (req, res) => {
        res.render('pages/signup')
    })
    
}
