const db = require('../database/db');
const PDFDocument = require('pdfkit');

const bitacoraController = {
    mostrarBitacora: (req, res) => {
        if (!req.session.user || req.session.user.rol !== 'Administrador') {
            return res.redirect('/login');
        }

        // Consulta para obtener los últimos 30 días por defecto
        const fechaFin = new Date();
        const fechaInicio = new Date();
        fechaInicio.setDate(fechaInicio.getDate() - 30);

        const query = `
            SELECT ba.*, 
                   a.id_producto, p.nombre as producto_nombre,
                   c.nombre as cliente_nombre, c.apellido as cliente_apellido,
                   e.nombre as empleado_nombre, e.apellido as empleado_apellido,
                   ea.nombre_estado as estado_anterior, en.nombre_estado as estado_nuevo,
                   u.username as usuario_modificacion
            FROM bitacoraasignacion ba
            JOIN asignacion a ON ba.id_asignacion = a.id_asignacion
            JOIN producto p ON a.id_producto = p.id_producto
            JOIN cliente c ON a.id_cliente = c.id_cliente
            JOIN empleado e ON a.id_empleado_asignador = e.id_empleado
            JOIN estado ea ON ba.id_estado_anterior = ea.id_estado
            JOIN estado en ON ba.id_estado_nuevo = en.id_estado
            JOIN usuario u ON ba.id_usuario_modificacion = u.id_usuario
            WHERE ba.fecha_modificacion BETWEEN ? AND ?
            ORDER BY ba.fecha_modificacion DESC
        `;

        db.query(query, [fechaInicio, fechaFin], (error, registros) => {
            if (error) {
                console.error(error);
                return res.render('bitacoraA/lista', {
                    title: 'Bitácora de Asignaciones',
                    currentPage: 'bitacora',
                    registros: [],
                    error: 'Error al cargar la bitácora',
                    fechaInicio: fechaInicio.toISOString().split('T')[0],
                    fechaFin: fechaFin.toISOString().split('T')[0]
                });
            }

            res.render('bitacoraA/lista', {
                title: 'Bitácora de Asignaciones',
                currentPage: 'bitacora',
                registros: registros || [],
                fechaInicio: fechaInicio.toISOString().split('T')[0],
                fechaFin: fechaFin.toISOString().split('T')[0]
            });
        });
    },

    filtrarBitacora: (req, res) => {
        if (!req.session.user || req.session.user.rol !== 'Administrador') {
            return res.redirect('/login');
        }

        const { fechaInicio, fechaFin } = req.body;

        const query = `
            SELECT ba.*, 
                   a.id_producto, p.nombre as producto_nombre,
                   c.nombre as cliente_nombre, c.apellido as cliente_apellido,
                   e.nombre as empleado_nombre, e.apellido as empleado_apellido,
                   ea.nombre_estado as estado_anterior, en.nombre_estado as estado_nuevo,
                   u.username as usuario_modificacion
            FROM bitacoraasignacion ba
            JOIN asignacion a ON ba.id_asignacion = a.id_asignacion
            JOIN producto p ON a.id_producto = p.id_producto
            JOIN cliente c ON a.id_cliente = c.id_cliente
            JOIN empleado e ON a.id_empleado_asignador = e.id_empleado
            JOIN estado ea ON ba.id_estado_anterior = ea.id_estado
            JOIN estado en ON ba.id_estado_nuevo = en.id_estado
            JOIN usuario u ON ba.id_usuario_modificacion = u.id_usuario
            WHERE ba.fecha_modificacion BETWEEN ? AND ?
            ORDER BY ba.fecha_modificacion DESC
        `;

        db.query(query, [fechaInicio, fechaFin], (error, registros) => {
            if (error) {
                console.error(error);
                return res.render('bitacoraA/lista', {
                    title: 'Bitácora de Asignaciones',
                    currentPage: 'bitacora',
                    registros: [],
                    error: 'Error al filtrar la bitácora',
                    fechaInicio,
                    fechaFin
                });
            }

            res.render('bitacoraA/lista', {
                title: 'Bitácora de Asignaciones',
                currentPage: 'bitacora',
                registros: registros || [],
                fechaInicio,
                fechaFin,
                success: `Mostrando registros del ${fechaInicio} al ${fechaFin}`
            });
        });
    },

    generarPDF: (req, res) => {
        if (!req.session.user || req.session.user.rol !== 'Administrador') {
            return res.redirect('/login');
        }

        const { fechaInicio, fechaFin } = req.query;

        const query = `
            SELECT ba.*, 
                   a.id_producto, p.nombre as producto_nombre, p.numero_serie,
                   c.nombre as cliente_nombre, c.apellido as cliente_apellido,
                   e.nombre as empleado_nombre, e.apellido as empleado_apellido,
                   ea.nombre_estado as estado_anterior, en.nombre_estado as estado_nuevo,
                   u.username as usuario_modificacion
            FROM bitacoraasignacion ba
            JOIN asignacion a ON ba.id_asignacion = a.id_asignacion
            JOIN producto p ON a.id_producto = p.id_producto
            JOIN cliente c ON a.id_cliente = c.id_cliente
            JOIN empleado e ON a.id_empleado_asignador = e.id_empleado
            JOIN estado ea ON ba.id_estado_anterior = ea.id_estado
            JOIN estado en ON ba.id_estado_nuevo = en.id_estado
            JOIN usuario u ON ba.id_usuario_modificacion = u.id_usuario
            WHERE ba.fecha_modificacion BETWEEN ? AND ?
            ORDER BY ba.fecha_modificacion DESC
        `;

        db.query(query, [fechaInicio, fechaFin], (error, registros) => {
            if (error) {
                console.error(error);
                return res.status(500).send('Error al generar el PDF');
            }

            // Crear el documento PDF
            const doc = new PDFDocument();
            const filename = `bitacora_asignaciones_${fechaInicio}_a_${fechaFin}.pdf`;
            
            // Configurar los headers para el navegador
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
            
            // Pipe el PDF a la respuesta
            doc.pipe(res);

            // Agregar contenido al PDF
            doc.fontSize(20).text('Bitácora de Asignaciones', {
                align: 'center'
            });
            doc.moveDown();
            doc.fontSize(12).text(`Del ${fechaInicio} al ${fechaFin}`, {
                align: 'center'
            });
            doc.moveDown(2);

            // Tabla de registros
            let y = doc.y;
            const margin = 50;
            const rowHeight = 20;
            const headers = ['Fecha', 'Producto', 'Cliente', 'Estado Anterior', 'Estado Nuevo', 'Usuario'];
            const widths = [80, 120, 100, 80, 80, 80];

            // Encabezados de la tabla
            doc.font('Helvetica-Bold');
            headers.forEach((header, i) => {
                doc.text(header, margin + widths.slice(0, i).reduce((a, b) => a + b, 0), y, {
                    width: widths[i],
                    align: 'left'
                });
            });
            doc.moveDown();

            // Línea divisoria
            doc.strokeColor('#000000').lineWidth(1)
               .moveTo(margin, doc.y)
               .lineTo(550, doc.y)
               .stroke();

            // Contenido de la tabla
            doc.font('Helvetica');
            registros.forEach(registro => {
                y = doc.y + rowHeight;
                
                // Fecha
                doc.text(new Date(registro.fecha_modificacion).toLocaleString(), margin, y, {
                    width: widths[0],
                    align: 'left'
                });
                
                // Producto (nombre + serie)
                doc.text(`${registro.producto_nombre}\nSerie: ${registro.numero_serie}`, margin + widths[0], y, {
                    width: widths[1],
                    align: 'left'
                });
                
                // Cliente
                doc.text(`${registro.cliente_nombre} ${registro.cliente_apellido}`, margin + widths[0] + widths[1], y, {
                    width: widths[2],
                    align: 'left'
                });
                
                // Estado anterior
                doc.text(registro.estado_anterior, margin + widths[0] + widths[1] + widths[2], y, {
                    width: widths[3],
                    align: 'left'
                });
                
                // Estado nuevo
                doc.text(registro.estado_nuevo, margin + widths[0] + widths[1] + widths[2] + widths[3], y, {
                    width: widths[4],
                    align: 'left'
                });
                
                // Usuario
                doc.text(registro.usuario_modificacion, margin + widths[0] + widths[1] + widths[2] + widths[3] + widths[4], y, {
                    width: widths[5],
                    align: 'left'
                });
                
                doc.moveDown();
            });

            // Finalizar el PDF
            doc.end();
        });
    }
};

module.exports = bitacoraController;