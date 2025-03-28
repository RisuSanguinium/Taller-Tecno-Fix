const express = require('express');
const session = require('express-session');
const path = require('path');
const app = express();


app.use(session({
    secret: '12345',
    resave: false,
    saveUninitialized: true,
    cookie: { 
        secure: false, 
        maxAge: 24 * 60 * 60 * 1000 
    }
}));

app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.set('views', path.join(__dirname, 'views'));

// Rutas
app.use('/', require('./routers'));

app.listen(5000, () => {
    console.log("Servidor Local http://localhost:5000");
});