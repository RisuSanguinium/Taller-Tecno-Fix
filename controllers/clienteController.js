const conexion = require('../database/db');

const clienteController = {
    listarClientes: (req, res) => {
        if (!req.session.user || req.session.user.rol !== 'Administrador') {
            return res.redirect('/login');
        }
    
        conexion.query(`
            SELECT c.*, u.email 
            FROM Cliente c
            JOIN Usuario u ON c.id_usuario = u.id_usuario
            WHERE u.activo = 1
            ORDER BY c.id_cliente
        `, (error, clientes) =>  {
            if (error) {
                console.error('Error al obtener clientes:', error);
                return res.render('clientes/lista', {
                    title: 'Lista de Clientes - Tecno-Fix',
                    currentPage: 'clientes',
                    clientes: [],
                    error: 'Error al cargar la lista de clientes'
                });
            }

            res.render('clientes/lista', {
                title: 'Lista de Clientes - Tecno-Fix',
                currentPage: 'clientes',
                clientes: clientes || []
            });
        });
    },

    verCliente: (req, res) => {
        if (!req.session.user || req.session.user.rol !== 'Administrador') {
            return res.redirect('/login');
        }
    
        const idCliente = req.params.id;
    
        conexion.query(`
            SELECT c.*, u.email, u.username, r.nombre_rol as rol 
            FROM Cliente c
            JOIN Usuario u ON c.id_usuario = u.id_usuario
            JOIN Rol r ON u.id_rol = r.id_rol
            WHERE c.id_cliente = ? AND u.activo = 1
        `, [idCliente], (error, results) => {
            if (error || results.length === 0) {
                console.error('Error al obtener cliente:', error);
                return res.redirect('/clientes?error=Cliente no encontrado');
            }
    
            const cliente = results[0];
            
            res.render('clientes/ver', {
                title: 'Detalles del Cliente - Tecno-Fix',
                currentPage: 'clientes',
                cliente: cliente
            });
        });
    },

    mostrarFormularioEdicion: (req, res) => {
        if (!req.session.user || req.session.user.rol !== 'Administrador') {
            return res.redirect('/login');
        }
    
        const idCliente = req.params.id;
    
        conexion.query(`
            SELECT c.*, u.email 
            FROM Cliente c
            JOIN Usuario u ON c.id_usuario = u.id_usuario
            WHERE c.id_cliente = ? AND u.activo = 1
        `, [idCliente], (error, results) => {
            if (error || results.length === 0) {
                console.error('Error al obtener cliente:', error);
                return res.redirect('/clientes?error=Cliente no encontrado');
            }
    
            const cliente = results[0];
            
            res.render('clientes/editar', {
                title: 'Editar Cliente - Tecno-Fix',
                currentPage: 'clientes',
                cliente: cliente
            });
        });
    },

    actualizarCliente: (req, res) => {
        if (!req.session.user || req.session.user.rol !== 'Administrador') {
            return res.redirect('/login');
        }
    
        const idCliente = req.params.id;
        const { nombre, apellido, cedula, telefono, departamento, puesto, fecha_ingreso, email } = req.body;
    
        // Primero obtener el id_usuario asociado
        conexion.query(
            'SELECT id_usuario FROM Cliente WHERE id_cliente = ?',
            [idCliente],
            (error, results) => {
                if (error || results.length === 0) {
                    console.error('Error al buscar cliente:', error);
                    return res.redirect('/clientes?error=Cliente no encontrado');
                }
    
                const idUsuario = results[0].id_usuario;
    
                // Actualizar datos del cliente
                conexion.query(
                    `UPDATE Cliente SET 
                        nombre = ?, 
                        apellido = ?, 
                        cedula = ?, 
                        telefono = ?, 
                        departamento = ?, 
                        puesto = ?,
                        fecha_ingreso = ?
                    WHERE id_cliente = ?`,
                    [nombre, apellido, cedula, telefono, departamento, puesto, fecha_ingreso, idCliente],
                    (error) => {
                        if (error) {
                            console.error('Error al actualizar cliente:', error);
                            return res.redirect(`/clientes/editar/${idCliente}?error=Error al actualizar cliente`);
                        }
    
                        // Actualizar email del usuario
                        conexion.query(
                            'UPDATE Usuario SET email = ? WHERE id_usuario = ?',
                            [email, idUsuario],
                            (error) => {
                                if (error) {
                                    console.error('Error al actualizar email:', error);
                                    return res.redirect(`/clientes/editar/${idCliente}?error=Error al actualizar email`);
                                }
    
                                res.redirect(`/clientes/ver/${idCliente}?success=Cliente actualizado exitosamente`);
                            }
                        );
                    }
                );
            }
        );
    },

    eliminarCliente: (req, res) => {
        if (!req.session.user || req.session.user.rol !== 'Administrador') {
            return res.redirect('/login');
        }
    
        const idCliente = req.params.id;
        const { confirmar } = req.query;
    
        // Verificar asignaciones activas
        conexion.query(
            `SELECT COUNT(*) as asignaciones_activas 
             FROM Asignacion 
             WHERE id_cliente = ? AND activa = 1`,
            [idCliente],
            (error, results) => {
                if (error) {
                    console.error('Error al verificar asignaciones:', error);
                    return res.redirect('/clientes?error=Error al verificar asignaciones del cliente');
                }
    
                const tieneAsignaciones = results[0].asignaciones_activas > 0;
    
                // Si tiene asignaciones y no se ha confirmado, mostrar advertencia
                if (tieneAsignaciones && !confirmar) {
                    return conexion.query(`
                        SELECT c.*, u.email 
                        FROM Cliente c
                        JOIN Usuario u ON c.id_usuario = u.id_usuario
                        WHERE c.id_cliente = ? AND u.activo = 1
                    `, [idCliente], (error, clienteResults) => {
                        if (error || clienteResults.length === 0) {
                            return res.redirect('/clientes?error=Cliente no encontrado');
                        }
    
                        const cliente = clienteResults[0];
                        
                        // Obtener productos asignados para mostrar en la advertencia
                        conexion.query(`
                            SELECT p.id_producto, p.nombre, p.marca, p.modelo 
                            FROM Asignacion a
                            JOIN Producto p ON a.id_producto = p.id_producto
                            WHERE a.id_cliente = ? AND a.activa = 1
                        `, [idCliente], (error, productos) => {
                            if (error) {
                                console.error('Error al obtener productos asignados:', error);
                                return res.redirect('/clientes?error=Error al obtener productos asignados');
                            }
    
                            return res.render('clientes/confirmar-eliminacion', {
                                title: 'Confirmar Eliminación - Tecno-Fix',
                                currentPage: 'clientes',
                                cliente: cliente,
                                productos: productos,
                                error: 'Este cliente tiene productos asignados activamente. ¿Desea continuar con la eliminación?'
                            });
                        });
                    });
                }
    
                // Obtener el id_usuario asociado
                conexion.query(
                    'SELECT id_usuario FROM Cliente WHERE id_cliente = ?',
                    [idCliente],
                    (error, results) => {
                        if (error || results.length === 0) {
                            console.error('Error al buscar cliente:', error);
                            return res.redirect('/clientes?error=Cliente no encontrado');
                        }
    
                        const idUsuario = results[0].id_usuario;
    
                        // Si tiene asignaciones y se confirmó, procesar todo
                        if (tieneAsignaciones && confirmar) {
                            // 1. Actualizar inventario (mover de asignados a disponibles)
                            conexion.query(`
                                UPDATE InventarioProducto ip
                                JOIN Asignacion a ON ip.id_producto = a.id_producto
                                SET 
                                    ip.cantidad_asignada = ip.cantidad_asignada - 1,
                                    ip.cantidad_disponible = ip.cantidad_disponible + 1
                                WHERE a.id_cliente = ? AND a.activa = 1
                            `, [idCliente], (error) => {
                                if (error) {
                                    console.error('Error al actualizar inventario:', error);
                                    return res.redirect('/clientes?error=Error al actualizar inventario');
                                }
    
                                // 2. Desactivar asignaciones
                                conexion.query(
                                    'UPDATE Asignacion SET activa = 0 WHERE id_cliente = ?',
                                    [idCliente],
                                    (error) => {
                                        if (error) {
                                            console.error('Error al desactivar asignaciones:', error);
                                            return res.redirect('/clientes?error=Error al desactivar asignaciones');
                                        }
    
                                        // 3. Eliminar solicitudes de soporte sin procesar
                                        conexion.query(`
                                            DELETE s FROM SolicitudSoporte s
                                            LEFT JOIN ProcesoReparacion pr ON s.id_solicitud = pr.id_solicitud
                                            WHERE s.id_cliente = ? 
                                            AND s.fecha_cierre IS NULL 
                                            AND pr.id_proceso IS NULL
                                        `, [idCliente], (error) => {
                                            if (error) {
                                                console.error('Error al eliminar solicitudes:', error);
                                                return res.redirect('/clientes?error=Error al limpiar solicitudes de soporte');
                                            }
    
                                            // 4. Finalmente desactivar el usuario
                                            desactivarUsuario();
                                        });
                                    }
                                );
                            });
                        } else {
                            // No tiene asignaciones o no requiere confirmación
                            desactivarUsuario();
                        }
    
                        function desactivarUsuario() {
                            // Desactivar el usuario (eliminación lógica)
                            conexion.query(
                                'UPDATE Usuario SET activo = 0 WHERE id_usuario = ?',
                                [idUsuario],
                                (error) => {
                                    if (error) {
                                        console.error('Error al desactivar usuario:', error);
                                        return res.redirect('/clientes?error=Error al desactivar cliente');
                                    }
    
                                    res.redirect('/clientes?success=Cliente desactivado exitosamente' + 
                                        (tieneAsignaciones ? ' (asignaciones canceladas e inventario actualizado)' : ''));
                                }
                            );
                        }
                    }
                );
            }
        );
    },

    mostrarEquiposSoporte: (req, res) => {
        if (!req.session.user || req.session.user.rol !== 'Cliente') {
            return res.redirect('/login');
        }
    
        // Obtener el id_cliente del usuario
        conexion.query(
            'SELECT id_cliente FROM Cliente WHERE id_usuario = ?',
            [req.session.user.id],
            (error, clienteResults) => {
                if (error || !clienteResults || clienteResults.length === 0) {
                    console.error('Error al obtener cliente:', error);
                    return res.render('error', { 
                        message: 'No se encontró su información de cliente' 
                    });
                }
    
                const id_cliente = clienteResults[0].id_cliente;
    
                // Obtener todas las solicitudes de soporte del cliente con su estado
                conexion.query(`
                    SELECT 
                        s.id_solicitud,
                        p.nombre AS producto_nombre,
                        p.marca,
                        p.modelo,
                        p.numero_serie,
                        p.activo AS producto_activo,
                        s.fecha_solicitud,
                        s.fecha_cierre,
                        s.urgencia,
                        s.solucion,
                        e.nombre_estado AS estado_solicitud,
                        pr.id_proceso,
                        pr.id_estado AS estado_reparacion_id,
                        er.nombre_estado AS estado_reparacion,
                        pr.fecha_inicio,
                        pr.fecha_fin,
                        pr.diagnostico,
                        pr.acciones_realizadas,
                        pr.repuestos_utilizados,
                        pr.costo_estimado,
                        pr.costo_final,
                        pr.observaciones,
                        pr.pagado
                    FROM SolicitudSoporte s
                    JOIN Producto p ON s.id_producto = p.id_producto
                    JOIN Estado e ON s.id_estado = e.id_estado
                    LEFT JOIN ProcesoReparacion pr ON s.id_solicitud = pr.id_solicitud
                    LEFT JOIN Estado er ON pr.id_estado = er.id_estado
                    WHERE s.id_cliente = ?
                    ORDER BY s.fecha_solicitud DESC
                `, [id_cliente], (error, solicitudes) => {
                    if (error) {
                        console.error('Error al obtener equipos en soporte:', error);
                        return res.render('error', { 
                            message: 'Error al cargar los equipos en soporte' 
                        });
                    }
    
                    res.render('cliente/equipos-soporte', {
                        title: 'Mis Equipos en Soporte',
                        currentPage: 'equipos-soporte',
                        solicitudes: solicitudes || []
                    });
                });
            }
        );
    },
    
    marcarComoPagado: (req, res) => {
        if (!req.session.user || req.session.user.rol !== 'Cliente') {
            return res.redirect('/login');
        }
    
        const id_proceso = req.params.id;
    
        // Primero verificar si el producto es irreparable
        conexion.query(
            `SELECT pr.id_estado, pr.id_solicitud, s.id_producto 
             FROM ProcesoReparacion pr
             JOIN SolicitudSoporte s ON pr.id_solicitud = s.id_solicitud
             WHERE pr.id_proceso = ?`,
            [id_proceso],
            (error, results) => {
                if (error || results.length === 0) {
                    console.error('Error al verificar estado de reparación:', error);
                    return res.redirect('/equipos-soporte?error=Error al procesar el pago');
                }
                
                const estado = results[0].id_estado;
                const id_producto = results[0].id_producto;
                
                if (estado === 14) { // Irreparable
                    // Desactivar el producto
                    conexion.query(
                        'UPDATE Producto SET activo = 1 WHERE id_producto = ?',
                        [id_producto],
                        (error) => {
                            if (error) {
                                console.error('Error al desactivar producto:', error);
                                return res.redirect('/equipos-soporte?error=Error al desactivar producto irreparable');
                            }
                            
                            // Marcar como pagado
                            conexion.query(
                                'UPDATE ProcesoReparacion SET pagado = 1 WHERE id_proceso = ?',
                                [id_proceso],
                                (error) => {
                                    if (error) {
                                        console.error('Error al marcar como pagado:', error);
                                        return res.redirect('/equipos-soporte?error=Error al procesar el pago');
                                    }
                                    
                                    res.redirect('/equipos-soporte?success=Producto irreparable marcado como pagado y desactivado');
                                }
                            );
                        }
                    );
                } else {
                    // Solo marcar como pagado
                    conexion.query(
                        'UPDATE ProcesoReparacion SET pagado = 1 WHERE id_proceso = ?',
                        [id_proceso],
                        (error) => {
                            if (error) {
                                console.error('Error al marcar como pagado:', error);
                                return res.redirect('/equipos-soporte?error=Error al procesar el pago');
                            }
                            
                            res.redirect('/equipos-soporte?success=Reparación marcada como pagada');
                        }
                    );
                }
            }
        );
    }


};

module.exports = clienteController;