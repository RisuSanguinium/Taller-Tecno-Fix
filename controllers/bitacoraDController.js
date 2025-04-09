const db = require('../database/db');
const PDFDocument = require('pdfkit');

const bitacoraDController = {
    mostrarBitacora: (req, res) => {
        if (!req.session.user || req.session.user.rol !== 'Administrador') {
            return res.redirect('/login');
        }

        // Consulta para obtener los últimos 30 días por defecto
        const fechaFin = new Date();
        const fechaInicio = new Date();
        fechaInicio.setDate(fechaInicio.getDate() - 30);

        // Obtener usuarios desactivados
        const queryUsuarios = `
            SELECT 
                u.id_usuario, 
                u.username, 
                u.email, 
                u.fecha_creacion, 
                u.ultimo_login, 
                r.nombre_rol as rol,
                CASE 
                    WHEN e.id_empleado IS NOT NULL THEN CONCAT(e.nombre, ' ', e.apellido)
                    WHEN c.id_cliente IS NOT NULL THEN CONCAT(c.nombre, ' ', c.apellido)
                    ELSE 'Administrador'
                END as nombre_completo,
                CASE 
                    WHEN e.id_empleado IS NOT NULL THEN 'Empleado'
                    WHEN c.id_cliente IS NOT NULL THEN 'Cliente'
                    ELSE 'Administrador'
                END as tipo_usuario
            FROM usuario u
            JOIN rol r ON u.id_rol = r.id_rol
            LEFT JOIN empleado e ON u.id_usuario = e.id_usuario
            LEFT JOIN cliente c ON u.id_usuario = c.id_usuario
            WHERE u.activo = 0
            ORDER BY u.ultimo_login DESC
        `;

        // Obtener productos desactivados
        const queryProductos = `
            SELECT 
                p.id_producto, 
                p.nombre, 
                p.marca, 
                p.modelo, 
                p.numero_serie, 
                p.fecha_compra, 
                p.garantia_hasta,
                c.nombre as categoria
            FROM producto p
            JOIN categoria c ON p.id_categoria = c.id_categoria
            WHERE p.activo = 0
            ORDER BY p.fecha_compra DESC
        `;

        // Ejecutar ambas consultas en paralelo
        Promise.all([
            new Promise((resolve, reject) => {
                db.query(queryUsuarios, (error, results) => {
                    if (error) reject(error);
                    else resolve(results);
                });
            }),
            new Promise((resolve, reject) => {
                db.query(queryProductos, (error, results) => {
                    if (error) reject(error);
                    else resolve(results);
                });
            })
        ]).then(([usuarios, productos]) => {
            res.render('bitacoraD/lista', {
                title: 'Bitácora de Desactivaciones',
                currentPage: 'bitacora-desactivaciones',
                usuarios: usuarios || [],
                productos: productos || [],
                fechaInicio: fechaInicio.toISOString().split('T')[0],
                fechaFin: fechaFin.toISOString().split('T')[0]
            });
        }).catch(error => {
            console.error(error);
            res.render('bitacoraD/lista', {
                title: 'Bitácora de Desactivaciones',
                currentPage: 'bitacora-desactivaciones',
                usuarios: [],
                productos: [],
                error: 'Error al cargar la bitácora de desactivaciones',
                fechaInicio: fechaInicio.toISOString().split('T')[0],
                fechaFin: fechaFin.toISOString().split('T')[0]
            });
        });
    },

    generarPDF: (req, res) => {
        if (!req.session.user || req.session.user.rol !== 'Administrador') {
            return res.redirect('/login');
        }

        // Obtener usuarios desactivados
        const queryUsuarios = `
            SELECT 
                u.id_usuario, 
                u.username, 
                u.email, 
                u.fecha_creacion, 
                u.ultimo_login, 
                r.nombre_rol as rol,
                CASE 
                    WHEN e.id_empleado IS NOT NULL THEN CONCAT(e.nombre, ' ', e.apellido)
                    WHEN c.id_cliente IS NOT NULL THEN CONCAT(c.nombre, ' ', c.apellido)
                    ELSE 'Administrador'
                END as nombre_completo,
                CASE 
                    WHEN e.id_empleado IS NOT NULL THEN 'Empleado'
                    WHEN c.id_cliente IS NOT NULL THEN 'Cliente'
                    ELSE 'Administrador'
                END as tipo_usuario
            FROM usuario u
            JOIN rol r ON u.id_rol = r.id_rol
            LEFT JOIN empleado e ON u.id_usuario = e.id_usuario
            LEFT JOIN cliente c ON u.id_usuario = c.id_usuario
            WHERE u.activo = 0
            ORDER BY u.ultimo_login DESC
        `;

        // Obtener productos desactivados
        const queryProductos = `
            SELECT 
                p.id_producto, 
                p.nombre, 
                p.marca, 
                p.modelo, 
                p.numero_serie, 
                p.fecha_compra, 
                p.garantia_hasta,
                c.nombre as categoria
            FROM producto p
            JOIN categoria c ON p.id_categoria = c.id_categoria
            WHERE p.activo = 0
            ORDER BY p.fecha_compra DESC
        `;

        Promise.all([
            new Promise((resolve, reject) => {
                db.query(queryUsuarios, (error, results) => {
                    if (error) reject(error);
                    else resolve(results);
                });
            }),
            new Promise((resolve, reject) => {
                db.query(queryProductos, (error, results) => {
                    if (error) reject(error);
                    else resolve(results);
                });
            })
        ]).then(([usuarios, productos]) => {
            // Crear el documento PDF
            const doc = new PDFDocument();
            const filename = `bitacora_desactivaciones_${new Date().toISOString().split('T')[0]}.pdf`;
            
            // Configurar los headers para el navegador
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
            
            // Pipe el PDF a la respuesta
            doc.pipe(res);

            // Agregar contenido al PDF
            doc.fontSize(20).text('Bitácora de Desactivaciones', {
                align: 'center'
            });
            doc.moveDown();
            doc.fontSize(12).text(`Generado el ${new Date().toLocaleDateString()}`, {
                align: 'center'
            });
            doc.moveDown(2);

            // Sección de usuarios desactivados
            doc.fontSize(16).text('Usuarios Desactivados', {
                underline: true
            });
            doc.moveDown();

            if (usuarios.length > 0) {
                // Tabla de usuarios
                let y = doc.y;
                const margin = 50;
                const rowHeight = 20;
                const headers = ['ID', 'Usuario', 'Nombre', 'Rol', 'Tipo', 'Último Login'];
                const widths = [40, 100, 120, 80, 80, 100];

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
                usuarios.forEach(usuario => {
                    y = doc.y + rowHeight;
                    
                    // ID
                    doc.text(usuario.id_usuario, margin, y, {
                        width: widths[0],
                        align: 'left'
                    });
                    
                    // Username
                    doc.text(usuario.username, margin + widths[0], y, {
                        width: widths[1],
                        align: 'left'
                    });
                    
                    // Nombre completo
                    doc.text(usuario.nombre_completo, margin + widths[0] + widths[1], y, {
                        width: widths[2],
                        align: 'left'
                    });
                    
                    // Rol
                    doc.text(usuario.rol, margin + widths[0] + widths[1] + widths[2], y, {
                        width: widths[3],
                        align: 'left'
                    });
                    
                    // Tipo usuario
                    doc.text(usuario.tipo_usuario, margin + widths[0] + widths[1] + widths[2] + widths[3], y, {
                        width: widths[4],
                        align: 'left'
                    });
                    
                    // Último login
                    doc.text(usuario.ultimo_login ? new Date(usuario.ultimo_login).toLocaleString() : 'Nunca', 
                        margin + widths[0] + widths[1] + widths[2] + widths[3] + widths[4], y, {
                        width: widths[5],
                        align: 'left'
                    });
                    
                    doc.moveDown();
                });
            } else {
                doc.text('No hay usuarios desactivados', { indent: 10 });
            }

            doc.moveDown(2);

            // Sección de productos desactivados
            doc.fontSize(16).text('Productos Desactivados', {
                underline: true
            });
            doc.moveDown();

            if (productos.length > 0) {
                // Tabla de productos
                let y = doc.y;
                const margin = 50;
                const rowHeight = 20;
                const headers = ['ID', 'Nombre', 'Marca', 'Modelo', 'N° Serie', 'Categoría', 'Fecha Compra'];
                const widths = [40, 100, 80, 80, 100, 80, 80];

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
                productos.forEach(producto => {
                    y = doc.y + rowHeight;
                    
                    // ID
                    doc.text(producto.id_producto, margin, y, {
                        width: widths[0],
                        align: 'left'
                    });
                    
                    // Nombre
                    doc.text(producto.nombre, margin + widths[0], y, {
                        width: widths[1],
                        align: 'left'
                    });
                    
                    // Marca
                    doc.text(producto.marca, margin + widths[0] + widths[1], y, {
                        width: widths[2],
                        align: 'left'
                    });
                    
                    // Modelo
                    doc.text(producto.modelo, margin + widths[0] + widths[1] + widths[2], y, {
                        width: widths[3],
                        align: 'left'
                    });
                    
                    // N° Serie
                    doc.text(producto.numero_serie || 'N/A', margin + widths[0] + widths[1] + widths[2] + widths[3], y, {
                        width: widths[4],
                        align: 'left'
                    });
                    
                    // Categoría
                    doc.text(producto.categoria, margin + widths[0] + widths[1] + widths[2] + widths[3] + widths[4], y, {
                        width: widths[5],
                        align: 'left'
                    });
                    
                    // Fecha Compra
                    doc.text(new Date(producto.fecha_compra).toLocaleDateString(), 
                        margin + widths[0] + widths[1] + widths[2] + widths[3] + widths[4] + widths[5], y, {
                        width: widths[6],
                        align: 'left'
                    });
                    
                    doc.moveDown();
                });
            } else {
                doc.text('No hay productos desactivados', { indent: 10 });
            }

            // Finalizar el PDF
            doc.end();
        }).catch(error => {
            console.error(error);
            res.status(500).send('Error al generar el PDF');
        });
    }
};

module.exports = bitacoraDController;