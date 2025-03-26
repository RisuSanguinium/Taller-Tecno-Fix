const express = require('express');
const session = require('express-session');
const path = require('path');
const app = express();

// Configuración de sesiones (DEBE ir antes de las rutas)
app.use(session({
    secret: 'tu_secreto_super_seguro',
    resave: false,
    saveUninitialized: true,
    cookie: { 
        secure: false, // Cambiar a true en producción con HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 1 día
    }
}));

// Middleware para hacer user disponible en todas las vistas
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

// Configuración de Express
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false })); // Corregido "extends" por "extended"
app.use(express.json());
app.set('views', path.join(__dirname, 'views'));

// Rutas
app.use('/', require('./routers'));

app.listen(5000, () => {
    console.log("Servidor Local http://localhost:5000");
});