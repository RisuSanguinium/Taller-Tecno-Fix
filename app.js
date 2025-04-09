const express = require('express');
const session = require('express-session');
const path = require('path');
const app = express();

app.use(session({
    secret: '12345',
    resave: true,
    saveUninitialized: false,
    cookie: { 
        secure: false,
        maxAge: 24 * 60 * 60 * 1000, // 24 horas
        httpOnly: true
    },
    rolling: true
}));


app.use((req, res, next) => {

    if (req.session.user) {
        res.locals.user = {
            id: req.session.user.id,
            id_rol: req.session.user.id_rol,
            nombre: req.session.user.nombre,
            apellido: req.session.user.apellido,
            rol: req.session.user.rol,
            id_empleado: req.session.user.id_empleado || null
        };
    } else {
        res.locals.user = null;
    }
    res.locals.query = req.query;
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

//Sala 3