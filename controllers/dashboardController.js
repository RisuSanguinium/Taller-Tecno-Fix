const db = require('../database/db');

const dashboardController = {
    mostrarEstadisticas: async (req, res) => {
        if (!req.session.user || req.session.user.rol !== 'Administrador') {
            return res.redirect('/login');
        }

        // Fechas por defecto (1 de enero 2025 hasta hoy)
        const hoy = new Date();
        const fechaInicioDefault = new Date('2025-01-01');
        
        // Formatear fechas
        const formatDate = (date) => date.toISOString().split('T')[0];
        
        const fechaInicio = req.query.inicio || formatDate(fechaInicioDefault);
        const fechaFin = req.query.fin || formatDate(hoy);

        try {
            const [empleadosActivos, empleadosInactivos] = await Promise.all([
                getCount('Usuario', 'id_rol = 2 AND activo = 1'),
                getCount('Usuario', 'id_rol = 2 AND activo = 0')
            ]);

            const [clientesActivos, clientesInactivos] = await Promise.all([
                getCount('Usuario', 'id_rol = 3 AND activo = 1'),
                getCount('Usuario', 'id_rol = 3 AND activo = 0')
            ]);

            const [reparacionesPagadas, reparacionesNoPagadas] = await Promise.all([
                getCountWithDate('procesoreparacion', 'pagado = 1 AND fecha_fin BETWEEN ? AND ?', [fechaInicio, fechaFin]),
                getCountWithDate('procesoreparacion', 'pagado = 0 AND fecha_fin BETWEEN ? AND ?', [fechaInicio, fechaFin])
            ]);

            const gananciasTotales = await getGananciasTotales(fechaInicio, fechaFin);
            const gananciasPorDia = await getGananciasPorDia(fechaInicio, fechaFin);

            res.render('dashboard/estadisticas', {
                title: 'Estadísticas de Usuarios',
                currentPage: 'estadisticas',
                empleados: {
                    activos: empleadosActivos,
                    inactivos: empleadosInactivos
                },
                clientes: {
                    activos: clientesActivos,
                    inactivos: clientesInactivos
                },
                reparaciones: {
                    pagadas: reparacionesPagadas,
                    noPagadas: reparacionesNoPagadas
                },
                ganancias: gananciasTotales,
                gananciasPorDia: gananciasPorDia || [],
                fechaInicio,
                fechaFin
            });
        } catch (error) {
            console.error('Error al obtener estadísticas:', error);
            res.render('dashboard/estadisticas', {
                title: 'Estadísticas de Usuarios',
                currentPage: 'estadisticas',
                error: 'Error al cargar las estadísticas',
                empleados: { activos: 0, inactivos: 0 },
                clientes: { activos: 0, inactivos: 0 },
                reparaciones: { pagadas: 0, noPagadas: 0 },
                ganancias: 0,
                gananciasPorDia: [],
                fechaInicio,
                fechaFin
            });
        }
    }
};

function getCount(table, condition) {
    return new Promise((resolve, reject) => {
        db.query(`SELECT COUNT(*) as total FROM ${table} WHERE ${condition}`, (err, results) => {
            if (err) return reject(err);
            resolve(results[0].total);
        });
    });
}

function getCountWithDate(table, condition, params = []) {
    return new Promise((resolve, reject) => {
        db.query(`SELECT COUNT(*) as total FROM ${table} WHERE ${condition}`, params, (err, results) => {
            if (err) return reject(err);
            resolve(results[0].total);
        });
    });
}

function getGananciasTotales(inicio, fin) {
    return new Promise((resolve, reject) => {
        db.query(
            `SELECT IFNULL(SUM(costo_final), 0) as total FROM procesoreparacion 
             WHERE pagado = 1 AND fecha_fin BETWEEN ? AND ?`,
            [inicio, fin],
            (err, results) => {
                if (err) return reject(err);
                resolve(results[0].total);
            }
        );
    });
}

function getGananciasPorDia(inicio, fin) {
    return new Promise((resolve, reject) => {
        db.query(
            `SELECT DATE(fecha_fin) as dia, IFNULL(SUM(costo_final), 0) as total
             FROM procesoreparacion
             WHERE pagado = 1 AND fecha_fin BETWEEN ? AND ?
             GROUP BY DATE(fecha_fin)
             ORDER BY dia ASC`,
            [inicio, fin],
            (err, results) => {
                if (err) return reject(err);
                resolve(results);
            }
        );
    });
}

module.exports = dashboardController;