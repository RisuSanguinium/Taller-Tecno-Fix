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

        // Consulta a la base de datos
        const query = `
            SELECT u.id_usuario, u.password, e.nombre, e.apellido, r.nombre_rol as rol
            FROM Usuario u
            LEFT JOIN Empleado e ON u.id_usuario = e.id_usuario
            LEFT JOIN Rol r ON u.id_rol = r.id_rol
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
                        error: 'Usuario incorrectas',
                        currentPage: 'login'
                    });
                }

                //El desencriptador de la contraseña y de paso compara si es la misma
                const passwordMatch = await bcrypt.compare(password, user.password);
                
                if (!passwordMatch) {
                    return res.render('auth/login', {
                        title: 'Iniciar sesión - Tecno-Fix',
                        error: 'Contraseña incorrectas',
                        currentPage: 'login'
                    });
                }

                // Crear sesión
                req.session.user = {
                    id: user.id_usuario,
                    nombre: user.nombre,
                    apellido: user.apellido,
                    rol: user.rol
                };

                res.redirect('/');

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
    }
};

module.exports = authController;