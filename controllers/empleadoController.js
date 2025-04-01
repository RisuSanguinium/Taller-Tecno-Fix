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
};

module.exports = empleadoController;