<%- include('../../partials/header.ejs', { isMenuVisible : true, title: 'Coursepage', userName: userName}) %>

module.exports = (app) => {
    app.get('/login', (req, res) => {
        res.render('pages/login')
    });

    app.get('/home', (req, res) => {
        if (req.session.isLogged === true) {
            res.render('pages/home','pages/courseList', {
                userName: req.session.data
            })
        } else {
            res.redirect('http://localhost:1000/login')
        }
    })
}

............................
<script>
        var user = <%=userName.firstName%> <%=userName.lastName%>
      </script>