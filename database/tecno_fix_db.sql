-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Versión del servidor:         8.0.41 - MySQL Community Server - GPL
-- SO del servidor:              Win64
-- HeidiSQL Versión:             12.8.0.6908
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Volcando estructura de base de datos para tecno_fix
CREATE DATABASE IF NOT EXISTS `tecno_fix` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `tecno_fix`;

-- Volcando estructura para tabla tecno_fix.asignacion
CREATE TABLE IF NOT EXISTS `asignacion` (
  `id_asignacion` int NOT NULL AUTO_INCREMENT,
  `id_producto` int NOT NULL,
  `id_cliente` int NOT NULL,
  `id_empleado_asignador` int DEFAULT NULL,
  `id_inventario` int DEFAULT NULL,
  `fecha_asignacion` datetime DEFAULT CURRENT_TIMESTAMP,
  `fecha_entrega` datetime DEFAULT NULL,
  `fecha_devolucion` datetime DEFAULT NULL,
  `motivo_devolucion` text,
  `activa` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id_asignacion`),
  KEY `id_producto` (`id_producto`),
  KEY `id_cliente` (`id_cliente`),
  KEY `id_empleado_asignador` (`id_empleado_asignador`),
  KEY `id_inventario` (`id_inventario`),
  CONSTRAINT `asignacion_ibfk_1` FOREIGN KEY (`id_producto`) REFERENCES `producto` (`id_producto`),
  CONSTRAINT `asignacion_ibfk_2` FOREIGN KEY (`id_cliente`) REFERENCES `cliente` (`id_cliente`),
  CONSTRAINT `asignacion_ibfk_3` FOREIGN KEY (`id_empleado_asignador`) REFERENCES `empleado` (`id_empleado`),
  CONSTRAINT `asignacion_ibfk_4` FOREIGN KEY (`id_inventario`) REFERENCES `inventario` (`id_inventario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Volcando datos para la tabla tecno_fix.asignacion: ~0 rows (aproximadamente)

-- Volcando estructura para tabla tecno_fix.bitacoraasignacion
CREATE TABLE IF NOT EXISTS `bitacoraasignacion` (
  `id_bitacora` int NOT NULL AUTO_INCREMENT,
  `id_asignacion` int NOT NULL,
  `id_estado_anterior` int DEFAULT NULL,
  `id_estado_nuevo` int DEFAULT NULL,
  `id_usuario_modificacion` int DEFAULT NULL,
  `fecha_modificacion` datetime DEFAULT CURRENT_TIMESTAMP,
  `observaciones` text,
  PRIMARY KEY (`id_bitacora`),
  KEY `id_asignacion` (`id_asignacion`),
  KEY `id_estado_anterior` (`id_estado_anterior`),
  KEY `id_estado_nuevo` (`id_estado_nuevo`),
  KEY `id_usuario_modificacion` (`id_usuario_modificacion`),
  CONSTRAINT `bitacoraasignacion_ibfk_1` FOREIGN KEY (`id_asignacion`) REFERENCES `asignacion` (`id_asignacion`),
  CONSTRAINT `bitacoraasignacion_ibfk_2` FOREIGN KEY (`id_estado_anterior`) REFERENCES `estado` (`id_estado`),
  CONSTRAINT `bitacoraasignacion_ibfk_3` FOREIGN KEY (`id_estado_nuevo`) REFERENCES `estado` (`id_estado`),
  CONSTRAINT `bitacoraasignacion_ibfk_4` FOREIGN KEY (`id_usuario_modificacion`) REFERENCES `usuario` (`id_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Volcando datos para la tabla tecno_fix.bitacoraasignacion: ~0 rows (aproximadamente)

-- Volcando estructura para tabla tecno_fix.bitacorareparacion
CREATE TABLE IF NOT EXISTS `bitacorareparacion` (
  `id_bitacora` int NOT NULL AUTO_INCREMENT,
  `id_proceso` int NOT NULL,
  `id_estado_anterior` int DEFAULT NULL,
  `id_estado_nuevo` int DEFAULT NULL,
  `id_empleado` int NOT NULL,
  `fecha_modificacion` datetime DEFAULT CURRENT_TIMESTAMP,
  `observaciones` text,
  PRIMARY KEY (`id_bitacora`),
  KEY `id_proceso` (`id_proceso`),
  KEY `id_estado_anterior` (`id_estado_anterior`),
  KEY `id_estado_nuevo` (`id_estado_nuevo`),
  KEY `id_empleado` (`id_empleado`),
  CONSTRAINT `bitacorareparacion_ibfk_1` FOREIGN KEY (`id_proceso`) REFERENCES `procesoreparacion` (`id_proceso`),
  CONSTRAINT `bitacorareparacion_ibfk_2` FOREIGN KEY (`id_estado_anterior`) REFERENCES `estado` (`id_estado`),
  CONSTRAINT `bitacorareparacion_ibfk_3` FOREIGN KEY (`id_estado_nuevo`) REFERENCES `estado` (`id_estado`),
  CONSTRAINT `bitacorareparacion_ibfk_4` FOREIGN KEY (`id_empleado`) REFERENCES `empleado` (`id_empleado`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Volcando datos para la tabla tecno_fix.bitacorareparacion: ~0 rows (aproximadamente)

-- Volcando estructura para tabla tecno_fix.categoria
CREATE TABLE IF NOT EXISTS `categoria` (
  `id_categoria` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id_categoria`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Volcando datos para la tabla tecno_fix.categoria: ~7 rows (aproximadamente)
INSERT INTO `categoria` (`id_categoria`, `nombre`, `descripcion`) VALUES
	(1, 'Laptop', 'Computadoras portátiles'),
	(2, 'Desktop', 'Computadoras de escritorio'),
	(3, 'Monitor', 'Monitores y pantallas'),
	(4, 'Impresora', 'Impresoras de cualquier tipo'),
	(5, 'Tablet', 'Dispositivos tablet'),
	(6, 'Teléfono', 'Teléfonos inteligentes'),
	(7, 'Periférico', 'Teclados, mouse, etc.');

-- Volcando estructura para tabla tecno_fix.cliente
CREATE TABLE IF NOT EXISTS `cliente` (
  `id_cliente` int NOT NULL AUTO_INCREMENT,
  `id_usuario` int DEFAULT NULL,
  `nombre` varchar(100) NOT NULL,
  `apellido` varchar(100) NOT NULL,
  `cedula` varchar(20) DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `departamento` varchar(100) DEFAULT NULL,
  `puesto` varchar(100) DEFAULT NULL,
  `fecha_ingreso` date DEFAULT NULL,
  PRIMARY KEY (`id_cliente`),
  UNIQUE KEY `id_usuario` (`id_usuario`),
  UNIQUE KEY `cedula` (`cedula`),
  CONSTRAINT `cliente_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Volcando datos para la tabla tecno_fix.cliente: ~0 rows (aproximadamente)

-- Volcando estructura para tabla tecno_fix.empleado
CREATE TABLE IF NOT EXISTS `empleado` (
  `id_empleado` int NOT NULL AUTO_INCREMENT,
  `id_usuario` int DEFAULT NULL,
  `nombre` varchar(100) NOT NULL,
  `apellido` varchar(100) NOT NULL,
  `cedula` varchar(20) DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `departamento` varchar(100) DEFAULT NULL,
  `fecha_contratacion` date DEFAULT NULL,
  `especialidad` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id_empleado`),
  UNIQUE KEY `id_usuario` (`id_usuario`),
  UNIQUE KEY `cedula` (`cedula`),
  CONSTRAINT `empleado_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Volcando datos para la tabla tecno_fix.empleado: ~0 rows (aproximadamente)
INSERT INTO `empleado` (`id_empleado`, `id_usuario`, `nombre`, `apellido`, `cedula`, `telefono`, `departamento`, `fecha_contratacion`, `especialidad`) VALUES
	(1, 1, 'José', 'Rubio', 'V-12345678', '555-1234567', 'Administración', '2025-03-26', 'Administración de Sistemas'),
	(2, 2, 'José', 'Rubio', 'V-87654321', '555-7654321', 'Soporte Técnico', '2025-03-26', 'Reparación de equipos');

-- Volcando estructura para tabla tecno_fix.estado
CREATE TABLE IF NOT EXISTS `estado` (
  `id_estado` int NOT NULL AUTO_INCREMENT,
  `nombre_estado` varchar(50) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `tipo_estado` enum('equipo','solicitud','reparacion') NOT NULL,
  PRIMARY KEY (`id_estado`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Volcando datos para la tabla tecno_fix.estado: ~14 rows (aproximadamente)
INSERT INTO `estado` (`id_estado`, `nombre_estado`, `descripcion`, `tipo_estado`) VALUES
	(1, 'Disponible', 'Equipo disponible para asignación', 'equipo'),
	(2, 'Asignado', 'Equipo asignado a un usuario', 'equipo'),
	(3, 'En reparación', 'Equipo en proceso de reparación', 'equipo'),
	(4, 'Descartado', 'Equipo descartado por obsoleto o dañado', 'equipo'),
	(5, 'Perdido', 'Equipo perdido o extraviado', 'equipo'),
	(6, 'Pendiente', 'Solicitud pendiente de revisión', 'solicitud'),
	(7, 'En proceso', 'Solicitud asignada a técnico', 'solicitud'),
	(8, 'Resuelta', 'Solicitud resuelta', 'solicitud'),
	(9, 'Cancelada', 'Solicitud cancelada', 'solicitud'),
	(10, 'Diagnóstico', 'Reparación en fase de diagnóstico', 'reparacion'),
	(11, 'Espera repuestos', 'Esperando repuestos para reparación', 'reparacion'),
	(12, 'En reparación', 'Reparación en curso', 'reparacion'),
	(13, 'Reparado', 'Equipo reparado', 'reparacion'),
	(14, 'Irreparable', 'Equipo no puede ser reparado', 'reparacion');

-- Volcando estructura para tabla tecno_fix.inventario
CREATE TABLE IF NOT EXISTS `inventario` (
  `id_inventario` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `ubicacion` varchar(100) DEFAULT NULL,
  `responsable` int DEFAULT NULL,
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_inventario`),
  KEY `responsable` (`responsable`),
  CONSTRAINT `inventario_ibfk_1` FOREIGN KEY (`responsable`) REFERENCES `empleado` (`id_empleado`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Volcando datos para la tabla tecno_fix.inventario: ~0 rows (aproximadamente)

-- Volcando estructura para tabla tecno_fix.inventarioproducto
CREATE TABLE IF NOT EXISTS `inventarioproducto` (
  `id_inventario` int NOT NULL,
  `id_producto` int NOT NULL,
  `cantidad` int DEFAULT '1',
  `cantidad_disponible` int DEFAULT '0',
  `cantidad_asignada` int DEFAULT '0',
  `cantidad_reparacion` int DEFAULT '0',
  `cantidad_descartada` int DEFAULT '0',
  PRIMARY KEY (`id_inventario`,`id_producto`),
  KEY `id_producto` (`id_producto`),
  CONSTRAINT `inventarioproducto_ibfk_1` FOREIGN KEY (`id_inventario`) REFERENCES `inventario` (`id_inventario`),
  CONSTRAINT `inventarioproducto_ibfk_2` FOREIGN KEY (`id_producto`) REFERENCES `producto` (`id_producto`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Volcando datos para la tabla tecno_fix.inventarioproducto: ~0 rows (aproximadamente)

-- Volcando estructura para tabla tecno_fix.procesoreparacion
CREATE TABLE IF NOT EXISTS `procesoreparacion` (
  `id_proceso` int NOT NULL AUTO_INCREMENT,
  `id_solicitud` int DEFAULT NULL,
  `id_empleado_asignado` int DEFAULT NULL,
  `id_estado` int NOT NULL,
  `fecha_inicio` datetime DEFAULT CURRENT_TIMESTAMP,
  `fecha_fin` datetime DEFAULT NULL,
  `diagnostico` text,
  `acciones_realizadas` text,
  `repuestos_utilizados` text,
  `costo_estimado` decimal(10,2) DEFAULT NULL,
  `costo_final` decimal(10,2) DEFAULT NULL,
  `observaciones` text,
  PRIMARY KEY (`id_proceso`),
  KEY `id_solicitud` (`id_solicitud`),
  KEY `id_empleado_asignado` (`id_empleado_asignado`),
  KEY `id_estado` (`id_estado`),
  CONSTRAINT `procesoreparacion_ibfk_1` FOREIGN KEY (`id_solicitud`) REFERENCES `solicitudsoporte` (`id_solicitud`),
  CONSTRAINT `procesoreparacion_ibfk_2` FOREIGN KEY (`id_empleado_asignado`) REFERENCES `empleado` (`id_empleado`),
  CONSTRAINT `procesoreparacion_ibfk_3` FOREIGN KEY (`id_estado`) REFERENCES `estado` (`id_estado`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Volcando datos para la tabla tecno_fix.procesoreparacion: ~0 rows (aproximadamente)

-- Volcando estructura para tabla tecno_fix.producto
CREATE TABLE IF NOT EXISTS `producto` (
  `id_producto` int NOT NULL AUTO_INCREMENT,
  `id_categoria` int DEFAULT NULL,
  `nombre` varchar(100) NOT NULL,
  `descripcion` text,
  `marca` varchar(50) DEFAULT NULL,
  `modelo` varchar(50) DEFAULT NULL,
  `numero_serie` varchar(100) DEFAULT NULL,
  `especificaciones` text,
  `fecha_compra` date DEFAULT NULL,
  `garantia_hasta` date DEFAULT NULL,
  `activo` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id_producto`),
  UNIQUE KEY `numero_serie` (`numero_serie`),
  KEY `id_categoria` (`id_categoria`),
  CONSTRAINT `producto_ibfk_1` FOREIGN KEY (`id_categoria`) REFERENCES `categoria` (`id_categoria`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Volcando datos para la tabla tecno_fix.producto: ~0 rows (aproximadamente)

-- Volcando estructura para tabla tecno_fix.reporte
CREATE TABLE IF NOT EXISTS `reporte` (
  `id_reporte` int NOT NULL AUTO_INCREMENT,
  `id_usuario_generador` int NOT NULL,
  `tipo_reporte` enum('inventario','asignaciones','reparaciones','solicitudes') NOT NULL,
  `fecha_generacion` datetime DEFAULT CURRENT_TIMESTAMP,
  `parametros` text,
  `archivo_ruta` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id_reporte`),
  KEY `id_usuario_generador` (`id_usuario_generador`),
  CONSTRAINT `reporte_ibfk_1` FOREIGN KEY (`id_usuario_generador`) REFERENCES `usuario` (`id_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Volcando datos para la tabla tecno_fix.reporte: ~0 rows (aproximadamente)

-- Volcando estructura para tabla tecno_fix.rol
CREATE TABLE IF NOT EXISTS `rol` (
  `id_rol` int NOT NULL AUTO_INCREMENT,
  `nombre_rol` varchar(50) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `activo` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id_rol`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Volcando datos para la tabla tecno_fix.rol: ~3 rows (aproximadamente)
INSERT INTO `rol` (`id_rol`, `nombre_rol`, `descripcion`, `fecha_creacion`, `activo`) VALUES
	(1, 'Administrador', 'Acceso completo al sistema', '2025-03-26 00:34:00', 1),
	(2, 'Empleado', 'Técnico o personal de soporte', '2025-03-26 00:34:00', 1),
	(3, 'Cliente', 'Usuario final que recibe equipos', '2025-03-26 00:34:00', 1),
	(4, 'Administrador', 'Acceso completo al sistema', '2025-03-26 17:25:01', 1),
	(5, 'Administrador', 'Acceso completo al sistema', '2025-03-26 17:25:14', 1),
	(6, 'Administrador', 'Acceso completo al sistema', '2025-03-26 17:26:32', 1),
	(7, 'Tecnico', 'Personal técnico de soporte y reparación', '2025-03-26 17:26:32', 1);

-- Volcando estructura para tabla tecno_fix.solicitudsoporte
CREATE TABLE IF NOT EXISTS `solicitudsoporte` (
  `id_solicitud` int NOT NULL AUTO_INCREMENT,
  `id_cliente` int NOT NULL,
  `id_producto` int DEFAULT NULL,
  `id_estado` int NOT NULL,
  `fecha_solicitud` datetime DEFAULT CURRENT_TIMESTAMP,
  `descripcion_problema` text NOT NULL,
  `urgencia` enum('baja','media','alta','critica') DEFAULT 'media',
  `fecha_cierre` datetime DEFAULT NULL,
  `solucion` text,
  PRIMARY KEY (`id_solicitud`),
  KEY `id_cliente` (`id_cliente`),
  KEY `id_producto` (`id_producto`),
  KEY `id_estado` (`id_estado`),
  CONSTRAINT `solicitudsoporte_ibfk_1` FOREIGN KEY (`id_cliente`) REFERENCES `cliente` (`id_cliente`),
  CONSTRAINT `solicitudsoporte_ibfk_2` FOREIGN KEY (`id_producto`) REFERENCES `producto` (`id_producto`),
  CONSTRAINT `solicitudsoporte_ibfk_3` FOREIGN KEY (`id_estado`) REFERENCES `estado` (`id_estado`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Volcando datos para la tabla tecno_fix.solicitudsoporte: ~0 rows (aproximadamente)

-- Volcando estructura para tabla tecno_fix.usuario
CREATE TABLE IF NOT EXISTS `usuario` (
  `id_usuario` int NOT NULL AUTO_INCREMENT,
  `id_rol` int NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `email` varchar(100) NOT NULL,
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `ultimo_login` datetime DEFAULT NULL,
  `activo` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id_usuario`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  KEY `id_rol` (`id_rol`),
  CONSTRAINT `usuario_ibfk_1` FOREIGN KEY (`id_rol`) REFERENCES `rol` (`id_rol`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Volcando datos para la tabla tecno_fix.usuario: ~2 rows (aproximadamente)
INSERT INTO `usuario` (`id_usuario`, `id_rol`, `username`, `password`, `email`, `fecha_creacion`, `ultimo_login`, `activo`) VALUES
	(1, 1, 'admin', '$2a$12$eLODQC2J1i3Xk/zadEr52ulaS6YPkWEq8jvkBLK7LugfkR37ox8ZO', 'admin@tecno-fix.com', '2025-03-26 17:26:32', NULL, 1),
	(2, 7, 'jrubio', '$2a$12$BF7DbPDCu0HHfYoNuYqNqOqI/iTtIk1IstwYDDSiDROjvfUPzd8I6', 'jrubio@tecno-fix.com', '2025-03-26 17:26:32', NULL, 1);

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
