const bcrypt = require('bcrypt');
const conexion = require('../database/db');

const authController = {
    showLoginForm: (req, res) => {
        if (req.session.user) {
            return res.redirect('/');
        }
        res.render('auth/login', {
            title: 'Iniciar sesión - Tecno-Fix',
            currentPage: 'login'
        });
    },

    login: (req, res) => {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.render('auth/login', {
                title: 'Iniciar sesión - Tecno-Fix',
                error: 'Email y contraseña son requeridos',
                currentPage: 'login'
            });
        }
    
        // Consulta mejorada para obtener todos los datos necesarios
        const query = `
            SELECT u.id_usuario, u.password, u.id_rol,
                   COALESCE(e.nombre, c.nombre) AS nombre,
                   COALESCE(e.apellido, c.apellido) AS apellido,
                   COALESCE(e.id_empleado, NULL) AS id_empleado,
                   r.nombre_rol as rol
            FROM Usuario u
            LEFT JOIN Empleado e ON u.id_usuario = e.id_usuario
            LEFT JOIN Cliente c ON u.id_usuario = c.id_usuario
            JOIN Rol r ON u.id_rol = r.id_rol
            WHERE u.email = ? AND u.activo = 1
            LIMIT 1
        `;
        
        conexion.query(query, [email], async (error, results) => {
            try {
                if (error) {
                    console.error('Error en la consulta:', error);
                    throw error;
                }
    
                const user = results[0];
    
                if (!user) {
                    return res.render('auth/login', {
                        title: 'Iniciar sesión - Tecno-Fix',
                        error: 'Credenciales incorrectas',
                        currentPage: 'login'
                    });
                }
    
                const passwordMatch = await bcrypt.compare(password, user.password);
                
                if (!passwordMatch) {
                    return res.render('auth/login', {
                        title: 'Iniciar sesión - Tecno-Fix',
                        error: 'Credenciales incorrectas',
                        currentPage: 'login'
                    });
                }
    
                // Crear sesión con todos los datos necesarios
                req.session.user = {
                    id: user.id_usuario,
                    id_rol: user.id_rol,
                    nombre: user.nombre,
                    apellido: user.apellido,
                    rol: user.rol,
                    id_empleado: user.id_empleado || null // Añadimos el id_empleado si existe
                };
    
                // Guardar la sesión antes de redirigir
                req.session.save(err => {
                    if (err) {
                        console.error('Error al guardar sesión:', err);
                        return res.render('auth/login', {
                            title: 'Iniciar sesión - Tecno-Fix',
                            error: 'Error en el servidor',
                            currentPage: 'login'
                        });
                    }
                    res.redirect('/');
                });
    
            } catch (err) {
                console.error('Error en login:', err);
                res.render('auth/login', {
                    title: 'Iniciar sesión - Tecno-Fix',
                    error: 'Error en el servidor',
                    currentPage: 'login'
                });
            }
        });
    },

    logout: (req, res) => {
        req.session.destroy(err => {
            if (err) {
                console.error('Error al cerrar sesión:', err);
            }
            res.redirect('/login');
        });
    },

    showRegisterForm: (req, res) => {
        if (req.session.user) {
            return res.redirect('/');
        }
        res.render('auth/registro', {
            title: 'Registro - Tecno-Fix',
            currentPage: 'registro'
        });
    },

    register: (req, res) => {
        const { nombre, apellido, email, password, confirmPassword } = req.body;
        
        // Validaciones básicas
        if (password !== confirmPassword) {
            return res.render('auth/registro', {
                title: 'Registro - Tecno-Fix',
                error: 'Las contraseñas no coinciden',
                currentPage: 'registro',
                formData: { nombre, apellido, email }
            });
        }
    
        // Verificar si el email ya está registrado
        conexion.query('SELECT * FROM Usuario WHERE email = ?', [email], (error, users) => {
            if (error) {
                console.error('Error al verificar email:', error);
                return res.render('auth/registro', {
                    title: 'Registro - Tecno-Fix',
                    error: 'Error en el servidor',
                    currentPage: 'registro',
                    formData: { nombre, apellido, email }
                });
            }
    
            if (users.length > 0) {
                return res.render('auth/registro', {
                    title: 'Registro - Tecno-Fix',
                    error: 'El email ya está registrado',
                    currentPage: 'registro',
                    formData: { nombre, apellido, email }
                });
            }
    
            // Hash de la contraseña
            bcrypt.hash(password, 10, (err, hashedPassword) => {
                if (err) {
                    console.error('Error al hashear contraseña:', err);
                    return res.render('auth/registro', {
                        title: 'Registro - Tecno-Fix',
                        error: 'Error en el servidor',
                        currentPage: 'registro',
                        formData: { nombre, apellido, email }
                    });
                }
    
                // Obtener el ID del rol de Cliente (id_rol = 3 según tu base de datos)
                const clienteRolId = 3;
    
                // Crear el usuario en la base de datos
                conexion.query(
                    'INSERT INTO Usuario (username, email, password, id_rol, activo) VALUES (?, ?, ?, ?, 1)',
                    [email.split('@')[0], email, hashedPassword, clienteRolId],
                    (error, userResults) => {
                        if (error) {
                            console.error('Error al crear usuario:', error);
                            return res.render('auth/registro', {
                                title: 'Registro - Tecno-Fix',
                                error: 'Error en el servidor',
                                currentPage: 'registro',
                                formData: { nombre, apellido, email }
                            });
                        }
    
                        // Obtener la fecha actual en formato YYYY-MM-DD
                        const fechaIngreso = new Date().toISOString().split('T')[0];
    
                        // Crear el registro del cliente con la fecha de ingreso
                        conexion.query(
                            'INSERT INTO Cliente (id_usuario, nombre, apellido, fecha_ingreso) VALUES (?, ?, ?, ?)',
                            [userResults.insertId, nombre, apellido, fechaIngreso],
                            (error) => {
                                if (error) {
                                    console.error('Error al crear cliente:', error);
                                    return res.render('auth/registro', {
                                        title: 'Registro - Tecno-Fix',
                                        error: 'Error en el servidor',
                                        currentPage: 'registro',
                                        formData: { nombre, apellido, email }
                                    });
                                }
    
                                // Redirigir al login con mensaje de éxito
                                res.redirect('/login?registro=exitoso');
                            }
                        );
                    }
                );
            });
        });
    }
};

module.exports = authController;