const express = require('express');
const router = express.Router();

//El controlador de Las autetificaciones Login/Registro
const authController = require('../controllers/authController');

// Rutas públicas
router.get('/', (req, res) => {
    res.render('home/index', { 
        title: 'Tecno-Fix',
        message: 'Bienvenido a Tecno-Fix',
        currentPage: 'home'
    });
});

// Rutas de login y de logout
router.get('/login', authController.showLoginForm);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

// Ruta de registro
router.get('/registro', (req, res) => {
    res.render('auth/registro', {
        title: 'Registro - Tecno-Fix',
        currentPage: 'registro'
    });
});


module.exports = router;