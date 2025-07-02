const router = require('express').Router();
const pool = require('../config/db');

/**
 * @swagger
 * components:
 *   schemas:
 *     ProductoPedido:
 *       type: object
 *       required:
 *         - producto_id
 *         - cantidad
 *         - precio_unitario
 *       properties:
 *         producto_id:
 *           type: integer
 *           example: 101
 *         cantidad:
 *           type: integer
 *           example: 2
 *         precio_unitario:
 *           type: number
 *           format: float
 *           example: 14990.0
 *     Pedido:
 *       type: object
 *       required:
 *         - cliente_id
 *         - estado_id
 *         - productos
 *       properties:
 *         cliente_id:
 *           type: integer
 *           description: ID del cliente que realiza el pedido
 *           example: 5
 *         estado_id:
 *           type: integer
 *           description: ID del estado inicial del pedido
 *           example: 1
 *         productos:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ProductoPedido'
 */

/**
 * @swagger
 * /api/pedidos:
 *   post:
 *     summary: Crear un nuevo pedido
 *     tags: [Pedidos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Pedido'
 *     responses:
 *       201:
 *         description: Pedido creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Pedido creado exitosamente
 *                 pedido_id:
 *                   type: integer
 *                   example: 12
 *       400:
 *         description: Datos de entrada inválidos
 *       500:
 *         description: Error del servidor
 */
router.post('/', async (req, res) => {
  const client = await pool.connect();

  try {
    const { cliente_id, estado_id, productos } = req.body;

    if (!cliente_id || !estado_id || !productos || !Array.isArray(productos) || productos.length === 0) {
      return res.status(400).json({ error: 'cliente_id, estado_id y productos son obligatorios' });
    }

    await client.query('BEGIN');

    const pedidoResult = await client.query(
      'INSERT INTO pedido (id_cliente, id_estado_ped, fecha_pedido) VALUES ($1, $2, CURRENT_TIMESTAMP) RETURNING id_pedido',
      [cliente_id, estado_id]
    );

    const pedidoId = pedidoResult.rows[0].id_pedido;

    for (const item of productos) {
      if (!item.producto_id || !item.cantidad || !item.precio_unitario) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Cada producto debe incluir producto_id, cantidad y precio_unitario' });
      }

      const productResult = await client.query(
        'SELECT nombre_prod, stock_prod FROM producto WHERE id_prod = $1',
        [item.producto_id]
      );

      if (productResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `Producto con ID ${item.producto_id} no encontrado` });
      }

      const nombreProducto = productResult.rows[0].nombre_prod;
      const stockActual = productResult.rows[0].stock_prod;

      if (stockActual < item.cantidad) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          error: `Stock insuficiente para el producto ${nombreProducto}. Disponible: ${stockActual}, Solicitado: ${item.cantidad}`
        });
      }

      const precioTotal = item.cantidad * item.precio_unitario;

      await client.query(
        `INSERT INTO detalle_pedido (id_pedido, id_producto, cantidad, precio_unit, precio_total, nombre_producto)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [pedidoId, item.producto_id, item.cantidad, item.precio_unitario, precioTotal, nombreProducto]
      );

      await client.query(
        'UPDATE producto SET stock_prod = stock_prod - $1 WHERE id_prod = $2',
        [item.cantidad, item.producto_id]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Pedido creado exitosamente',
      pedido_id: pedidoId
    });

  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Error del servidor' });
  } finally {
    client.release();
  }
});

/**
 * @swagger
 * /api/pedidos:
 *   get:
 *     summary: Obtener todos los pedidos agrupados por estado
 *     tags: [Pedidos]
 *     responses:
 *       200:
 *         description: Lista de pedidos agrupados por estado
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   status_id:
 *                     type: integer
 *                   status_name:
 *                     type: string
 *                   status_description:
 *                     type: string
 *                   orders:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         id_pedido:
 *                           type: integer
 *                         id_cliente:
 *                           type: integer
 *                         fecha_pedido:
 *                           type: string
 *                           format: date-time
 *                         fecha_entrega:
 *                           type: string
 *                           format: date-time
 *                         detalles:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               id_detalle:
 *                                 type: integer
 *                               producto_id:
 *                                 type: integer
 *                               nombre_producto:
 *                                 type: string
 *                               cantidad:
 *                                 type: integer
 *                               precio_unit:
 *                                 type: number
 *                               precio_total:
 *                                 type: number
 *       500:
 *         description: Error del servidor
 */
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.id_pedido,
        p.id_cliente,
        p.fecha_pedido,
        p.fecha_entrega,
        e.id_estado_ped,
        e.nom_estado_ped,
        e.desc_estado_ped,
        json_agg(
          json_build_object(
            'id_detalle', dp.id_detalle_ped,
            'producto_id', dp.id_producto,
            'nombre_producto', dp.nombre_producto,
            'cantidad', dp.cantidad,
            'precio_unit', dp.precio_unit,
            'precio_total', dp.precio_total
          )
        ) AS detalles
      FROM pedido p
      JOIN estado_pedido e ON p.id_estado_ped = e.id_estado_ped
      JOIN detalle_pedido dp ON p.id_pedido = dp.id_pedido
      GROUP BY p.id_pedido, e.id_estado_ped, e.nom_estado_ped, e.desc_estado_ped
      ORDER BY p.fecha_pedido DESC
    `);

    const groupedOrders = {};

    result.rows.forEach(order => {
      const statusId = order.id_estado_ped;
      const statusName = order.nom_estado_ped;

      if (!groupedOrders[statusId]) {
        groupedOrders[statusId] = {
          status_id: statusId,
          status_name: statusName,
          status_description: order.desc_estado_ped,
          orders: []
        };
      }

      groupedOrders[statusId].orders.push({
        id_pedido: order.id_pedido,
        id_cliente: order.id_cliente,
        fecha_pedido: order.fecha_pedido,
        fecha_entrega: order.fecha_entrega,
        detalles: order.detalles
      });
    });

    res.json(Object.values(groupedOrders));
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener pedidos' });
  }
});

/**
 * @swagger
 * /api/pedidos/estados:
 *   get:
 *     summary: Obtener todos los estados de pedido
 *     tags: [Pedidos]
 *     responses:
 *       200:
 *         description: Lista de estados de pedido
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id_estado_ped:
 *                     type: integer
 *                   nom_estado_ped:
 *                     type: string
 *                   desc_estado_ped:
 *                     type: string
 *       500:
 *         description: Error del servidor
 */
router.get('/estados', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id_estado_ped,
        nom_estado_ped,
        desc_estado_ped
      FROM estado_pedido 
      ORDER BY id_estado_ped
    `);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener estados de pedido' });
  }
});

module.exports = router;
