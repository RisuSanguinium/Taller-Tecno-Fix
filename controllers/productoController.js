const conexion = require('../database/db');
const bcrypt = require('bcrypt');

const productoController = {
    listarProductos: (req, res) => {
        if (!req.session.user || req.session.user.rol !== 'Administrador') {
            return res.redirect('/login');
        }

        conexion.query(`
            SELECT p.*, c.nombre as categoria 
            FROM Producto p
            JOIN Categoria c ON p.id_categoria = c.id_categoria
            ORDER BY p.id_producto
        `, (error, productos) => {
            if (error) {
                console.error('Error al obtener productos:', error);
                return res.render('productos/lista', {
                    title: 'Lista de Productos - Tecno-Fix',
                    currentPage: 'productos',
                    productos: [],
                    error: 'Error al cargar la lista de productos'
                });
            }

            res.render('productos/lista', {
                title: 'Lista de Productos - Tecno-Fix',
                currentPage: 'productos',
                productos: productos || []
            });
        });
    },

    mostrarFormularioRegistro: (req, res) => {
        if (!req.session.user || req.session.user.rol !== 'Administrador') {
            return res.redirect('/login');
        }

        // Obtener categorías para el select
        conexion.query('SELECT * FROM Categoria', (error, categorias) => {
            if (error) {
                console.error('Error al obtener categorías:', error);
                return res.render('productos/registrar', {
                    title: 'Registrar Producto - Tecno-Fix',
                    currentPage: 'productos',
                    categorias: [],
                    error: 'Error al cargar las categorías'
                });
            }

            res.render('productos/registrar', {
                title: 'Registrar Producto - Tecno-Fix',
                currentPage: 'productos',
                categorias: categorias || []
            });
        });
    },

    registrarProducto: (req, res) => {
        if (!req.session.user || req.session.user.rol !== 'Administrador') {
            return res.redirect('/login');
        }

        const { nombre, descripcion, marca, modelo, numero_serie, id_categoria, fecha_compra, garantia_hasta, especificaciones } = req.body;

        conexion.query(
            `INSERT INTO Producto (
                nombre, descripcion, marca, modelo, numero_serie, 
                id_categoria, fecha_compra, garantia_hasta, especificaciones, activo
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
            [nombre, descripcion, marca, modelo, numero_serie, id_categoria, fecha_compra, garantia_hasta, especificaciones],
            (error, results) => {
                if (error) {
                    console.error('Error al registrar producto:', error);
                    
                    // Recargar categorías para el formulario
                    conexion.query('SELECT * FROM Categoria', (err, categorias) => {
                        return res.render('productos/registrar', {
                            title: 'Registrar Producto - Tecno-Fix',
                            currentPage: 'productos',
                            categorias: categorias || [],
                            error: 'Error al registrar el producto',
                            formData: req.body
                        });
                    });
                }

                res.redirect('/productos?success=Producto registrado exitosamente');
            }
        );
    },

    verProducto: (req, res) => {
        if (!req.session.user || req.session.user.rol !== 'Administrador') {
            return res.redirect('/login');
        }

        const idProducto = req.params.id;

        conexion.query(`
            SELECT p.*, c.nombre as categoria 
            FROM Producto p
            JOIN Categoria c ON p.id_categoria = c.id_categoria
            WHERE p.id_producto = ?
        `, [idProducto], (error, results) => {
            if (error || results.length === 0) {
                console.error('Error al obtener producto:', error);
                return res.redirect('/productos?error=Producto no encontrado');
            }

            const producto = results[0];
            
            res.render('productos/ver', {
                title: 'Detalles del Producto - Tecno-Fix',
                currentPage: 'productos',
                producto: producto
            });
        });
    },

    mostrarFormularioEdicion: (req, res) => {
        if (!req.session.user || req.session.user.rol !== 'Administrador') {
            return res.redirect('/login');
        }

        const idProducto = req.params.id;

        // Obtener el producto
        conexion.query('SELECT * FROM Producto WHERE id_producto = ?', [idProducto], (error, productoResults) => {
            if (error || productoResults.length === 0) {
                console.error('Error al obtener producto:', error);
                return res.redirect('/productos?error=Producto no encontrado');
            }

            // Obtener categorías
            conexion.query('SELECT * FROM Categoria', (error, categorias) => {
                if (error) {
                    console.error('Error al obtener categorías:', error);
                    return res.render('productos/editar', {
                        title: 'Editar Producto - Tecno-Fix',
                        currentPage: 'productos',
                        producto: productoResults[0],
                        categorias: [],
                        error: 'Error al cargar las categorías'
                    });
                }

                res.render('productos/editar', {
                    title: 'Editar Producto - Tecno-Fix',
                    currentPage: 'productos',
                    producto: productoResults[0],
                    categorias: categorias || []
                });
            });
        });
    },

    actualizarProducto: (req, res) => {
        if (!req.session.user || req.session.user.rol !== 'Administrador') {
            return res.redirect('/login');
        }

        const idProducto = req.params.id;
        const { nombre, descripcion, marca, modelo, numero_serie, id_categoria, fecha_compra, garantia_hasta, especificaciones, activo } = req.body;

        conexion.query(
            `UPDATE Producto SET 
                nombre = ?, 
                descripcion = ?, 
                marca = ?, 
                modelo = ?, 
                numero_serie = ?, 
                id_categoria = ?, 
                fecha_compra = ?, 
                garantia_hasta = ?, 
                especificaciones = ?, 
                activo = ?
            WHERE id_producto = ?`,
            [nombre, descripcion, marca, modelo, numero_serie, id_categoria, fecha_compra, garantia_hasta, especificaciones, activo ? 1 : 0, idProducto],
            (error) => {
                if (error) {
                    console.error('Error al actualizar producto:', error);
                    return res.redirect(`/productos/editar/${idProducto}?error=Error al actualizar producto`);
                }

                res.redirect(`/productos/ver/${idProducto}?success=Producto actualizado exitosamente`);
            }
        );
    },

    eliminarProducto: (req, res) => {
        if (!req.session.user || req.session.user.rol !== 'Administrador') {
            return res.redirect('/login');
        }

        const idProducto = req.params.id;

        // Primero verificar si el producto está en algún inventario
        conexion.query(
            'SELECT COUNT(*) as count FROM InventarioProducto WHERE id_producto = ?',
            [idProducto],
            (error, results) => {
                if (error) {
                    console.error('Error al verificar inventarios:', error);
                    return res.redirect('/productos?error=Error al verificar inventarios');
                }

                if (results[0].count > 0) {
                    return res.redirect('/productos?error=No se puede eliminar un producto que está en inventario');
                }

                // Eliminar producto
                conexion.query(
                    'DELETE FROM Producto WHERE id_producto = ?',
                    [idProducto],
                    (error) => {
                        if (error) {
                            console.error('Error al eliminar producto:', error);
                            return res.redirect('/productos?error=Error al eliminar producto');
                        }

                        res.redirect('/productos?success=Producto eliminado exitosamente');
                    }
                );
            }
        );
    },
    mostrarFormularioAsignacion: (req, res) => {
        if (!req.session.user || req.session.user.rol !== 'Administrador') {
            return res.redirect('/login');
        }
    
        const idProducto = req.params.id;
    
        // Obtener información del producto
        conexion.query('SELECT * FROM Producto WHERE id_producto = ?', [idProducto], (error, productoResults) => {
            if (error || productoResults.length === 0) {
                console.error('Error al obtener producto:', error);
                return res.redirect('/productos?error=Producto no encontrado');
            }
    
            // Obtener lista de clientes
            conexion.query('SELECT * FROM Cliente', (error, clientes) => {
                if (error) {
                    console.error('Error al obtener clientes:', error);
                    return res.render('productos/asignar', {
                        title: 'Asignar Producto - Tecno-Fix',
                        currentPage: 'productos',
                        producto: productoResults[0],
                        clientes: [],
                        error: 'Error al cargar la lista de clientes'
                    });
                }
    
                // Obtener lista de empleados (para seleccionar quien asigna)
                conexion.query('SELECT * FROM Empleado', (error, empleados) => {
                    if (error) {
                        console.error('Error al obtener empleados:', error);
                        return res.render('productos/asignar', {
                            title: 'Asignar Producto - Tecno-Fix',
                            currentPage: 'productos',
                            producto: productoResults[0],
                            clientes: clientes || [],
                            empleados: [],
                            error: 'Error al cargar la lista de empleados'
                        });
                    }
    
                    res.render('productos/asignar', {
                        title: 'Asignar Producto - Tecno-Fix',
                        currentPage: 'productos',
                        producto: productoResults[0],
                        clientes: clientes || [],
                        empleados: empleados || []
                    });
                });
            });
        });
    },
    
    // Método para procesar la asignación
    asignarProducto: (req, res) => {
        if (!req.session.user || req.session.user.rol !== 'Administrador') {
            return res.redirect('/login');
        }
    
        const idProducto = req.params.id;
        const { id_cliente, id_empleado_asignador, fecha_entrega, observaciones } = req.body;
    
        // Verificar disponibilidad del producto
        conexion.query(
            `SELECT ip.id_inventario, ip.cantidad_disponible 
             FROM InventarioProducto ip
             WHERE ip.id_producto = ? AND ip.cantidad_disponible > 0
             LIMIT 1`,
            [idProducto],
            (error, inventarioResults) => {
                if (error) {
                    console.error('Error al verificar disponibilidad:', error);
                    return res.redirect(`/productos/asignar/${idProducto}?error=Error al verificar disponibilidad`);
                }
    
                if (inventarioResults.length === 0) {
                    return res.redirect(`/productos/asignar/${idProducto}?error=No hay unidades disponibles de este producto`);
                }
    
                const idInventario = inventarioResults[0].id_inventario;
    
                // Registrar la asignación
                conexion.query(
                    `INSERT INTO Asignacion (
                        id_producto, id_cliente, id_empleado_asignador, id_inventario,
                        fecha_asignacion, fecha_entrega, observaciones, activa
                    ) VALUES (?, ?, ?, ?, NOW(), ?, ?, 1)`,
                    [idProducto, id_cliente, id_empleado_asignador, idInventario, fecha_entrega, observaciones],
                    (error, asignacionResults) => {
                        if (error) {
                            console.error('Error al registrar asignación:', error);
                            return res.redirect(`/productos/asignar/${idProducto}?error=Error al registrar asignación`);
                        }
    
                        // Actualizar inventario (reducir cantidad disponible)
                        conexion.query(
                            `UPDATE InventarioProducto 
                             SET cantidad_disponible = cantidad_disponible - 1 
                             WHERE id_inventario = ? AND id_producto = ?`,
                            [idInventario, idProducto],
                            (error) => {
                                if (error) {
                                    console.error('Error al actualizar inventario:', error);
                                    return res.redirect(`/productos/asignar/${idProducto}?error=Error al actualizar inventario`);
                                }
    
                                res.redirect(`/productos/ver/${idProducto}?success=Producto asignado exitosamente`);
                            }
                        );
                    }
                );
            }
        );
    }
};

module.exports = productoController;