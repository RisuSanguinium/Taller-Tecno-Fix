const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const soporteController = require('../controllers/soporteController');
const empleadoController = require('../controllers/empleadoController');
const inventarioController = require('../controllers/inventarioController');

// Rutas públicas
router.get('/', (req, res) => {
    res.render('home/index', { 
        title: 'Tecno-Fix',
        message: 'Bienvenido a Tecno-Fix',
        currentPage: 'home'
    });
});

// Rutas de autenticación
router.get('/login', authController.showLoginForm);
router.post('/login', authController.login);
router.get('/registro', authController.showRegisterForm);
router.post('/registro', authController.register);
router.get('/logout', authController.logout);

// Rutas de soporte técnico
router.get('/solicitar-soporte', soporteController.mostrarFormulario);
router.post('/solicitar-soporte', soporteController.crearSolicitud);

// Rutas de gestión de empleados
router.get('/empleados', empleadoController.listarEmpleados);
router.get('/empleados/registrar', empleadoController.mostrarFormularioRegistro);
router.post('/empleados/registrar', empleadoController.registrarEmpleado);
router.get('/empleados/ver/:id', empleadoController.verEmpleado);
router.get('/empleados/editar/:id', empleadoController.mostrarFormularioEdicion);
router.post('/empleados/editar/:id', empleadoController.actualizarEmpleado);
router.get('/empleados/eliminar/:id', empleadoController.eliminarEmpleado);


// Rutas de gestión de inventarios
router.get('/inventarios', inventarioController.listarInventarios);
router.get('/inventarios/registrar', inventarioController.mostrarFormularioRegistro);
router.post('/inventarios/registrar', inventarioController.registrarInventario);
router.get('/inventarios/ver/:id', inventarioController.verInventario);
router.get('/inventarios/editar/:id', inventarioController.mostrarFormularioEdicion);
router.post('/inventarios/editar/:id', inventarioController.actualizarInventario);
router.get('/inventarios/eliminar/:id', inventarioController.eliminarInventario);
router.get('/inventarios/agregar-producto/:id', inventarioController.mostrarFormularioAgregarProducto);
router.post('/inventarios/agregar-producto/:id', inventarioController.agregarProducto);

module.exports = router;