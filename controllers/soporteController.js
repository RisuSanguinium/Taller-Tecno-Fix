const conexion = require('../database/db');

const soporteController = {
    mostrarFormulario: (req, res) => {
        if (!req.session.user || req.session.user.rol !== 'Cliente') {
            return res.redirect('/login');
        }

        // Obtener equipos asignados al cliente
        conexion.query(`
            SELECT p.* 
            FROM Producto p
            JOIN Asignacion a ON p.id_producto = a.id_producto
            WHERE a.id_cliente = ? AND a.activa = 1
        `, [req.session.user.id], (error, equipos) => {
            if (error) {
                console.error('Error al obtener equipos:', error);
                return res.render('soporte/nueva-solicitud', {
                    title: 'Solicitar Soporte - Tecno-Fix',
                    currentPage: 'solicitar-soporte',
                    equipos: [],
                    error: 'Error al cargar los equipos'
                });
            }

            res.render('soporte/nueva-solicitud', {
                title: 'Solicitar Soporte - Tecno-Fix',
                currentPage: 'solicitar-soporte',
                equipos: equipos || []
            });
        });
    },

    crearSolicitud: (req, res) => {
        if (!req.session.user || req.session.user.rol !== 'Cliente') {
            return res.redirect('/login');
        }

        const { id_producto, tipo_problema, urgencia, descripcion_problema } = req.body;
        const id_cliente = req.session.user.id;

        // Validar que el producto pertenece al cliente (si se seleccionó)
        if (id_producto) {
            conexion.query(`
                SELECT 1 FROM Asignacion 
                WHERE id_producto = ? AND id_cliente = ? AND activa = 1
            `, [id_producto, id_cliente], (error, results) => {
                if (error || results.length === 0) {
                    return res.render('soporte/nueva-solicitud', {
                        title: 'Solicitar Soporte - Tecno-Fix',
                        currentPage: 'solicitar-soporte',
                        error: 'El equipo seleccionado no está asignado a usted',
                        equipos: []
                    });
                }

                crearLaSolicitud();
            });
        } else {
            crearLaSolicitud();
        }

        function crearLaSolicitud() {
            // Estado inicial: Pendiente (id_estado = 6 según tu DB)
            const id_estado = 6;
            
            conexion.query(`
                INSERT INTO SolicitudSoporte 
                (id_cliente, id_producto, id_estado, descripcion_problema, urgencia, fecha_solicitud)
                VALUES (?, ?, ?, ?, ?, NOW())
            `, [id_cliente, id_producto || null, id_estado, descripcion_problema, urgencia], (error, results) => {
                if (error) {
                    console.error('Error al crear solicitud:', error);
                    return res.render('soporte/nueva-solicitud', {
                        title: 'Solicitar Soporte - Tecno-Fix',
                        currentPage: 'solicitar-soporte',
                        error: 'Error al enviar la solicitud',
                        equipos: []
                    });
                }

                res.render('soporte/nueva-solicitud', {
                    title: 'Solicitar Soporte - Tecno-Fix',
                    currentPage: 'solicitar-soporte',
                    success: 'Solicitud enviada correctamente. Nos contactaremos con usted pronto.',
                    equipos: []
                });
            });
        }
    }
};

module.exports = soporteController;