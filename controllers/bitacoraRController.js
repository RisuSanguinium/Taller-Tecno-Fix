const db = require('../database/db');
const PDFDocument = require('pdfkit');

const bitacoraRController = {
    mostrarBitacora: (req, res) => {
        if (!req.session.user || req.session.user.rol !== 'Administrador') {
            return res.redirect('/login');
        }
    
        const fechaFin = new Date();
        const fechaInicio = new Date();
        fechaInicio.setDate(fechaInicio.getDate() - 30);
        
        // Ajustar para cubrir todo el día
        fechaInicio.setHours(0, 0, 0, 0);
        fechaFin.setHours(23, 59, 59, 999);
    
        const query = `
            SELECT 
                br.id_bitacora,
                br.fecha_modificacion,
                br.observaciones,
                pr.id_proceso,
                s.id_solicitud,
                p.id_producto,
                p.nombre as producto_nombre,
                p.numero_serie,
                c.id_cliente,
                c.nombre as cliente_nombre,
                c.apellido as cliente_apellido,
                e.id_empleado,
                e.nombre as empleado_nombre,
                e.apellido as empleado_apellido,
                ea.nombre_estado as estado_anterior,
                en.nombre_estado as estado_nuevo,
                u.username as usuario_modificacion
            FROM bitacorareparacion br
            JOIN procesoreparacion pr ON br.id_proceso = pr.id_proceso
            JOIN solicitudsoporte s ON pr.id_solicitud = s.id_solicitud
            JOIN producto p ON s.id_producto = p.id_producto
            JOIN cliente c ON s.id_cliente = c.id_cliente
            JOIN empleado e ON br.id_empleado = e.id_empleado
            JOIN estado ea ON br.id_estado_anterior = ea.id_estado
            JOIN estado en ON br.id_estado_nuevo = en.id_estado
            JOIN usuario u ON e.id_usuario = u.id_usuario
            WHERE br.fecha_modificacion BETWEEN ? AND ?
            ORDER BY br.fecha_modificacion DESC
        `;
    
        db.query(query, [fechaInicio, fechaFin], (error, registros) => {
            if (error) {
                console.error('Error en bitácora:', error);
                return res.render('bitacoraR/lista', {
                    title: 'Bitácora de Reparaciones',
                    currentPage: 'bitacora-reparacion',
                    registros: [],
                    error: 'Error al cargar la bitácora',
                    fechaInicio: fechaInicio.toISOString().split('T')[0],
                    fechaFin: fechaFin.toISOString().split('T')[0]
                });
            }
    
            res.render('bitacoraR/lista', {
                title: 'Bitácora de Reparaciones',
                currentPage: 'bitacora-reparacion',
                registros: registros,
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
            SELECT 
                br.id_bitacora,
                br.fecha_modificacion,
                br.observaciones,
                pr.id_proceso,
                s.id_solicitud,
                p.id_producto,
                p.nombre as producto_nombre,
                p.numero_serie,
                c.id_cliente,
                c.nombre as cliente_nombre,
                c.apellido as cliente_apellido,
                e.id_empleado,
                e.nombre as empleado_nombre,
                e.apellido as empleado_apellido,
                ea.nombre_estado as estado_anterior,
                en.nombre_estado as estado_nuevo,
                u.username as usuario_modificacion
            FROM bitacorareparacion br
            JOIN procesoreparacion pr ON br.id_proceso = pr.id_proceso
            JOIN solicitudsoporte s ON pr.id_solicitud = s.id_solicitud
            JOIN producto p ON s.id_producto = p.id_producto
            JOIN cliente c ON s.id_cliente = c.id_cliente
            JOIN empleado e ON br.id_empleado = e.id_empleado
            JOIN estado ea ON br.id_estado_anterior = ea.id_estado
            JOIN estado en ON br.id_estado_nuevo = en.id_estado
            JOIN usuario u ON e.id_usuario = u.id_usuario
            WHERE br.fecha_modificacion BETWEEN ? AND ?
            ORDER BY br.fecha_modificacion DESC
        `;

        db.query(query, [fechaInicio, fechaFin], (error, registros) => {
            if (error) {
                console.error(error);
                return res.render('bitacoraR/lista', {
                    title: 'Bitácora de Reparaciones',
                    currentPage: 'bitacora-reparacion',
                    registros: [],
                    error: 'Error al filtrar la bitácora',
                    fechaInicio,
                    fechaFin
                });
            }

            res.render('bitacoraR/lista', {
                title: 'Bitácora de Reparaciones',
                currentPage: 'bitacora-reparacion',
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
            SELECT 
                br.id_bitacora,
                br.fecha_modificacion,
                br.observaciones,
                pr.id_proceso,
                s.id_solicitud,
                p.id_producto,
                p.nombre as producto_nombre,
                p.numero_serie,
                c.id_cliente,
                c.nombre as cliente_nombre,
                c.apellido as cliente_apellido,
                e.id_empleado,
                e.nombre as empleado_nombre,
                e.apellido as empleado_apellido,
                ea.nombre_estado as estado_anterior,
                en.nombre_estado as estado_nuevo,
                u.username as usuario_modificacion
            FROM bitacorareparacion br
            JOIN procesoreparacion pr ON br.id_proceso = pr.id_proceso
            JOIN solicitudsoporte s ON pr.id_solicitud = s.id_solicitud
            JOIN producto p ON s.id_producto = p.id_producto
            JOIN cliente c ON s.id_cliente = c.id_cliente
            JOIN empleado e ON br.id_empleado = e.id_empleado
            JOIN estado ea ON br.id_estado_anterior = ea.id_estado
            JOIN estado en ON br.id_estado_nuevo = en.id_estado
            JOIN usuario u ON e.id_usuario = u.id_usuario
            WHERE br.fecha_modificacion BETWEEN ? AND ?
            ORDER BY br.fecha_modificacion DESC
        `;

        db.query(query, [fechaInicio, fechaFin], (error, registros) => {
            if (error) {
                console.error(error);
                return res.status(500).send('Error al generar el PDF');
            }

            const doc = new PDFDocument();
            const filename = `bitacora_reparaciones_${fechaInicio}_a_${fechaFin}.pdf`;
            
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
            
            doc.pipe(res);

            // Encabezado del PDF
            doc.fontSize(20).text('Bitácora de Reparaciones', {
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
            const headers = ['Fecha', 'Producto', 'Cliente', 'Técnico', 'Estado Anterior', 'Estado Nuevo', 'Usuario', 'Observaciones'];
            const widths = [80, 120, 100, 100, 80, 80, 80, 120];

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
                
                // Producto
                doc.text(`${registro.producto_nombre}\nSerie: ${registro.numero_serie || 'N/A'}`, margin + widths[0], y, {
                    width: widths[1],
                    align: 'left'
                });
                
                // Cliente
                doc.text(`${registro.cliente_nombre} ${registro.cliente_apellido}`, margin + widths[0] + widths[1], y, {
                    width: widths[2],
                    align: 'left'
                });
                
                // Técnico
                doc.text(`${registro.empleado_nombre} ${registro.empleado_apellido}`, margin + widths[0] + widths[1] + widths[2], y, {
                    width: widths[3],
                    align: 'left'
                });
                
                // Estado anterior
                doc.text(registro.estado_anterior, margin + widths[0] + widths[1] + widths[2] + widths[3], y, {
                    width: widths[4],
                    align: 'left'
                });
                
                // Estado nuevo
                doc.text(registro.estado_nuevo, margin + widths[0] + widths[1] + widths[2] + widths[3] + widths[4], y, {
                    width: widths[5],
                    align: 'left'
                });
                
                // Usuario
                doc.text(registro.usuario_modificacion, margin + widths[0] + widths[1] + widths[2] + widths[3] + widths[4] + widths[5], y, {
                    width: widths[6],
                    align: 'left'
                });
                
                // Observaciones
                doc.text(registro.observaciones || 'N/A', margin + widths[0] + widths[1] + widths[2] + widths[3] + widths[4] + widths[5] + widths[6], y, {
                    width: widths[7],
                    align: 'left'
                });
                
                doc.moveDown();
            });

            doc.end();
        });
    }
};

module.exports = bitacoraRController;