const bcrypt = require('bcrypt');
const conexion = require('../database/db');

const empleadoController = {
    listarEmpleados: (req, res) => {
        if (!req.session.user || req.session.user.rol !== 'Administrador') {
            return res.redirect('/login');
        }

        conexion.query(`
            SELECT e.*, u.email, u.activo as usuario_activo
            FROM Empleado e
            JOIN Usuario u ON e.id_usuario = u.id_usuario
            WHERE u.activo = 1
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

                // Obtener ID del rol de Empleado
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

        // Obtener el id_usuario asociado
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

        conexion.beginTransaction(err => {
            if (err) {
                console.error('Error al iniciar transacción:', err);
                return res.redirect('/empleados?error=Error al procesar la solicitud');
            }

            //Obtener el id_usuario asociado
            conexion.query(
                'SELECT id_usuario FROM Empleado WHERE id_empleado = ?',
                [idEmpleado],
                (error, results) => {
                    if (error || results.length === 0) {
                        return conexion.rollback(() => {
                            console.error('Error al buscar empleado:', error);
                            res.redirect('/empleados?error=Empleado no encontrado');
                        });
                    }

                    const idUsuario = results[0].id_usuario;

                    //Desactivar el usuario
                    conexion.query(
                        'UPDATE Usuario SET activo = 0 WHERE id_usuario = ?',
                        [idUsuario],
                        (error) => {
                            if (error) {
                                return conexion.rollback(() => {
                                    console.error('Error al desactivar usuario:', error);
                                    res.redirect('/empleados?error=Error al desactivar usuario');
                                });
                            }

                            //Actualizar procesos de reparación activos a Reparado
                            conexion.query(`
                                UPDATE ProcesoReparacion 
                                SET 
                                    id_estado = 13, -- Reparado
                                    acciones_realizadas = 'Empleado despedido',
                                    repuestos_utilizados = 'Ninguno',
                                    costo_estimado = 0,
                                    costo_final = 0,
                                    fecha_fin = NOW(),
                                    observaciones = 'Proceso cerrado automáticamente por desactivación del empleado'
                                WHERE id_empleado_asignado = ?
                                AND id_estado IN (10, 11, 12)  -- Solo procesos activos
                            `, [idEmpleado], (error) => {
                                if (error) {
                                    return conexion.rollback(() => {
                                        console.error('Error al actualizar procesos de reparación:', error);
                                        res.redirect('/empleados?error=Error al actualizar procesos de reparación');
                                    });
                                }

                                //Actualizar las solicitudes asociadas a estos procesos a Resuelta
                                conexion.query(`
                                    UPDATE SolicitudSoporte s
                                    JOIN ProcesoReparacion pr ON s.id_solicitud = pr.id_solicitud
                                    SET 
                                        s.id_estado = 8, -- Resuelta
                                        s.fecha_cierre = NOW(),
                                        s.solucion = 'Reparación cerrada automáticamente por desactivación del técnico'
                                    WHERE pr.id_empleado_asignado = ?
                                    AND pr.id_estado = 13 -- Solo los que acabamos de actualizar
                                `, [idEmpleado], (error) => {
                                    if (error) {
                                        return conexion.rollback(() => {
                                            console.error('Error al actualizar solicitudes:', error);
                                            res.redirect('/empleados?error=Error al actualizar solicitudes asociadas');
                                        });
                                    }

                                    // Registrar en bitácora de reparaciones
                                    conexion.query(`
                                        INSERT INTO BitacoraReparacion 
                                        (id_proceso, id_estado_anterior, id_estado_nuevo, id_empleado, observaciones)
                                        SELECT 
                                            pr.id_proceso,
                                            pr.id_estado,
                                            13,  -- Nuevo estado: Reparado
                                            ?,
                                            'Proceso cerrado automáticamente por desactivación del técnico'
                                        FROM ProcesoReparacion pr
                                        WHERE pr.id_empleado_asignado = ?
                                        AND pr.id_estado = 13 -- Solo los que acabamos de actualizar
                                    `, [req.session.user.id_empleado, idEmpleado], (error) => {
                                        if (error) {
                                            return conexion.rollback(() => {
                                                console.error('Error al registrar en bitácora:', error);
                                                res.redirect('/empleados?error=Error al registrar en bitácora');
                                            });
                                        }

                                        // Quitar al empleado como responsable de inventarios
                                        conexion.query(
                                            'UPDATE Inventario SET responsable = NULL WHERE responsable = ?',
                                            [idEmpleado],
                                            (error) => {
                                                if (error) {
                                                    return conexion.rollback(() => {
                                                        console.error('Error al actualizar inventarios:', error);
                                                        res.redirect('/empleados?error=Error al actualizar inventarios asociados');
                                                    });
                                                }

                                                conexion.commit(err => {
                                                    if (err) {
                                                        return conexion.rollback(() => {
                                                            console.error('Error al confirmar transacción:', err);
                                                            res.redirect('/empleados?error=Error al confirmar la operación');
                                                        });
                                                    }

                                                    res.redirect('/empleados?success=Empleado desactivado exitosamente. Los procesos de reparación activos han sido marcados como completados automáticamente.');
                                                });
                                            }
                                        );
                                    });
                                });
                            });
                        }
                    );
                }
            );
        });
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

        conexion.beginTransaction(err => {
            if (err) {
                console.error('Error al iniciar transacción:', err);
                return res.redirect('/solicitudes-soporte?error=Error al procesar la solicitud');
            }

            conexion.query(
                'SELECT id_producto FROM SolicitudSoporte WHERE id_solicitud = ?',
                [id_solicitud],
                (error, results) => {
                    if (error || results.length === 0) {
                        return conexion.rollback(() => {
                            console.error('Error al obtener producto:', error);
                            res.redirect('/solicitudes-soporte?error=Error al obtener información del producto');
                        });
                    }

                    const id_producto = results[0].id_producto;

                    // Cambiar estado de la solicitud a En proceso
                    conexion.query(
                        'UPDATE SolicitudSoporte SET id_estado = 7 WHERE id_solicitud = ?',
                        [id_solicitud],
                        (error) => {
                            if (error) {
                                return conexion.rollback(() => {
                                    console.error('Error al actualizar solicitud:', error);
                                    res.redirect('/solicitudes-soporte?error=Error al actualizar la solicitud');
                                });
                            }

                            //Crear proceso de reparación con estado Diagnóstico
                            conexion.query(
                                `INSERT INTO ProcesoReparacion 
                                (id_solicitud, id_empleado_asignado, id_estado, fecha_inicio)
                                VALUES (?, ?, 10, NOW())`,
                                [id_solicitud, id_empleado],
                                (error, results) => {
                                    if (error) {
                                        return conexion.rollback(() => {
                                            console.error('Error al crear proceso de reparación:', error);
                                            res.redirect('/solicitudes-soporte?error=Error al crear proceso de reparación');
                                        });
                                    }

                                    // Actualizar inventario: pasar de asignado a reparación
                                    conexion.query(`
                                        UPDATE InventarioProducto 
                                        SET 
                                            cantidad_asignada = cantidad_asignada - 1,
                                            cantidad_reparacion = cantidad_reparacion + 1
                                        WHERE id_producto = ?
                                        AND cantidad_asignada > 0
                                    `, [id_producto], (error) => {
                                        if (error) {
                                            return conexion.rollback(() => {
                                                console.error('Error al actualizar inventario:', error);
                                                res.redirect('/solicitudes-soporte?error=Error al actualizar el inventario');
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
                                    });
                                }
                            );
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

        // Cambiar estado de la solicitud a Cancelada
        // Establecer fecha_cierre y solución
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

    // Completar reparación
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

        // Calcular costo final
        const costoFinal = parseFloat(costo_estimado) * 1.15;

        conexion.beginTransaction(err => {
            if (err) {
                console.error('Error al iniciar transacción:', err);
                return res.redirect('/en-reparacion?error=Error al procesar la solicitud');
            }

            // Actualizar el proceso de reparación con todos los datos
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

                    // Actualizar la solicitud a estado Resuelta 
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

                            // Registrar en bitácora
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

    // Pasar a estado Espera repuestos
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

            // Actualizar estado del proceso
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

                    // Registrar en bitácora
                    conexion.query(
                        `INSERT INTO BitacoraReparacion 
                    (id_proceso, id_estado_anterior, id_estado_nuevo, id_empleado, observaciones)
                    VALUES (?, ?, 11, ?, ?)`,  // Nuevo estado: Espera repuestos
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

    // Marcar como irreparable
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
    
            // Obtener información del producto y solicitud
            conexion.query(`
                SELECT s.id_producto, s.id_cliente, s.id_solicitud
                FROM ProcesoReparacion pr
                JOIN SolicitudSoporte s ON pr.id_solicitud = s.id_solicitud
                WHERE pr.id_proceso = ?
            `, [id_proceso], (error, results) => {
                if (error || results.length === 0) {
                    return conexion.rollback(() => {
                        console.error('Error al obtener información:', error);
                        res.redirect('/en-reparacion?error=Error al obtener información del producto');
                    });
                }
    
                const { id_producto, id_cliente, id_solicitud } = results[0];
    
                // Actualizar el proceso de reparación
                conexion.query(`
                    UPDATE ProcesoReparacion SET 
                        acciones_realizadas = ?,
                        id_estado = 14,  -- Irreparable
                        fecha_fin = NOW(),
                        observaciones = ?
                    WHERE id_proceso = ?`,
                    [acciones_realizadas, motivo, id_proceso],
                    (error) => {
                        if (error) {
                            return conexion.rollback(() => {
                                console.error('Error al actualizar reparación:', error);
                                res.redirect('/en-reparacion?error=Error al actualizar la reparación');
                            });
                        }
    
                        // Actualizar la solicitud a estado Resuelta 
                        conexion.query(`
                            UPDATE SolicitudSoporte SET 
                                id_estado = 8, 
                                fecha_cierre = NOW(), 
                                solucion = ?
                            WHERE id_solicitud = ?`,
                            [`Equipo irreparable: ${motivo}`, id_solicitud],
                            (error) => {
                                if (error) {
                                    return conexion.rollback(() => {
                                        console.error('Error al actualizar solicitud:', error);
                                        res.redirect('/en-reparacion?error=Error al actualizar la solicitud');
                                    });
                                }
    
                                // Desactivar asignación del producto con el cliente
                                conexion.query(`
                                    UPDATE Asignacion SET
                                        activa = 0,
                                        fecha_devolucion = NOW(),
                                        motivo_devolucion = 'Producto marcado como irreparable'
                                    WHERE id_producto = ?
                                    AND id_cliente = ?
                                    AND activa = 1
                                `, [id_producto, id_cliente], (error) => {
                                    if (error) {
                                        return conexion.rollback(() => {
                                            console.error('Error al desactivar asignación:', error);
                                            res.redirect('/en-reparacion?error=Error al desactivar la asignación');
                                        });
                                    }
    
                                    // Actualizar inventario: pasar de reparación a descartado
                                    conexion.query(`
                                        UPDATE InventarioProducto SET
                                            cantidad_reparacion = cantidad_reparacion - 1,
                                            cantidad_descartada = cantidad_descartada + 1
                                        WHERE id_producto = ?
                                        AND cantidad_reparacion > 0
                                    `, [id_producto], (error) => {
                                        if (error) {
                                            return conexion.rollback(() => {
                                                console.error('Error al actualizar inventario:', error);
                                                res.redirect('/en-reparacion?error=Error al actualizar el inventario');
                                            });
                                        }
    
                                        // Registrar en bitácora
                                        conexion.query(`
                                            INSERT INTO BitacoraReparacion 
                                            (id_proceso, id_estado_anterior, id_estado_nuevo, id_empleado, observaciones)
                                            VALUES (?, ?, 14, ?, ?)`,
                                            [id_proceso, req.body.estado_actual, req.session.user.id_empleado, motivo],
                                            (error) => {
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
    
                                                    res.redirect('/en-reparacion?success=Equipo marcado como irreparable. Asignación desactivada y producto marcado como descartado.');
                                                });
                                            }
                                        );
                                    });
                                });
                            }
                        );
                    }
                );
            });
        });
    },


    actualizarInfo: (req, res) => {
        if (!req.session.user || req.session.user.rol !== 'Empleado') {
            return res.redirect('/login');
        }

        const id_proceso = req.params.id;
        const { acciones_realizadas, repuestos_utilizados, costo_estimado, observaciones } = req.body;

        if (!acciones_realizadas?.trim() || !repuestos_utilizados?.trim() || !costo_estimado) {
            return res.redirect(`/en-reparacion/?error=Todos los campos requeridos deben estar completos`);
        }

        conexion.query(
            `UPDATE ProcesoReparacion SET 
            acciones_realizadas = ?,
            repuestos_utilizados = ?,
            costo_estimado = ?,
            observaciones = ?
            WHERE id_proceso = ?`,
            [
                acciones_realizadas.trim(),
                repuestos_utilizados.trim(),
                parseFloat(costo_estimado),
                observaciones?.trim() || null,
                id_proceso
            ],
            (error) => {
                if (error) {
                    console.error('Error al actualizar información:', error);
                    return res.redirect(`/en-reparacion/${id_proceso}?error=Error al actualizar la información`);
                }
                res.redirect(`/en-reparacion/?success=Información actualizada correctamente`);
            }
        );
    }


};

module.exports = empleadoController;