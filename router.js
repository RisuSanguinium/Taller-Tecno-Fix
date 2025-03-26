const express = require('express');
const router = express.Router();

// Ruta principal
router.get('/', (req, res) => {
    res.render('home/index', { 
        title: 'Tecno-Fix',
        message: 'Bienvenido a Tecno-Fix',
        currentPage: 'home'
    });
});

// Ruta de registro
router.get('/registro', (req, res) => {
    res.render('auth/registro', {
        title: 'Registro - Tecno-Fix',
        currentPage: 'registro'
    });
});

// Ruta de login
router.get('/login', (req, res) => {
    res.render('auth/login', {
        title: 'Iniciar sesión - Tecno-Fix',
        currentPage: 'login'
    });
});

module.exports = router;