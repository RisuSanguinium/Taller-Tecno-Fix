const conexion = require('../database/db');

const inventarioController = {
    listarInventarios: (req, res) => {
        if (!req.session.user || req.session.user.rol !== 'Administrador') {
            return res.redirect('/login');
        }
    
        conexion.query(`
            SELECT i.*, 
                   e.nombre as nombre_responsable, 
                   e.apellido as apellido_responsable,
                   u.activo as empleado_activo
            FROM Inventario i
            LEFT JOIN Empleado e ON i.responsable = e.id_empleado
            LEFT JOIN Usuario u ON e.id_usuario = u.id_usuario
            ORDER BY i.id_inventario
        `, (error, inventarios) => {
            if (error) {
                console.error('Error al obtener inventarios:', error);
                return res.render('inventarios/lista', {
                    title: 'Lista de Inventarios - Tecno-Fix',
                    currentPage: 'inventarios',
                    inventarios: [],
                    error: 'Error al cargar la lista de inventarios'
                });
            }
    
            res.render('inventarios/lista', {
                title: 'Lista de Inventarios - Tecno-Fix',
                currentPage: 'inventarios',
                inventarios: inventarios || []
            });
        });
    },

    mostrarFormularioRegistro: (req, res) => {
        if (!req.session.user || req.session.user.rol !== 'Administrador') {
            return res.redirect('/login');
        }
    
        // Obtener lista de empleados activos para seleccionar responsable
        conexion.query(`
            SELECT e.id_empleado, e.nombre, e.apellido 
            FROM Empleado e
            JOIN Usuario u ON e.id_usuario = u.id_usuario
            WHERE u.activo = 1
        `, (error, empleados) => {
            if (error) {
                console.error('Error al obtener empleados:', error);
                return res.render('inventarios/registrar', {
                    title: 'Registrar Inventario - Tecno-Fix',
                    currentPage: 'inventarios',
                    empleados: [],
                    error: 'Error al cargar la lista de empleados'
                });
            }
    
            res.render('inventarios/registrar', {
                title: 'Registrar Inventario - Tecno-Fix',
                currentPage: 'inventarios',
                empleados: empleados || []
            });
        });
    },

    registrarInventario: (req, res) => {
        if (!req.session.user || req.session.user.rol !== 'Administrador') {
            return res.redirect('/login');
        }

        const { nombre, descripcion, ubicacion, responsable } = req.body;

        conexion.query(
            'INSERT INTO Inventario (nombre, descripcion, ubicacion, responsable) VALUES (?, ?, ?, ?)',
            [nombre, descripcion, ubicacion, responsable || null],
            (error) => {
                if (error) {
                    console.error('Error al registrar inventario:', error);
                    
                    // Obtener empleados nuevamente para mostrar el formulario
                    conexion.query('SELECT id_empleado, nombre, apellido FROM Empleado', (err, empleados) => {
                        return res.render('inventarios/registrar', {
                            title: 'Registrar Inventario - Tecno-Fix',
                            currentPage: 'inventarios',
                            empleados: empleados || [],
                            error: 'Error al registrar el inventario',
                            formData: req.body
                        });
                    });
                }

                res.redirect('/inventarios?success=Inventario registrado exitosamente');
            }
        );
    },

    verInventario: (req, res) => {
        if (!req.session.user || req.session.user.rol !== 'Administrador') {
            return res.redirect('/login');
        }

        const idInventario = req.params.id;

        // Obtener información del inventario
        conexion.query(`
            SELECT i.*, e.nombre as nombre_responsable, e.apellido as apellido_responsable 
            FROM Inventario i
            LEFT JOIN Empleado e ON i.responsable = e.id_empleado
            WHERE i.id_inventario = ?
        `, [idInventario], (error, inventarioResults) => {
            if (error || inventarioResults.length === 0) {
                console.error('Error al obtener inventario:', error);
                return res.redirect('/inventarios?error=Inventario no encontrado');
            }

            const inventario = inventarioResults[0];

            // Obtener productos asociados a este inventario
            conexion.query(`
                SELECT ip.*, p.nombre as nombre_producto, p.marca, p.modelo, c.nombre as categoria
                FROM InventarioProducto ip
                JOIN Producto p ON ip.id_producto = p.id_producto
                JOIN Categoria c ON p.id_categoria = c.id_categoria
                WHERE ip.id_inventario = ?
            `, [idInventario], (error, productos) => {
                if (error) {
                    console.error('Error al obtener productos del inventario:', error);
                    return res.render('inventarios/ver', {
                        title: 'Detalles del Inventario - Tecno-Fix',
                        currentPage: 'inventarios',
                        inventario: inventario,
                        productos: [],
                        error: 'Error al cargar los productos del inventario'
                    });
                }

                res.render('inventarios/ver', {
                    title: 'Detalles del Inventario - Tecno-Fix',
                    currentPage: 'inventarios',
                    inventario: inventario,
                    productos: productos || []
                });
            });
        });
    },

    mostrarFormularioEdicion: (req, res) => {
        if (!req.session.user || req.session.user.rol !== 'Administrador') {
            return res.redirect('/login');
        }
    
        const idInventario = req.params.id;
    
        // Obtener información del inventario
        conexion.query('SELECT * FROM Inventario WHERE id_inventario = ?', [idInventario], (error, inventarioResults) => {
            if (error || inventarioResults.length === 0) {
                console.error('Error al obtener inventario:', error);
                return res.redirect('/inventarios?error=Inventario no encontrado');
            }
    
            const inventario = inventarioResults[0];
    
            // Obtener lista de empleados activos para seleccionar responsable
            conexion.query(`
                SELECT e.id_empleado, e.nombre, e.apellido 
                FROM Empleado e
                JOIN Usuario u ON e.id_usuario = u.id_usuario
                WHERE u.activo = 1
            `, (error, empleados) => {
                if (error) {
                    console.error('Error al obtener empleados:', error);
                    return res.render('inventarios/editar', {
                        title: 'Editar Inventario - Tecno-Fix',
                        currentPage: 'inventarios',
                        inventario: inventario,
                        empleados: [],
                        error: 'Error al cargar la lista de empleados'
                    });
                }
    
                res.render('inventarios/editar', {
                    title: 'Editar Inventario - Tecno-Fix',
                    currentPage: 'inventarios',
                    inventario: inventario,
                    empleados: empleados || []
                });
            });
        });
    },

    actualizarInventario: (req, res) => {
        if (!req.session.user || req.session.user.rol !== 'Administrador') {
            return res.redirect('/login');
        }

        const idInventario = req.params.id;
        const { nombre, descripcion, ubicacion, responsable } = req.body;

        conexion.query(
            `UPDATE Inventario SET 
                nombre = ?, 
                descripcion = ?, 
                ubicacion = ?, 
                responsable = ?
            WHERE id_inventario = ?`,
            [nombre, descripcion, ubicacion, responsable || null, idInventario],
            (error) => {
                if (error) {
                    console.error('Error al actualizar inventario:', error);
                    return res.redirect(`/inventarios/editar/${idInventario}?error=Error al actualizar inventario`);
                }

                res.redirect(`/inventarios/ver/${idInventario}?success=Inventario actualizado exitosamente`);
            }
        );
    },

    eliminarInventario: (req, res) => {
        if (!req.session.user || req.session.user.rol !== 'Administrador') {
            return res.redirect('/login');
        }
    
        const idInventario = req.params.id;
    
        // Iniciar transacción
        conexion.beginTransaction(err => {
            if (err) {
                console.error('Error al iniciar transacción:', err);
                return res.redirect('/inventarios?error=Error al procesar la solicitud');
            }
    
            // 1. Eliminar todos los productos asociados en InventarioProducto
            conexion.query(
                'DELETE FROM InventarioProducto WHERE id_inventario = ?',
                [idInventario],
                (error) => {
                    if (error) {
                        return conexion.rollback(() => {
                            console.error('Error al eliminar productos del inventario:', error);
                            res.redirect('/inventarios?error=Error al eliminar productos asociados al inventario');
                        });
                    }
    
                    // 2. Actualizar asignaciones para quitar la referencia al inventario
                    conexion.query(
                        'UPDATE Asignacion SET id_inventario = NULL WHERE id_inventario = ?',
                        [idInventario],
                        (error) => {
                            if (error) {
                                return conexion.rollback(() => {
                                    console.error('Error al actualizar asignaciones:', error);
                                    res.redirect('/inventarios?error=Error al actualizar asignaciones asociadas');
                                });
                            }
    
                            // 3. Eliminar el inventario
                            conexion.query(
                                'DELETE FROM Inventario WHERE id_inventario = ?',
                                [idInventario],
                                (error) => {
                                    if (error) {
                                        return conexion.rollback(() => {
                                            console.error('Error al eliminar inventario:', error);
                                            res.redirect('/inventarios?error=Error al eliminar inventario');
                                        });
                                    }
    
                                    // Confirmar transacción
                                    conexion.commit(err => {
                                        if (err) {
                                            return conexion.rollback(() => {
                                                console.error('Error al confirmar transacción:', err);
                                                res.redirect('/inventarios?error=Error al confirmar la operación');
                                            });
                                        }
    
                                        res.redirect('/inventarios?success=Inventario eliminado exitosamente');
                                    });
                                }
                            );
                        }
                    );
                }
            );
        });
    },

    // Métodos adicionales para gestión de productos en inventario
    mostrarFormularioAgregarProducto: (req, res) => {
        if (!req.session.user || req.session.user.rol !== 'Administrador') {
            return res.redirect('/login');
        }

        const idInventario = req.params.id;

        // Obtener información del inventario
        conexion.query('SELECT * FROM Inventario WHERE id_inventario = ?', [idInventario], (error, inventarioResults) => {
            if (error || inventarioResults.length === 0) {
                console.error('Error al obtener inventario:', error);
                return res.redirect('/inventarios?error=Inventario no encontrado');
            }

            // Obtener lista de productos disponibles
            conexion.query(`
                SELECT p.*, c.nombre as categoria 
                FROM Producto p
                JOIN Categoria c ON p.id_categoria = c.id_categoria
                WHERE p.activo = 1
            `, (error, productos) => {
                if (error) {
                    console.error('Error al obtener productos:', error);
                    return res.render('inventarios/agregar-producto', {
                        title: 'Agregar Producto al Inventario - Tecno-Fix',
                        currentPage: 'inventarios',
                        inventario: inventarioResults[0],
                        productos: [],
                        error: 'Error al cargar la lista de productos'
                    });
                }

                res.render('inventarios/agregar-producto', {
                    title: 'Agregar Producto al Inventario - Tecno-Fix',
                    currentPage: 'inventarios',
                    inventario: inventarioResults[0],
                    productos: productos || []
                });
            });
        });
    },

    agregarProducto: (req, res) => {
        if (!req.session.user || req.session.user.rol !== 'Administrador') {
            return res.redirect('/login');
        }
    
        const idInventario = req.params.id;
        const { id_producto, cantidad } = req.body;
    
        // Verificar si el producto ya existe en el inventario
        conexion.query(
            'SELECT * FROM InventarioProducto WHERE id_inventario = ? AND id_producto = ?',
            [idInventario, id_producto],
            (error, results) => {
                if (error) {
                    console.error('Error al verificar producto:', error);
                    return res.redirect(`/inventarios/ver/${idInventario}?error=Error al verificar producto`);
                }
    
                if (results.length > 0) {
                    // Actualizar cantidad y cantidad_disponible si el producto ya existe
                    conexion.query(
                        'UPDATE InventarioProducto SET cantidad = cantidad + ?, cantidad_disponible = cantidad_disponible + ? WHERE id_inventario = ? AND id_producto = ?',
                        [cantidad, cantidad, idInventario, id_producto],
                        (error) => {
                            if (error) {
                                console.error('Error al actualizar producto:', error);
                                return res.redirect(`/inventarios/ver/${idInventario}?error=Error al actualizar cantidad del producto`);
                            }
    
                            res.redirect(`/inventarios/ver/${idInventario}?success=Producto actualizado en el inventario`);
                        }
                    );
                } else {
                    // Insertar nuevo producto en el inventario
                    conexion.query(
                        'INSERT INTO InventarioProducto (id_inventario, id_producto, cantidad, cantidad_disponible) VALUES (?, ?, ?, ?)',
                        [idInventario, id_producto, cantidad, cantidad],
                        (error) => {
                            if (error) {
                                console.error('Error al agregar producto:', error);
                                return res.redirect(`/inventarios/ver/${idInventario}?error=Error al agregar producto al inventario`);
                            }
    
                            res.redirect(`/inventarios/ver/${idInventario}?success=Producto agregado al inventario`);
                        }
                    );
                }
            }
        );
    },

    agregarCantidad: (req, res) => {
        if (!req.session.user || req.session.user.rol !== 'Administrador') {
            return res.redirect('/login');
        }

        const idInventario = req.params.id;
        const { id_producto, cantidad } = req.body;

        conexion.query(
            'UPDATE InventarioProducto SET cantidad = cantidad + ?, cantidad_disponible = cantidad_disponible + ? WHERE id_inventario = ? AND id_producto = ?',
            [cantidad, cantidad, idInventario, id_producto],
            (error) => {
                if (error) {
                    console.error('Error al agregar cantidad:', error);
                    return res.redirect(`/inventarios/ver/${idInventario}?error=Error al agregar cantidad`);
                }

                res.redirect(`/inventarios/ver/${idInventario}?success=Cantidad agregada exitosamente`);
            }
        );
    },

    // Método para quitar cantidad de un producto existente
    quitarCantidad: (req, res) => {
        if (!req.session.user || req.session.user.rol !== 'Administrador') {
            return res.redirect('/login');
        }

        const idInventario = req.params.id;
        const { id_producto, cantidad } = req.body;

        // Primero verificar que no se quite más de lo disponible
        conexion.query(
            'SELECT cantidad, cantidad_disponible FROM InventarioProducto WHERE id_inventario = ? AND id_producto = ?',
            [idInventario, id_producto],
            (error, results) => {
                if (error || results.length === 0) {
                    console.error('Error al verificar cantidad:', error);
                    return res.redirect(`/inventarios/ver/${idInventario}?error=Error al verificar cantidad disponible`);
                }

                const producto = results[0];
                if (producto.cantidad - cantidad < 1) {
                    return res.redirect(`/inventarios/ver/${idInventario}?error=No se puede dejar menos de 1 producto`);
                }

                if (producto.cantidad_disponible < cantidad) {
                    return res.redirect(`/inventarios/ver/${idInventario}?error=No hay suficiente cantidad disponible`);
                }

                // Actualizar cantidades
                conexion.query(
                    'UPDATE InventarioProducto SET cantidad = cantidad - ?, cantidad_disponible = cantidad_disponible - ? WHERE id_inventario = ? AND id_producto = ?',
                    [cantidad, cantidad, idInventario, id_producto],
                    (error) => {
                        if (error) {
                            console.error('Error al quitar cantidad:', error);
                            return res.redirect(`/inventarios/ver/${idInventario}?error=Error al quitar cantidad`);
                        }

                        res.redirect(`/inventarios/ver/${idInventario}?success=Cantidad quitada exitosamente`);
                    }
                );
            }
        );
    },

    // Método para eliminar un producto del inventario
    eliminarProducto: (req, res) => {
        if (!req.session.user || req.session.user.rol !== 'Administrador') {
            return res.redirect('/login');
        }

        const idInventario = req.params.id;
        const idProducto = req.params.idProducto;

        // Verificar si el producto está asignado o en reparación
        conexion.query(
            'SELECT cantidad_asignada, cantidad_reparacion FROM InventarioProducto WHERE id_inventario = ? AND id_producto = ?',
            [idInventario, idProducto],
            (error, results) => {
                if (error || results.length === 0) {
                    console.error('Error al verificar producto:', error);
                    return res.redirect(`/inventarios/ver/${idInventario}?error=Error al verificar producto`);
                }

                const producto = results[0];
                if (producto.cantidad_asignada > 0 || producto.cantidad_reparacion > 0) {
                    return res.redirect(`/inventarios/ver/${idInventario}?error=No se puede eliminar un producto con asignaciones o en reparación`);
                }

                // Eliminar el producto del inventario
                conexion.query(
                    'DELETE FROM InventarioProducto WHERE id_inventario = ? AND id_producto = ?',
                    [idInventario, idProducto],
                    (error) => {
                        if (error) {
                            console.error('Error al eliminar producto:', error);
                            return res.redirect(`/inventarios/ver/${idInventario}?error=Error al eliminar producto`);
                        }

                        res.redirect(`/inventarios/ver/${idInventario}?success=Producto eliminado del inventario`);
                    }
                );
            }
        );
    }
};

module.exports = inventarioController;