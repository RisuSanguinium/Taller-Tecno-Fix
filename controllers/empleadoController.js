const bcrypt = require('bcrypt');
const conexion = require('../database/db');

const empleadoController = {
    listarEmpleados: (req, res) => {
        if (!req.session.user || req.session.user.rol !== 'Administrador') {
            return res.redirect('/login');
        }

        conexion.query(`
            SELECT e.*, u.email 
            FROM Empleado e
            JOIN Usuario u ON e.id_usuario = u.id_usuario
            ORDER BY e.id_empleado
        `, (error, empleados) => {
            if (error) {
                console.error('Error al obtener empleados:', error);
                return res.render('empleados/lista', {
                    title: 'Lista de Empleados - Tecno-Fix',
                    currentPage: 'empleados',
                    empleados: [],
                    error: 'Error al cargar la lista de empleados'
                });
            }

            res.render('empleados/lista', {
                title: 'Lista de Empleados - Tecno-Fix',
                currentPage: 'empleados',
                empleados: empleados || []
            });
        });
    },

    mostrarFormularioRegistro: (req, res) => {
        if (!req.session.user || req.session.user.rol !== 'Administrador') {
            return res.redirect('/login');
        }

        res.render('empleados/registrar', {
            title: 'Registrar Empleado - Tecno-Fix',
            currentPage: 'empleados'
        });
    },

    registrarEmpleado: (req, res) => {
        if (!req.session.user || req.session.user.rol !== 'Administrador') {
            return res.redirect('/login');
        }

        const { nombre, apellido, cedula, telefono, departamento, especialidad, email, password, confirmPassword } = req.body;

        // Validaciones
        if (password !== confirmPassword) {
            return res.render('empleados/registrar', {
                title: 'Registrar Empleado - Tecno-Fix',
                currentPage: 'empleados',
                error: 'Las contraseñas no coinciden',
                formData: req.body
            });
        }

        // Verificar si el email ya existe
        conexion.query('SELECT * FROM Usuario WHERE email = ?', [email], (error, users) => {
            if (error) {
                console.error('Error al verificar email:', error);
                return res.render('empleados/registrar', {
                    title: 'Registrar Empleado - Tecno-Fix',
                    currentPage: 'empleados',
                    error: 'Error en el servidor',
                    formData: req.body
                });
            }

            if (users.length > 0) {
                return res.render('empleados/registrar', {
                    title: 'Registrar Empleado - Tecno-Fix',
                    currentPage: 'empleados',
                    error: 'El email ya está registrado',
                    formData: req.body
                });
            }

            // Hash de la contraseña
            bcrypt.hash(password, 10, (err, hashedPassword) => {
                if (err) {
                    console.error('Error al hashear contraseña:', err);
                    return res.render('empleados/registrar', {
                        title: 'Registrar Empleado - Tecno-Fix',
                        currentPage: 'empleados',
                        error: 'Error en el servidor',
                        formData: req.body
                    });
                }

                // Obtener ID del rol de Empleado (2 según tu DB)
                const empleadoRolId = 2;

                // Crear usuario
                conexion.query(
                    'INSERT INTO Usuario (username, email, password, id_rol, activo) VALUES (?, ?, ?, ?, 1)',
                    [email.split('@')[0], email, hashedPassword, empleadoRolId],
                    (error, userResults) => {
                        if (error) {
                            console.error('Error al crear usuario:', error);
                            return res.render('empleados/registrar', {
                                title: 'Registrar Empleado - Tecno-Fix',
                                currentPage: 'empleados',
                                error: 'Error al crear el usuario',
                                formData: req.body
                            });
                        }

                        // Crear empleado
                        conexion.query(
                            'INSERT INTO Empleado (id_usuario, nombre, apellido, cedula, telefono, departamento, especialidad) VALUES (?, ?, ?, ?, ?, ?, ?)',
                            [userResults.insertId, nombre, apellido, cedula, telefono, departamento, especialidad],
                            (error) => {
                                if (error) {
                                    console.error('Error al crear empleado:', error);
                                    return res.render('empleados/registrar', {
                                        title: 'Registrar Empleado - Tecno-Fix',
                                        currentPage: 'empleados',
                                        error: 'Error al registrar el empleado',
                                        formData: req.body
                                    });
                                }

                                res.redirect('/empleados?success=Empleado registrado exitosamente');
                            }
                        );
                    }
                );
            });
        });
    },

    // Métodos para ver, editar y eliminar
    verEmpleado: (req, res) => {
        if (!req.session.user || req.session.user.rol !== 'Administrador') {
            return res.redirect('/login');
        }
    
        const idEmpleado = req.params.id;
    
        conexion.query(`
            SELECT e.*, u.email, u.username, r.nombre_rol as rol 
            FROM Empleado e
            JOIN Usuario u ON e.id_usuario = u.id_usuario
            JOIN Rol r ON u.id_rol = r.id_rol
            WHERE e.id_empleado = ?
        `, [idEmpleado], (error, results) => {
            if (error || results.length === 0) {
                console.error('Error al obtener empleado:', error);
                return res.redirect('/empleados?error=Empleado no encontrado');
            }
    
            const empleado = results[0];
            
            res.render('empleados/ver', {
                title: 'Detalles del Empleado - Tecno-Fix',
                currentPage: 'empleados',
                empleado: empleado
            });
        });
    },

    mostrarFormularioEdicion: (req, res) => {
        if (!req.session.user || req.session.user.rol !== 'Administrador') {
            return res.redirect('/login');
        }
    
        const idEmpleado = req.params.id;
    
        conexion.query(`
            SELECT e.*, u.email 
            FROM Empleado e
            JOIN Usuario u ON e.id_usuario = u.id_usuario
            WHERE e.id_empleado = ?
        `, [idEmpleado], (error, results) => {
            if (error || results.length === 0) {
                console.error('Error al obtener empleado:', error);
                return res.redirect('/empleados?error=Empleado no encontrado');
            }
    
            const empleado = results[0];
            
            res.render('empleados/editar', {
                title: 'Editar Empleado - Tecno-Fix',
                currentPage: 'empleados',
                empleado: empleado
            });
        });
    },

    actualizarEmpleado: (req, res) => {
        if (!req.session.user || req.session.user.rol !== 'Administrador') {
            return res.redirect('/login');
        }
    
        const idEmpleado = req.params.id;
        const { nombre, apellido, cedula, telefono, departamento, especialidad, email } = req.body;
    
        // Primero obtener el id_usuario asociado
        conexion.query(
            'SELECT id_usuario FROM Empleado WHERE id_empleado = ?',
            [idEmpleado],
            (error, results) => {
                if (error || results.length === 0) {
                    console.error('Error al buscar empleado:', error);
                    return res.redirect('/empleados?error=Empleado no encontrado');
                }
    
                const idUsuario = results[0].id_usuario;
    
                // Actualizar datos del empleado
                conexion.query(
                    `UPDATE Empleado SET 
                        nombre = ?, 
                        apellido = ?, 
                        cedula = ?, 
                        telefono = ?, 
                        departamento = ?, 
                        especialidad = ?
                    WHERE id_empleado = ?`,
                    [nombre, apellido, cedula, telefono, departamento, especialidad, idEmpleado],
                    (error) => {
                        if (error) {
                            console.error('Error al actualizar empleado:', error);
                            return res.redirect(`/empleados/editar/${idEmpleado}?error=Error al actualizar empleado`);
                        }
    
                        // Actualizar email del usuario
                        conexion.query(
                            'UPDATE Usuario SET email = ? WHERE id_usuario = ?',
                            [email, idUsuario],
                            (error) => {
                                if (error) {
                                    console.error('Error al actualizar email:', error);
                                    return res.redirect(`/empleados/editar/${idEmpleado}?error=Error al actualizar email`);
                                }
    
                                res.redirect(`/empleados/ver/${idEmpleado}?success=Empleado actualizado exitosamente`);
                            }
                        );
                    }
                );
            }
        );
    },

    eliminarEmpleado: (req, res) => {
        if (!req.session.user || req.session.user.rol !== 'Administrador') {
            return res.redirect('/login');
        }
    
        const idEmpleado = req.params.id;
    
        // Primero verificamos si el empleado tiene responsabilidades
        conexion.query(
            `SELECT 
                (SELECT COUNT(*) FROM Inventario WHERE responsable = ?) AS inventarios,
                (SELECT COUNT(*) FROM Asignacion WHERE id_empleado_asignador = ?) AS asignaciones,
                (SELECT COUNT(*) FROM ProcesoReparacion WHERE id_empleado_asignado = ?) AS reparaciones`,
            [idEmpleado, idEmpleado, idEmpleado],
            (error, results) => {
                if (error) {
                    console.error('Error al verificar responsabilidades:', error);
                    return res.redirect('/empleados?error=Error al verificar responsabilidades del empleado');
                }
    
                const tieneResponsabilidades = 
                    results[0].inventarios > 0 || 
                    results[0].asignaciones > 0 || 
                    results[0].reparaciones > 0;
    
                if (tieneResponsabilidades) {
                    return res.redirect('/empleados?error=El empleado no se puede eliminar debido a que aún tiene responsabilidades en la empresa');
                }
    
                // Si no tiene responsabilidades, procedemos con la eliminación
                conexion.query(
                    'SELECT id_usuario FROM Empleado WHERE id_empleado = ?',
                    [idEmpleado],
                    (error, results) => {
                        if (error || results.length === 0) {
                            console.error('Error al buscar empleado:', error);
                            return res.redirect('/empleados?error=Empleado no encontrado');
                        }
    
                        const idUsuario = results[0].id_usuario;
    
                        // Eliminar empleado
                        conexion.query(
                            'DELETE FROM Empleado WHERE id_empleado = ?',
                            [idEmpleado],
                            (error) => {
                                if (error) {
                                    console.error('Error al eliminar empleado:', error);
                                    return res.redirect('/empleados?error=Error al eliminar empleado');
                                }
    
                                // Eliminar usuario
                                conexion.query(
                                    'DELETE FROM Usuario WHERE id_usuario = ?',
                                    [idUsuario],
                                    (error) => {
                                        if (error) {
                                            console.error('Error al eliminar usuario:', error);
                                            return res.redirect('/empleados?error=Error al eliminar usuario asociado');
                                        }
    
                                        res.redirect('/empleados?success=Empleado eliminado exitosamente');
                                    }
                                );
                            }
                        );
                    }
                );
            }
        );
    },

    listarSolicitudesSoporte: (req, res) => {
        if (!req.session.user || req.session.user.rol !== 'Empleado') {
            return res.redirect('/login');
        }

        conexion.query(`
            SELECT 
                s.id_solicitud,
                s.fecha_solicitud,
                s.descripcion_problema,
                s.urgencia,
                e.nombre_estado as estado,
                c.nombre as cliente_nombre,
                c.apellido as cliente_apellido,
                p.nombre as producto_nombre,
                p.marca,
                p.modelo,
                p.numero_serie
            FROM SolicitudSoporte s
            JOIN Estado e ON s.id_estado = e.id_estado
            JOIN Cliente c ON s.id_cliente = c.id_cliente
            JOIN Producto p ON s.id_producto = p.id_producto
            WHERE s.id_estado = 6  -- Solo solicitudes pendientes (id_estado 6 según tu DB)
            ORDER BY 
                CASE s.urgencia
                    WHEN 'critica' THEN 1
                    WHEN 'alta' THEN 2
                    WHEN 'media' THEN 3
                    ELSE 4
                END,
                s.fecha_solicitud
        `, (error, solicitudes) => {
            if (error) {
                console.error('Error al obtener solicitudes:', error);
                return res.render('error', { message: 'Error al cargar las solicitudes' });
            }

            res.render('empleado/solicitudes-soporte', {
                title: 'Solicitudes de Soporte',
                currentPage: 'solicitudes-soporte',
                solicitudes: solicitudes || []
            });
        });
    },

    aceptarSolicitud: (req, res) => {
        if (!req.session.user || req.session.user.rol !== 'Empleado') {
            return res.redirect('/login');
        }
    
        const id_solicitud = req.params.id;
        const id_empleado = req.session.user.id_empleado;
    
        // 1. Cambiar estado de la solicitud a "En proceso" (id_estado 7)
        // 2. Crear proceso de reparación con estado "Diagnóstico" (id_estado 10)
        conexion.beginTransaction(err => {
            if (err) {
                console.error('Error al iniciar transacción:', err);
                return res.redirect('/solicitudes-soporte?error=Error al procesar la solicitud');
            }
    
            conexion.query(
                'UPDATE SolicitudSoporte SET id_estado = 7 WHERE id_solicitud = ?',
                [id_solicitud],
                (error, results) => {
                    if (error) {
                        return conexion.rollback(() => {
                            console.error('Error al actualizar solicitud:', error);
                            res.redirect('/solicitudes-soporte?error=Error al actualizar la solicitud');
                        });
                    }
    
                    conexion.query(
                        `INSERT INTO ProcesoReparacion 
                        (id_solicitud, id_empleado_asignado, id_estado, fecha_inicio)
                        VALUES (?, ?, 10, NOW())`,  // 10 = Diagnóstico
                        [id_solicitud, id_empleado],
                        (error, results) => {
                            if (error) {
                                return conexion.rollback(() => {
                                    console.error('Error al crear proceso de reparación:', error);
                                    res.redirect('/solicitudes-soporte?error=Error al crear proceso de reparación');
                                });
                            }
    
                            conexion.commit(err => {
                                if (err) {
                                    return conexion.rollback(() => {
                                        console.error('Error al confirmar transacción:', err);
                                        res.redirect('/solicitudes-soporte?error=Error al confirmar la operación');
                                    });
                                }
    
                                res.redirect('/solicitudes-soporte?success=Solicitud aceptada y en proceso de reparación');
                            });
                        }
                    );
                }
            );
        });
    },

    rechazarSolicitud: (req, res) => {
        if (!req.session.user || req.session.user.rol !== 'Empleado') {
            return res.redirect('/login');
        }

        const id_solicitud = req.params.id;
        const { motivo_rechazo } = req.body;

        // 1. Cambiar estado de la solicitud a "Cancelada" (id_estado 9)
        // 2. Establecer fecha_cierre y solución
        conexion.query(
            `UPDATE SolicitudSoporte 
            SET id_estado = 9, fecha_cierre = NOW(), solucion = ?
            WHERE id_solicitud = ?`,
            [`Solicitud cancelada: ${motivo_rechazo}`, id_solicitud],
            (error, results) => {
                if (error) {
                    console.error('Error al rechazar solicitud:', error);
                    return res.redirect('/solicitudes-soporte?error=Error al rechazar la solicitud');
                }

                res.redirect('/solicitudes-soporte?success=Solicitud rechazada correctamente');
            }
        );
    },

    // Mostrar equipos en reparación asignados al empleado
mostrarEnReparacion: (req, res) => {
    if (!req.session.user || req.session.user.rol !== 'Empleado') {
        return res.redirect('/login');
    }

    const id_empleado = req.session.user.id_empleado;

    conexion.query(`
        SELECT 
            pr.id_proceso,
            pr.id_estado,
            e.nombre_estado as estado,
            pr.fecha_inicio,
            pr.diagnostico,
            pr.acciones_realizadas,
            pr.repuestos_utilizados,
            pr.costo_estimado,
            pr.costo_final,
            pr.observaciones,
            s.id_solicitud,
            s.descripcion_problema,
            s.urgencia,
            p.nombre as producto_nombre,
            p.marca,
            p.modelo,
            p.numero_serie,
            c.nombre as cliente_nombre,
            c.apellido as cliente_apellido
        FROM ProcesoReparacion pr
        JOIN Estado e ON pr.id_estado = e.id_estado
        JOIN SolicitudSoporte s ON pr.id_solicitud = s.id_solicitud
        JOIN Producto p ON s.id_producto = p.id_producto
        JOIN Cliente c ON s.id_cliente = c.id_cliente
        WHERE pr.id_empleado_asignado = ? 
        AND pr.id_estado IN (10, 11, 12)  -- Diagnóstico, Espera repuestos, En reparación
        ORDER BY 
            CASE s.urgencia
                WHEN 'critica' THEN 1
                WHEN 'alta' THEN 2
                WHEN 'media' THEN 3
                ELSE 4
            END,
            pr.fecha_inicio
    `, [id_empleado], (error, reparaciones) => {
        if (error) {
            console.error('Error al obtener reparaciones:', error);
            return res.render('error', { message: 'Error al cargar las reparaciones' });
        }

        res.render('empleado/en-reparacion', {
            title: 'Equipos en Reparación',
            currentPage: 'en-reparacion',
            reparaciones: reparaciones || []
        });
    });
},

// Completar reparación (pasar a estado Reparado - 13)
completarReparacion: (req, res) => {
    if (!req.session.user || req.session.user.rol !== 'Empleado') {
        return res.redirect('/login');
    }

    const id_proceso = req.params.id;
    const { acciones_realizadas, repuestos_utilizados, costo_estimado, observaciones } = req.body;

    // Validar campos requeridos
    if (!acciones_realizadas || !repuestos_utilizados || !costo_estimado) {
        console.log("Faltan campos requeridos");
        return res.redirect(`/en-reparacion?error=Debe completar todos los campos requeridos para finalizar la reparación`);
    }

    // Calcular costo final (costo estimado + 15%)
    const costoFinal = parseFloat(costo_estimado) * 1.15;

    conexion.beginTransaction(err => {
        if (err) {
            console.error('Error al iniciar transacción:', err);
            return res.redirect('/en-reparacion?error=Error al procesar la solicitud');
        }

        // 1. Actualizar el proceso de reparación con todos los datos
        conexion.query(
            `UPDATE ProcesoReparacion SET 
                acciones_realizadas = ?,
                repuestos_utilizados = ?,
                costo_estimado = ?,
                costo_final = ?,
                observaciones = ?,
                id_estado = 13,  -- Reparado
                fecha_fin = NOW()
            WHERE id_proceso = ?`,
            [
                acciones_realizadas,
                repuestos_utilizados,
                costo_estimado,
                costoFinal,
                observaciones,
                id_proceso
            ],
            (error, results) => {
                if (error) {
                    return conexion.rollback(() => {
                        console.error('Error al actualizar reparación:', error);
                        res.redirect('/en-reparacion?error=Error al actualizar la reparación');
                    });
                }

                // 2. Actualizar la solicitud a estado Resuelta (8)
                conexion.query(
                    `UPDATE SolicitudSoporte s
                    JOIN ProcesoReparacion pr ON s.id_solicitud = pr.id_solicitud
                    SET s.id_estado = 8, s.fecha_cierre = NOW(), 
                    s.solucion = 'Reparación completada satisfactoriamente'
                    WHERE pr.id_proceso = ?`,
                    [id_proceso],
                    (error, results) => {
                        if (error) {
                            return conexion.rollback(() => {
                                console.error('Error al actualizar solicitud:', error);
                                res.redirect('/en-reparacion?error=Error al actualizar la solicitud');
                            });
                        }

                        // 3. Registrar en bitácora
                        conexion.query(
                            `INSERT INTO BitacoraReparacion 
                            (id_proceso, id_estado_anterior, id_estado_nuevo, id_empleado, observaciones)
                            SELECT 
                                ?,
                                id_estado,
                                13,  -- Nuevo estado: Reparado
                                ?,
                                ?
                            FROM ProcesoReparacion WHERE id_proceso = ?`,
                            [id_proceso, req.session.user.id_empleado, 'Reparación completada', id_proceso],
                            (error, results) => {
                                if (error) {
                                    return conexion.rollback(() => {
                                        console.error('Error al registrar en bitácora:', error);
                                        res.redirect('/en-reparacion?error=Error al registrar en bitácora');
                                    });
                                }

                                conexion.commit(err => {
                                    if (err) {
                                        return conexion.rollback(() => {
                                            console.error('Error al confirmar transacción:', err);
                                            res.redirect('/en-reparacion?error=Error al confirmar la operación');
                                        });
                                    }

                                    res.redirect('/en-reparacion?success=Reparación completada exitosamente');
                                });
                            }
                        );
                    }
                );
            }
        );
    });
},

// Pasar a estado Espera repuestos (11)
esperarRepuestos: (req, res) => {
    if (!req.session.user || req.session.user.rol !== 'Empleado') {
        return res.redirect('/login');
    }

    const id_proceso = req.params.id;
    const { observaciones } = req.body;

    conexion.beginTransaction(err => {
        if (err) {
            console.error('Error al iniciar transacción:', err);
            return res.redirect('/en-reparacion?error=Error al procesar la solicitud');
        }

        // 1. Actualizar estado del proceso
        conexion.query(
            'UPDATE ProcesoReparacion SET id_estado = 11, observaciones = ? WHERE id_proceso = ?',
            [observaciones, id_proceso],
            (error, results) => {
                if (error) {
                    return conexion.rollback(() => {
                        console.error('Error al actualizar reparación:', error);
                        res.redirect('/en-reparacion?error=Error al actualizar la reparación');
                    });
                }

                // 2. Registrar en bitácora
                conexion.query(
                    `INSERT INTO BitacoraReparacion 
                    (id_proceso, id_estado_anterior, id_estado_nuevo, id_empleado, observaciones)
                    VALUES (?, ?, 11, ?, ?)`,  // Nuevo estado: Espera repuestos (11)
                    [id_proceso, req.body.estado_actual, req.session.user.id_empleado, observaciones],
                    (error, results) => {
                        if (error) {
                            return conexion.rollback(() => {
                                console.error('Error al registrar en bitácora:', error);
                                res.redirect('/en-reparacion?error=Error al registrar en bitácora');
                            });
                        }

                        conexion.commit(err => {
                            if (err) {
                                return conexion.rollback(() => {
                                    console.error('Error al confirmar transacción:', err);
                                    res.redirect('/en-reparacion?error=Error al confirmar la operación');
                                });
                            }

                            res.redirect('/en-reparacion?success=Reparación puesta en espera de repuestos');
                        });
                    }
                );
            }
        );
    });
},

// Marcar como irreparable (14)
marcarIrreparable: (req, res) => {
    if (!req.session.user || req.session.user.rol !== 'Empleado') {
        return res.redirect('/login');
    }

    const id_proceso = req.params.id;
    const { motivo, acciones_realizadas } = req.body;

    conexion.beginTransaction(err => {
        if (err) {
            console.error('Error al iniciar transacción:', err);
            return res.redirect('/en-reparacion?error=Error al procesar la solicitud');
        }

        // 1. Actualizar el proceso de reparación
        conexion.query(
            `UPDATE ProcesoReparacion SET 
                acciones_realizadas = ?,
                id_estado = 14,  -- Irreparable
                fecha_fin = NOW(),
                observaciones = ?
            WHERE id_proceso = ?`,
            [acciones_realizadas, motivo, id_proceso],
            (error, results) => {
                if (error) {
                    return conexion.rollback(() => {
                        console.error('Error al actualizar reparación:', error);
                        res.redirect('/en-reparacion?error=Error al actualizar la reparación');
                    });
                }

                // 2. Actualizar la solicitud a estado Resuelta (8)
                conexion.query(
                    `UPDATE SolicitudSoporte s
                    JOIN ProcesoReparacion pr ON s.id_solicitud = pr.id_solicitud
                    SET s.id_estado = 8, s.fecha_cierre = NOW(), 
                    s.solucion = 'Equipo irreparable: ${motivo}'
                    WHERE pr.id_proceso = ?`,
                    [id_proceso],
                    (error, results) => {
                        if (error) {
                            return conexion.rollback(() => {
                                console.error('Error al actualizar solicitud:', error);
                                res.redirect('/en-reparacion?error=Error al actualizar la solicitud');
                            });
                        }

                        // 3. Registrar en bitácora
                        conexion.query(
                            `INSERT INTO BitacoraReparacion 
                            (id_proceso, id_estado_anterior, id_estado_nuevo, id_empleado, observaciones)
                            VALUES (?, ?, 14, ?, ?)`,  //-- A Irreparable (14)
                            [id_proceso, req.body.estado_actual, req.session.user.id_empleado, motivo],
                            (error, results) => {
                                if (error) {
                                    return conexion.rollback(() => {
                                        console.error('Error al registrar en bitácora:', error);
                                        res.redirect('/en-reparacion?error=Error al registrar en bitácora');
                                    });
                                }

                                conexion.commit(err => {
                                    if (err) {
                                        return conexion.rollback(() => {
                                            console.error('Error al confirmar transacción:', err);
                                            res.redirect('/en-reparacion?error=Error al confirmar la operación');
                                        });
                                    }

                                    res.redirect('/en-reparacion?success=Equipo marcado como irreparable');
                                });
                            }
                        );
                    }
                );
            }
        );
    });
}


};

module.exports = empleadoController;