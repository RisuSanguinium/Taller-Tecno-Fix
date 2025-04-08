const conexion = require('../database/db');

const soporteController = {
    mostrarFormulario: (req, res) => {
        if (!req.session.user || req.session.user.rol !== 'Cliente') {
            return res.redirect('/login');
        }

        
        conexion.query(
            'SELECT id_cliente FROM Cliente WHERE id_usuario = ?',
            [req.session.user.id],
            (error, clienteResults) => {
                if (error || !clienteResults || clienteResults.length === 0) {
                    console.error('Error al obtener cliente:', error);
                    return res.render('soporte/nueva-solicitud', {
                        title: 'Solicitar Soporte - Tecno-Fix',
                        currentPage: 'solicitar-soporte',
                        equipos: [],
                        error: 'No se encontró su información de cliente'
                    });
                }

                const id_cliente = clienteResults[0].id_cliente;

                // Obtener equipos asignados al cliente
                conexion.query(`
                    SELECT p.* 
                    FROM Producto p
                    JOIN Asignacion a ON p.id_producto = a.id_producto
                    WHERE a.id_cliente = ? AND a.activa = 1 AND p.activo = 1
                `, [id_cliente], (error, equipos) => {
                    if (error) {
                        console.error('Error al obtener equipos:', error);
                        return res.render('soporte/nueva-solicitud', {
                            title: 'Solicitar Soporte - Tecno-Fix',
                            currentPage: 'solicitar-soporte',
                            equipos: [],
                            error: 'Error al cargar los equipos asignados'
                        });
                    }
        
                    // Obtener mensajes de la sesión y limpiarlos
                    const success = req.session.solicitudSuccess;
                    const errorMsg = req.session.solicitudError;
                    delete req.session.solicitudSuccess;
                    delete req.session.solicitudError;
        
                    res.render('soporte/nueva-solicitud', {
                        title: 'Solicitar Soporte - Tecno-Fix',
                        currentPage: 'solicitar-soporte',
                        equipos: equipos || [],
                        success: success,
                        error: errorMsg
                    });
                });
            }
        );
    },

    crearSolicitud: (req, res) => {
        if (!req.session.user || req.session.user.rol !== 'Cliente') {
            return res.redirect('/login');
        }

        const { id_producto, urgencia, descripcion_problema } = req.body;
        
        // Primero obtener el id_cliente del usuario
        conexion.query(
            'SELECT id_cliente FROM Cliente WHERE id_usuario = ?',
            [req.session.user.id],
            (error, clienteResults) => {
                if (error || !clienteResults || clienteResults.length === 0) {
                    console.error('Error al obtener cliente:', error);
                    return res.render('soporte/nueva-solicitud', {
                        title: 'Solicitar Soporte - Tecno-Fix',
                        currentPage: 'solicitar-soporte',
                        equipos: [],
                        error: 'No se encontró su información de cliente'
                    });
                }

                const id_cliente = clienteResults[0].id_cliente;

                // Validar que se seleccionó un equipo
                if (!id_producto) {
                    return obtenerEquiposYRenderizar(
                        'Debe seleccionar un equipo relacionado para la solicitud'
                    );
                }

                // Verificar si ya existe una solicitud pendiente para este producto
                conexion.query(`
                    SELECT 1 FROM SolicitudSoporte 
                    WHERE id_producto = ? AND id_cliente = ? AND id_estado IN (6, 7) 
                    LIMIT 1
                `, [id_producto, id_cliente], (error, existingRequests) => {
                    if (error) {
                        console.error('Error al verificar solicitudes existentes:', error);
                        req.session.solicitudError = 'Error al verificar solicitudes previas';
                        return res.redirect('/solicitar-soporte');
                    }
        
                    if (existingRequests.length > 0) {
                        req.session.solicitudError = 'Ya enviaste una solicitud de soporte sobre este producto que aún está pendiente.';
                        return res.redirect('/solicitar-soporte');
                    }

                    // Validar que el producto pertenece al cliente
                    conexion.query(`
                        SELECT 1 FROM Asignacion 
                        WHERE id_producto = ? AND id_cliente = ? AND activa = 1
                    `, [id_producto, id_cliente], (error, results) => {
                        if (error || results.length === 0) {
                            return obtenerEquiposYRenderizar(
                                'El equipo seleccionado no está asignado a usted'
                            );
                        }

                        // Estado inicial: Pendiente 
                        const id_estado = 6;
                        
                        conexion.query(`
                            INSERT INTO SolicitudSoporte 
                            (id_cliente, id_producto, id_estado, descripcion_problema, urgencia, fecha_solicitud)
                            VALUES (?, ?, ?, ?, ?, NOW())
                        `, [id_cliente, id_producto, id_estado, descripcion_problema, urgencia], (error, results) => {
                            if (error) {
                                console.error('Error al crear solicitud:', error);
                                req.session.solicitudError = 'Error al enviar la solicitud';
                                return res.redirect('/solicitar-soporte');
                            }
            
                            req.session.solicitudSuccess = 'La solicitud de soporte ha sido enviada con éxito. Nos contactaremos con usted pronto.';
                            res.redirect('/solicitar-soporte');
                        });
                    });
                });

                function obtenerEquiposYRenderizar(mensajeError) {
                    conexion.query(`
                        SELECT p.* 
                        FROM Producto p
                        JOIN Asignacion a ON p.id_producto = a.id_producto
                        WHERE a.id_cliente = ? AND a.activa = 1 AND p.activo = 1
                    `, [id_cliente], (error, equipos) => {
                        res.render('soporte/nueva-solicitud', {
                            title: 'Solicitar Soporte - Tecno-Fix',
                            currentPage: 'solicitar-soporte',
                            equipos: equipos || [],
                            error: mensajeError,
                            formData: req.body
                        });
                    });
                }
            }
        );
    }
};

module.exports = soporteController;