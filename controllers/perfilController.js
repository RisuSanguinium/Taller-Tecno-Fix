const db = require('../database/db');
const bcrypt = require('bcrypt');

const perfilController = {
    mostrarPerfil: (req, res) => {
        if (!req.session.user) {
            return res.redirect('/login');
        }

        const usuario = req.session.user;
        let query, params;

        if (usuario.rol === 'Administrador') {
            query = `
                SELECT u.*, e.* 
                FROM usuario u
                LEFT JOIN empleado e ON u.id_usuario = e.id_usuario
                WHERE u.id_usuario = ?
            `;
            params = [usuario.id];
        } else if (usuario.rol === 'Empleado') {
            query = `
                SELECT u.*, e.* 
                FROM usuario u
                JOIN empleado e ON u.id_usuario = e.id_usuario
                WHERE u.id_usuario = ?
            `;
            params = [usuario.id];
        } else if (usuario.rol === 'Cliente') {
            query = `
                SELECT u.*, c.* 
                FROM usuario u
                JOIN cliente c ON u.id_usuario = c.id_usuario
                WHERE u.id_usuario = ?
            `;
            params = [usuario.id];
        }

        db.query(query, params, (error, results) => {
            if (error || results.length === 0) {
                console.error('Error al obtener perfil:', error);
                return res.render('error', { message: 'Error al cargar el perfil' });
            }

            const perfil = results[0];
            res.render('perfil/mostrar', {
                title: 'Mi Perfil',
                currentPage: 'perfil',
                perfil: perfil,
                usuario: usuario
            });
        });
    },

    mostrarFormularioEdicion: (req, res) => {
        if (!req.session.user) {
            return res.redirect('/login');
        }

        const usuario = req.session.user;
        let query, params;

        if (usuario.rol === 'Administrador') {
            query = `
                SELECT u.*, e.* 
                FROM usuario u
                LEFT JOIN empleado e ON u.id_usuario = e.id_usuario
                WHERE u.id_usuario = ?
            `;
            params = [usuario.id];
        } else if (usuario.rol === 'Empleado') {
            query = `
                SELECT u.*, e.* 
                FROM usuario u
                JOIN empleado e ON u.id_usuario = e.id_usuario
                WHERE u.id_usuario = ?
            `;
            params = [usuario.id];
        } else if (usuario.rol === 'Cliente') {
            query = `
                SELECT u.*, c.* 
                FROM usuario u
                JOIN cliente c ON u.id_usuario = c.id_usuario
                WHERE u.id_usuario = ?
            `;
            params = [usuario.id];
        }

        db.query(query, params, (error, results) => {
            if (error || results.length === 0) {
                console.error('Error al obtener perfil para edición:', error);
                return res.render('error', { message: 'Error al cargar el perfil' });
            }

            const perfil = results[0];
            res.render('perfil/editar', {
                title: 'Editar Perfil',
                currentPage: 'perfil',
                perfil: perfil,
                usuario: usuario
            });
        });
    },

    actualizarPerfil: (req, res) => {
        if (!req.session.user) {
            return res.redirect('/login');
        }

        const usuario = req.session.user;
        const { email, password, confirmPassword } = req.body;

        // Validar contraseña si se está cambiando
        if (password && password !== confirmPassword) {
            return res.render('perfil/editar', {
                title: 'Editar Perfil',
                currentPage: 'perfil',
                perfil: req.body,
                usuario: usuario,
                error: 'Las contraseñas no coinciden'
            });
        }

        // Actualizar datos comunes de usuario
        const updateUsuario = (callback) => {
            let query, params;

            if (password) {
                bcrypt.hash(password, 10, (err, hashedPassword) => {
                    if (err) {
                        console.error('Error al hashear contraseña:', err);
                        return callback(err);
                    }

                    query = 'UPDATE usuario SET email = ?, password = ? WHERE id_usuario = ?';
                    params = [email, hashedPassword, usuario.id];
                    db.query(query, params, callback);
                });
            } else {
                query = 'UPDATE usuario SET email = ? WHERE id_usuario = ?';
                params = [email, usuario.id];
                db.query(query, params, callback);
            }
        };

        // Actualizar datos específicos según rol
        const updateEspecifico = (callback) => {
            if (usuario.rol === 'Empleado') {
                const { nombre, apellido, cedula, telefono, departamento, especialidad } = req.body;
                const query = `
                    UPDATE empleado 
                    SET nombre = ?, apellido = ?, cedula = ?, telefono = ?, departamento = ?, especialidad = ?
                    WHERE id_usuario = ?
                `;
                const params = [nombre, apellido, cedula, telefono, departamento, especialidad, usuario.id];
                db.query(query, params, callback);
            } else if (usuario.rol === 'Cliente') {
                const { nombre, apellido, cedula, telefono, departamento, puesto, fecha_ingreso } = req.body;
                const query = `
                    UPDATE cliente 
                    SET nombre = ?, apellido = ?, cedula = ?, telefono = ?, departamento = ?, puesto = ?, fecha_ingreso = ?
                    WHERE id_usuario = ?
                `;
                const params = [nombre, apellido, cedula, telefono, departamento, puesto, fecha_ingreso, usuario.id];
                db.query(query, params, callback);
            } else {
                // Administrador puede no tener datos específicos
                callback(null);
            }
        };

        // Ejecutar actualizaciones en secuencia
        updateUsuario((error) => {
            if (error) {
                console.error('Error al actualizar usuario:', error);
                return res.render('perfil/editar', {
                    title: 'Editar Perfil',
                    currentPage: 'perfil',
                    perfil: req.body,
                    usuario: usuario,
                    error: 'Error al actualizar los datos'
                });
            }

            updateEspecifico((error) => {
                if (error) {
                    console.error('Error al actualizar datos específicos:', error);
                    return res.render('perfil/editar', {
                        title: 'Editar Perfil',
                        currentPage: 'perfil',
                        perfil: req.body,
                        usuario: usuario,
                        error: 'Error al actualizar los datos específicos'
                    });
                }

                // Actualizar datos en sesión
                req.session.user.email = email;
                if (usuario.rol === 'Empleado' || usuario.rol === 'Cliente') {
                    req.session.user.nombre = req.body.nombre;
                    req.session.user.apellido = req.body.apellido;
                }

                res.redirect('/perfil?success=Perfil actualizado correctamente');
            });
        });
    }
};

module.exports = perfilController;