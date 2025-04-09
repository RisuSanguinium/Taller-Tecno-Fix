const db = require('../database/db');
const { validationResult } = require('express-validator');

const productoController = {
    
    listarProductos: (req, res) => {
        if (!req.session.user || req.session.user.rol !== 'Administrador') {
            return res.redirect('/login');
        }
        const query = `
            SELECT p.*, c.nombre as categoria_nombre 
            FROM producto p
            LEFT JOIN categoria c ON p.id_categoria = c.id_categoria
            WHERE p.activo = 1
        `;

        db.query(query, (error, productos) => {
            if (error) {
                console.error(error);
                return res.redirect('/productos?error=Error al obtener la lista de productos');
            }

            res.render('productos/lista', {
                title: 'Lista de Productos',
                productos: productos || [],
                currentPage: 'productos',
                success: req.query.success,
                error: req.query.error
            });
        });
    },

    // Mostrar formulario de registro
    mostrarFormularioRegistro: (req, res) => {
        if (!req.session.user || req.session.user.rol !== 'Administrador') {
            return res.redirect('/login');
        }
        db.query('SELECT * FROM categoria', (error, categorias) => {
            if (error) {
                console.error(error);
                return res.redirect('/productos?error=Error al cargar el formulario de registro');
            }

            res.render('productos/registrar', {
                title: 'Registrar Nuevo Producto',
                categorias: categorias || [],
                formData: req.session.formData,
                currentPage: 'productos'
            });

            // Limpiar los datos del formulario de la sesión después de mostrarlos
            req.session.formData = null;
        });
    },

    // Registrar un nuevo producto
    registrarProducto: (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            req.session.formData = req.body;
            return res.redirect('/productos/registrar?error=' + errors.array()[0].msg);
        }
        if (!req.session.user || req.session.user.rol !== 'Administrador') {
            return res.redirect('/login');
        }
    
        const {
            id_categoria,
            nombre,
            descripcion,
            marca,
            modelo,
            numero_serie,
            especificaciones,
            fecha_compra,
            garantia_hasta
        } = req.body;
    
        // Función para generar un número de serie único
        const generarNumeroSerieUnico = (baseNumeroSerie, callback) => {
            let intento = 1;
            let numeroSerieActual = baseNumeroSerie;
            
            const verificarYGenerar = () => {
                db.query(
                    'SELECT id_producto FROM producto WHERE numero_serie = ?', 
                    [numeroSerieActual],
                    (error, results) => {
                        if (error) {
                            return callback(error);
                        }
    
                        if (results.length === 0) {
                            return callback(null, numeroSerieActual);
                        } else {
                            intento++;
                            numeroSerieActual = `${baseNumeroSerie}-${intento}`;
                            verificarYGenerar();
                        }
                    }
                );
            };
    
            verificarYGenerar();
        };
    
        // Generamos un número de serie único
        generarNumeroSerieUnico(numero_serie, (error, numeroSerieUnico) => {
            if (error) {
                console.error(error);
                req.session.formData = req.body;
                return res.redirect('/productos/registrar?error=Error al generar número de serie único');
            }
    
            // Insertar el producto con el número de serie único
            const query = `
                INSERT INTO producto (
                    id_categoria, nombre, descripcion, marca, modelo, 
                    numero_serie, especificaciones, fecha_compra, garantia_hasta
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
    
            db.query(query, [
                id_categoria, 
                nombre, 
                descripcion, 
                marca, 
                modelo,
                numeroSerieUnico,
                especificaciones, 
                fecha_compra || null, 
                garantia_hasta || null
            ], (error, results) => {
                if (error) {
                    console.error(error);
                    req.session.formData = req.body;
                    return res.redirect('/productos/registrar?error=Error al registrar el producto');
                }
    
                res.redirect('/productos?success=Producto registrado exitosamente');
            });
        });
    },

    // Ver detalles de un producto
    verProducto: (req, res) => {
        const { id } = req.params;
        const productoQuery = `
            SELECT p.*, c.nombre as categoria_nombre 
            FROM producto p
            LEFT JOIN categoria c ON p.id_categoria = c.id_categoria
            WHERE p.id_producto = ? AND p.activo = 1
        `;
        if (!req.session.user || req.session.user.rol !== 'Administrador') {
            return res.redirect('/login');
        }

        db.query(productoQuery, [id], (error, productos) => {
            if (error) {
                console.error(error);
                return res.redirect('/productos?error=Error al obtener los detalles del producto');
            }

            if (!productos || productos.length === 0) {
                return res.redirect('/productos?error=Producto no encontrado');
            }

            const producto = productos[0];

            // Obtenemos las asignaciones
            db.query(`
                SELECT a.*, c.nombre as cliente_nombre, c.apellido as cliente_apellido,
                       e.nombre as empleado_nombre, e.apellido as empleado_apellido
                FROM asignacion a
                JOIN cliente c ON a.id_cliente = c.id_cliente
                LEFT JOIN empleado e ON a.id_empleado_asignador = e.id_empleado
                WHERE a.id_producto = ? AND a.activa = 1
            `, [id], (error, asignaciones) => {
                if (error) {
                    console.error(error);
                    return res.redirect('/productos?error=Error al obtener las asignaciones del producto');
                }

                // Obtenemos el inventario
                db.query(`
                    SELECT i.*, ip.cantidad, ip.cantidad_disponible, ip.cantidad_asignada
                    FROM inventarioproducto ip
                    JOIN inventario i ON ip.id_inventario = i.id_inventario
                    WHERE ip.id_producto = ?
                `, [id], (error, inventario) => {
                    if (error) {
                        console.error(error);
                        return res.redirect('/productos?error=Error al obtener el inventario del producto');
                    }

                    res.render('productos/ver', {
                        title: 'Detalles del Producto',
                        producto,
                        asignaciones: asignaciones || [],
                        inventario: (inventario && inventario[0]) || null,
                        currentPage: 'productos',
                        success: req.query.success,
                        error: req.query.error
                    });
                });
            });
        });
    },

    // Mostrar formulario de edición
    mostrarFormularioEdicion: (req, res) => {
        const { id } = req.params;
        if (!req.session.user || req.session.user.rol !== 'Administrador') {
            return res.redirect('/login');
        }

        //Obtenemos el producto
        db.query('SELECT * FROM producto WHERE id_producto = ?', [id], (error, productos) => {
            if (error) {
                console.error(error);
                return res.redirect('/productos?error=Error al cargar el formulario de edición');
            }

            if (!productos || productos.length === 0) {
                return res.redirect('/productos?error=Producto no encontrado');
            }

            // Obtenemos las categorías
            db.query('SELECT * FROM categoria', (error, categorias) => {
                if (error) {
                    console.error(error);
                    return res.redirect('/productos?error=Error al cargar las categorías');
                }

                res.render('productos/editar', {
                    title: 'Editar Producto',
                    producto: productos[0],
                    categorias: categorias || [],
                    currentPage: 'productos'
                });
            });
        });
    },

    // Actualizar un producto
    actualizarProducto: (req, res) => {
        const { id } = req.params;
        const {
            id_categoria,
            nombre,
            descripcion,
            marca,
            modelo,
            numero_serie,
            especificaciones,
            fecha_compra,
            garantia_hasta
        } = req.body;

        if (!req.session.user || req.session.user.rol !== 'Administrador') {
            return res.redirect('/login');
        }
        // Verificamos si el número de serie ya existe en otro producto
        db.query(
            'SELECT id_producto FROM producto WHERE numero_serie = ? AND id_producto != ?',
            [numero_serie, id],
            (error, existing) => {
                if (error) {
                    console.error(error);
                    return res.redirect(`/productos/editar/${id}?error=Error al verificar número de serie`);
                }

                if (existing && existing.length > 0) {
                    return res.redirect(`/productos/editar/${id}?error=El número de serie ya está registrado en otro producto`);
                }

                // Si no existe, procedemos a actualizar
                const query = `
                    UPDATE producto SET 
                        id_categoria = ?, nombre = ?, descripcion = ?, marca = ?, modelo = ?,
                        numero_serie = ?, especificaciones = ?, fecha_compra = ?, garantia_hasta = ?
                    WHERE id_producto = ?
                `;

                db.query(query, [
                    id_categoria, nombre, descripcion, marca, modelo,
                    numero_serie, especificaciones, fecha_compra || null, garantia_hasta || null, id
                ], (error, results) => {
                    if (error) {
                        console.error(error);
                        return res.redirect(`/productos/editar/${id}?error=Error al actualizar el producto`);
                    }

                    res.redirect(`/productos/ver/${id}?success=Producto actualizado exitosamente`);
                });
            }
        );
    },

    // Eliminar un producto
    eliminarProducto: (req, res) => {
        const { id } = req.params;
        if (!req.session.user || req.session.user.rol !== 'Administrador') {
            return res.redirect('/login');
        }

        db.beginTransaction(err => {
            if (err) {
                console.error(err);
                return res.redirect('/productos?error=Error al iniciar transacción');
            }

            // Verificar si el producto está asignado
            db.query(
                'SELECT id_asignacion FROM asignacion WHERE id_producto = ? AND activa = 1',
                [id],
                (error, asignaciones) => {
                    if (error) {
                        return db.rollback(() => {
                            console.error(error);
                            res.redirect('/productos?error=Error al verificar asignaciones');
                        });
                    }

                    if (asignaciones && asignaciones.length > 0) {
                        return db.rollback(() => {
                            res.redirect('/productos?error=No se puede eliminar el producto porque está asignado actualmente');
                        });
                    }

                    // Eliminar de inventarioproducto
                    db.query(
                        'DELETE FROM inventarioproducto WHERE id_producto = ?',
                        [id],
                        (error, results) => {
                            if (error) {
                                return db.rollback(() => {
                                    console.error(error);
                                    res.redirect('/productos?error=Error al eliminar el producto del inventario');
                                });
                            }

                            // Marcar producto como inactivo
                            db.query(
                                'UPDATE producto SET activo = 0 WHERE id_producto = ?',
                                [id],
                                (error, results) => {
                                    if (error) {
                                        return db.rollback(() => {
                                            console.error(error);
                                            res.redirect('/productos?error=Error al eliminar el producto');
                                        });
                                    }

                                    db.commit(err => {
                                        if (err) {
                                            return db.rollback(() => {
                                                console.error(err);
                                                res.redirect('/productos?error=Error al confirmar los cambios');
                                            });
                                        }

                                        res.redirect('/productos?success=Producto eliminado exitosamente');
                                    });
                                }
                            );
                        }
                    );
                }
            );
        });
    },

    // Mostrar formulario de asignación
    mostrarFormularioAsignacion: (req, res) => {
        const { id } = req.params;
        if (!req.session.user || req.session.user.rol !== 'Administrador') {
            return res.redirect('/login');
        }

        // Verificamos que el producto existe y está activo
        db.query(
            'SELECT * FROM producto WHERE id_producto = ? AND activo = 1',
            [id],
            (error, productos) => {
                if (error) {
                    console.error(error);
                    return res.redirect('/productos?error=Error al verificar producto');
                }

                if (!productos || productos.length === 0) {
                    return res.redirect('/productos?error=Producto no encontrado o inactivo');
                }

                const producto = productos[0];

                // Verificamos el inventario
                db.query(`
                    SELECT ip.*, i.nombre as inventario_nombre
                    FROM inventarioproducto ip
                    JOIN inventario i ON ip.id_inventario = i.id_inventario
                    WHERE ip.id_producto = ? AND ip.cantidad_disponible > 0
                `, [id], (error, inventario) => {
                    if (error) {
                        console.error(error);
                        return res.redirect(`/productos/ver/${id}?error=Error al verificar inventario`);
                    }

                    if (!inventario || inventario.length === 0) {
                        return res.redirect(`/productos/ver/${id}?error=El producto no está disponible para asignación o no pertenece a un inventario`);
                    }

                    // Obtenemos los clientes
                    db.query(`
                        SELECT c.* 
                        FROM cliente c
                        JOIN usuario u ON c.id_usuario = u.id_usuario
                        WHERE u.activo = 1
                    `, (error, clientes) => {
                        if (error) {
                            console.error(error);
                            return res.redirect(`/productos/ver/${id}?error=Error al obtener clientes`);
                        }

                        res.render('productos/asignar', {
                            title: 'Asignar Producto',
                            producto,
                            inventario: inventario[0],
                            clientes: clientes || [],
                            currentPage: 'productos'
                        });
                    });
                });
            }
        );
    },

    // Asignar un producto a un cliente
    asignarProducto: (req, res) => {
        if (!req.session.user || req.session.user.rol !== 'Administrador') {
            return res.redirect('/login');
        }
        const { id } = req.params;
        const { id_cliente, id_inventario, fecha_entrega, observaciones } = req.body;

        if (!req.session.user || !req.session.user.id_empleado) {
            console.error('Usuario no tiene id_empleado:', req.session.user);
            return res.redirect(`/productos/ver/${id}?error=No tienes permisos para asignar productos`);
        }

        const id_empleado_asignador = req.session.user.id_empleado;
        const id_usuario_modificacion = req.session.user.id; // ID del usuario que realiza la acción

        // Verificamos que el producto existe y está activo
        db.query(
            'SELECT * FROM producto WHERE id_producto = ? AND activo = 1',
            [id],
            (error, productos) => {
                if (error) {
                    console.error(error);
                    return res.redirect('/productos?error=Error al verificar producto');
                }

                if (!productos || productos.length === 0) {
                    return res.redirect('/productos?error=Producto no encontrado o inactivo');
                }

                // Verificamos disponibilidad en inventario y obtenemos cantidad disponible
                db.query(
                    'SELECT cantidad_disponible FROM inventarioproducto WHERE id_producto = ? AND id_inventario = ?',
                    [id, id_inventario],
                    (error, inventario) => {
                        if (error) {
                            console.error(error);
                            return res.redirect(`/productos/ver/${id}?error=Error al verificar inventario`);
                        }

                        if (!inventario || inventario.length === 0 || inventario[0].cantidad_disponible < 1) {
                            return res.redirect(`/productos/ver/${id}?error=No hay disponibilidad del producto en el inventario seleccionado`);
                        }

                        const cantidad_disponible = inventario[0].cantidad_disponible;

                        // Creamos la asignación
                        const asignacionQuery = `
                        INSERT INTO asignacion (
                            id_producto, id_cliente, id_empleado_asignador, id_inventario, 
                            fecha_entrega, motivo_devolucion, activa
                        ) VALUES (?, ?, ?, ?, ?, ?, 1)
                    `;

                        db.query(asignacionQuery, [
                            id, id_cliente, id_empleado_asignador, id_inventario,
                            fecha_entrega || null, observaciones || null
                        ], (error, results) => {
                            if (error) {
                                console.error(error);
                                return res.redirect(`/productos/ver/${id}?error=Error al crear la asignación`);
                            }

                            const id_asignacion = results.insertId;

                            // Actualizamos el inventario
                            const updateInventarioQuery = `
                            UPDATE inventarioproducto 
                            SET cantidad_disponible = cantidad_disponible - 1,
                                cantidad_asignada = cantidad_asignada + 1
                            WHERE id_producto = ? AND id_inventario = ?
                        `;

                            db.query(updateInventarioQuery, [id, id_inventario], (error, results) => {
                                if (error) {
                                    console.error(error);
                                    return res.redirect(`/productos/ver/${id}?error=Error al actualizar inventario`);
                                }

                                // Determinar el estado nuevo para la bitácora
                                const nuevoEstado = cantidad_disponible > 1 ? 1 : 2; // 1 = Disponible, 2 = Asignado

                                // Registrar en la bitácora de asignación
                                const bitacoraQuery = `
                                INSERT INTO bitacoraasignacion (
                                    id_asignacion, id_estado_anterior, id_estado_nuevo,
                                    id_usuario_modificacion, observaciones
                                ) VALUES (?, ?, ?, ?, ?)
                            `;

                                db.query(bitacoraQuery, [
                                    id_asignacion,
                                    1,
                                    nuevoEstado,
                                    id_usuario_modificacion,
                                    'Asignación inicial del producto'
                                ], (error, results) => {
                                    if (error) {
                                        console.error('Error al registrar en bitácora:', error);
                                    }

                                    res.redirect(`/productos/ver/${id}?success=Producto asignado exitosamente`);
                                });
                            });
                        });
                    }
                );
            }
        );
    },

    // Desasignar un producto
    desasignarProducto: (req, res) => {
        const { id } = req.params;
        const { id_producto } = req.query;

        if (!req.session.user || req.session.user.rol !== 'Administrador') {
            return res.redirect('/login');
        }

        // Obtener información de la asignación
        db.query(
            'SELECT id_inventario FROM asignacion WHERE id_asignacion = ?',
            [id],
            (error, asignaciones) => {
                if (error || !asignaciones || asignaciones.length === 0) {
                    console.error(error);
                    return res.redirect(`/productos/ver/${id_producto}?error=Error al obtener la asignación`);
                }

                const id_inventario = asignaciones[0].id_inventario;

                // Actualizar el inventario
                db.query(
                    `UPDATE inventarioproducto 
                 SET cantidad_disponible = cantidad_disponible + 1,
                     cantidad_asignada = cantidad_asignada - 1
                 WHERE id_producto = ? AND id_inventario = ?`,
                    [id_producto, id_inventario],
                    (error, results) => {
                        if (error) {
                            console.error(error);
                            return res.redirect(`/productos/ver/${id_producto}?error=Error al actualizar inventario`);
                        }

                        // Marcar la asignación como inactiva
                        db.query(
                            'UPDATE asignacion SET activa = 0 WHERE id_asignacion = ?',
                            [id],
                            (error, results) => {
                                if (error) {
                                    console.error(error);
                                    return res.redirect(`/productos/ver/${id_producto}?error=Error al desasignar el producto`);
                                }

                                // Registrar en la bitácora
                                db.query(
                                    `INSERT INTO bitacoraasignacion (
                                    id_asignacion, id_estado_anterior, id_estado_nuevo,
                                    id_usuario_modificacion, observaciones
                                ) VALUES (?, 2, 1, ?, 'Producto desasignado')`,
                                    [id, req.session.user.id],
                                    (error, results) => {
                                        if (error) {
                                            console.error('Error al registrar en bitácora:', error);
                                        }

                                        res.redirect(`/productos/ver/${id_producto}?success=Producto desasignado correctamente`);
                                    }
                                );
                            }
                        );
                    }
                );
            }
        );
    }
};



module.exports = productoController;