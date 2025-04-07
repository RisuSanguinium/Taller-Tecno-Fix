const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const soporteController = require('../controllers/soporteController');
const empleadoController = require('../controllers/empleadoController');
const inventarioController = require('../controllers/inventarioController');
const productoController = require('../controllers/productoController');
const clienteController = require('../controllers/clienteController');
const bitacoraAController = require('../controllers/bitacoraAController');
const bitacoraRController = require('../controllers/bitacoraRController');
const dashboardController = require('../controllers/dashboardController');
const reportePagosController = require('../controllers/reportePagosController');

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
router.post('/inventarios/agregar-cantidad/:id', inventarioController.agregarCantidad);
router.post('/inventarios/quitar-cantidad/:id', inventarioController.quitarCantidad);
router.get('/inventarios/eliminar-producto/:id/:idProducto', inventarioController.eliminarProducto);

// Rutas de gestión de productos
router.get('/productos', productoController.listarProductos);
router.get('/productos/registrar', productoController.mostrarFormularioRegistro);
router.post('/productos/registrar', productoController.registrarProducto);
router.get('/productos/ver/:id', productoController.verProducto);
router.get('/productos/editar/:id', productoController.mostrarFormularioEdicion);
router.post('/productos/editar/:id', productoController.actualizarProducto);
router.get('/productos/eliminar/:id', productoController.eliminarProducto);
router.get('/productos/asignar/:id', productoController.mostrarFormularioAsignacion);
router.post('/productos/asignar/:id', productoController.asignarProducto);
router.get('/productos/desasignar/:id', productoController.desasignarProducto);


// Rutas de gestión de clientes
router.get('/clientes', clienteController.listarClientes);
router.get('/clientes/ver/:id', clienteController.verCliente);
router.get('/clientes/editar/:id', clienteController.mostrarFormularioEdicion);
router.post('/clientes/editar/:id', clienteController.actualizarCliente);
router.get('/clientes/eliminar/:id', clienteController.eliminarCliente);
router.get('/equipos-soporte', clienteController.mostrarEquiposSoporte);
router.post('/equipos-soporte/pagar/:id', clienteController.marcarComoPagado);

// Rutas de bitácora de asignaciones
router.get('/bitacora-asignaciones', bitacoraAController.mostrarBitacora);
router.post('/bitacora-asignaciones', bitacoraAController.filtrarBitacora);
router.get('/bitacora-asignaciones/pdf', bitacoraAController.generarPDF);


//Rutas de Empleado
router.get('/solicitudes-soporte', empleadoController.listarSolicitudesSoporte);
router.post('/solicitudes-soporte/aceptar/:id', empleadoController.aceptarSolicitud);
router.post('/solicitudes-soporte/rechazar/:id', empleadoController.rechazarSolicitud);
router.get('/en-reparacion', empleadoController.mostrarEnReparacion);
router.post('/en-reparacion/actualizar-info/:id', empleadoController.actualizarInfo);
router.post('/en-reparacion/completar/:id', empleadoController.completarReparacion);
router.post('/en-reparacion/esperar-repuestos/:id', empleadoController.esperarRepuestos);
router.post('/en-reparacion/irreparable/:id', empleadoController.marcarIrreparable);


// Rutas para Bitácora de Reparaciones
router.get('/bitacora-reparaciones', bitacoraRController.mostrarBitacora);
router.post('/bitacora-reparaciones', bitacoraRController.filtrarBitacora);
router.get('/bitacora-reparaciones/pdf', bitacoraRController.generarPDF);

// Rutas para los Graficos
router.get('/estadisticas', dashboardController.mostrarEstadisticas);

//Rutas para los reportes
router.get('/reportes-pagos', reportePagosController.mostrarReporte);
router.post('/reportes-pagos', reportePagosController.filtrarReporte);
router.get('/reportes-pagos/pdf', reportePagosController.generarPDF);

module.exports = router;