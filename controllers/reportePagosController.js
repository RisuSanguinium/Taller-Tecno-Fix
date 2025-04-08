const db = require('../database/db');
const PDFDocument = require('pdfkit');

const reportePagosController = {
    mostrarReporte: (req, res) => {
        if (!req.session.user || req.session.user.rol !== 'Administrador') {
            return res.redirect('/login');
        }

        // Consulta para obtener los últimos 30 días por defecto
        const fechaFin = new Date();
        const fechaInicio = new Date();
        fechaInicio.setDate(fechaInicio.getDate() - 30);

        const query = `
            SELECT 
                pr.id_proceso,
                pr.fecha_fin as fecha_pago,
                pr.costo_final,
                s.id_solicitud,
                p.nombre as producto_nombre,
                p.numero_serie,
                c.nombre as cliente_nombre,
                c.apellido as cliente_apellido,
                e.nombre as tecnico_nombre,
                e.apellido as tecnico_apellido,
                u.username as usuario_registro
            FROM procesoreparacion pr
            JOIN solicitudsoporte s ON pr.id_solicitud = s.id_solicitud
            JOIN producto p ON s.id_producto = p.id_producto
            JOIN cliente c ON s.id_cliente = c.id_cliente
            JOIN empleado e ON pr.id_empleado_asignado = e.id_empleado
            JOIN usuario u ON c.id_usuario = u.id_usuario
            WHERE pr.pagado = 1
            AND pr.fecha_fin BETWEEN ? AND ?
            ORDER BY pr.fecha_fin DESC
        `;

        db.query(query, [fechaInicio, fechaFin], (error, pagos) => {
            if (error) {
                console.error(error);
                return res.render('reportePagos/lista', {
                    title: 'Reporte de Pagos de Reparaciones',
                    currentPage: 'reportes-pagos',
                    pagos: [],
                    error: 'Error al cargar el reporte de pagos',
                    fechaInicio: fechaInicio.toISOString().split('T')[0],
                    fechaFin: fechaFin.toISOString().split('T')[0]
                });
            }

            res.render('reportePagos/lista', {
                title: 'Reporte de Pagos de Reparaciones',
                currentPage: 'reportes-pagos',
                pagos: pagos || [],
                fechaInicio: fechaInicio.toISOString().split('T')[0],
                fechaFin: fechaFin.toISOString().split('T')[0]
            });
        });
    },

    filtrarReporte: (req, res) => {
        if (!req.session.user || req.session.user.rol !== 'Administrador') {
            return res.redirect('/login');
        }

        const { fechaInicio, fechaFin } = req.body;

        const query = `
            SELECT 
                pr.id_proceso,
                pr.fecha_fin as fecha_pago,
                pr.costo_final,
                s.id_solicitud,
                p.nombre as producto_nombre,
                p.numero_serie,
                c.nombre as cliente_nombre,
                c.apellido as cliente_apellido,
                e.nombre as tecnico_nombre,
                e.apellido as tecnico_apellido,
                u.username as usuario_registro
            FROM procesoreparacion pr
            JOIN solicitudsoporte s ON pr.id_solicitud = s.id_solicitud
            JOIN producto p ON s.id_producto = p.id_producto
            JOIN cliente c ON s.id_cliente = c.id_cliente
            JOIN empleado e ON pr.id_empleado_asignado = e.id_empleado
            JOIN usuario u ON c.id_usuario = u.id_usuario
            WHERE pr.pagado = 1
            AND pr.fecha_fin BETWEEN ? AND ?
            ORDER BY pr.fecha_fin DESC
        `;

        db.query(query, [fechaInicio, fechaFin], (error, pagos) => {
            if (error) {
                console.error(error);
                return res.render('reportePagos/lista', {
                    title: 'Reporte de Pagos de Reparaciones',
                    currentPage: 'reportes-pagos',
                    pagos: [],
                    error: 'Error al filtrar el reporte',
                    fechaInicio,
                    fechaFin
                });
            }

            res.render('reportePagos/lista', {
                title: 'Reporte de Pagos de Reparaciones',
                currentPage: 'reportes-pagos',
                pagos: pagos || [],
                fechaInicio,
                fechaFin,
                success: `Mostrando pagos del ${fechaInicio} al ${fechaFin}`
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
                pr.id_proceso,
                pr.fecha_fin as fecha_pago,
                pr.costo_final,
                s.id_solicitud,
                p.nombre as producto_nombre,
                p.numero_serie,
                c.nombre as cliente_nombre,
                c.apellido as cliente_apellido,
                e.nombre as tecnico_nombre,
                e.apellido as tecnico_apellido,
                u.username as usuario_registro
            FROM procesoreparacion pr
            JOIN solicitudsoporte s ON pr.id_solicitud = s.id_solicitud
            JOIN producto p ON s.id_producto = p.id_producto
            JOIN cliente c ON s.id_cliente = c.id_cliente
            JOIN empleado e ON pr.id_empleado_asignado = e.id_empleado
            JOIN usuario u ON c.id_usuario = u.id_usuario
            WHERE pr.pagado = 1
            AND pr.fecha_fin BETWEEN ? AND ?
            ORDER BY pr.fecha_fin DESC
        `;

        db.query(query, [fechaInicio, fechaFin], (error, pagos) => {
            if (error) {
                console.error(error);
                return res.status(500).send('Error al generar el PDF');
            }

            // Crear el documento PDF
            const doc = new PDFDocument();
            const filename = `reporte_pagos_${fechaInicio}_a_${fechaFin}.pdf`;
            
            // Configurar los headers para el navegador
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
            
            // Pipe el PDF a la respuesta
            doc.pipe(res);

            // Agregar contenido al PDF
            doc.fontSize(20).text('Reporte de Pagos de Reparaciones', {
                align: 'center'
            });
            doc.moveDown();
            doc.fontSize(12).text(`Del ${fechaInicio} al ${fechaFin}`, {
                align: 'center'
            });
            doc.moveDown();
            doc.fontSize(12).text(`Total de pagos: ${pagos.length}`, {
                align: 'center'
            });
            doc.moveDown(2);

            // Tabla de pagos
            let y = doc.y;
            const margin = 50;
            const rowHeight = 20;
            const headers = ['Fecha Pago', 'Producto', 'Cliente', 'Técnico', 'Costo', 'Solicitud'];
            const widths = [80, 120, 100, 100, 60, 60];

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
            let total = 0;
            
            pagos.forEach(pago => {
                y = doc.y + rowHeight;
                total += parseFloat(pago.costo_final);
                
                // Fecha
                doc.text(new Date(pago.fecha_pago).toLocaleDateString(), margin, y, {
                    width: widths[0],
                    align: 'left'
                });
                
                // Producto (nombre + serie)
                doc.text(`${pago.producto_nombre}\nSerie: ${pago.numero_serie}`, margin + widths[0], y, {
                    width: widths[1],
                    align: 'left'
                });
                
                // Cliente
                doc.text(`${pago.cliente_nombre} ${pago.cliente_apellido}`, margin + widths[0] + widths[1], y, {
                    width: widths[2],
                    align: 'left'
                });
                
                // Técnico
                doc.text(`${pago.tecnico_nombre} ${pago.tecnico_apellido}`, margin + widths[0] + widths[1] + widths[2], y, {
                    width: widths[3],
                    align: 'left'
                });
                
                // Costo
                doc.text(`$${parseFloat(pago.costo_final).toFixed(2)}`, margin + widths[0] + widths[1] + widths[2] + widths[3], y, {
                    width: widths[4],
                    align: 'right'
                });
                
                // Solicitud
                doc.text(pago.id_solicitud.toString(), margin + widths[0] + widths[1] + widths[2] + widths[3] + widths[4], y, {
                    width: widths[5],
                    align: 'center'
                });
                
                doc.moveDown();
            });

            // Total
            doc.moveDown();
            doc.font('Helvetica-Bold')
               .text(`Total Recaudado: $${total.toFixed(2)}`, margin, doc.y, {
                   align: 'right'
               });

            // Finalizar el PDF
            doc.end();
        });
    }
};

module.exports = reportePagosController;