const router = require('express').Router();
const pool = require('../config/db');

/**
 * @swagger
 * components:
 *   schemas:
 *     Stock:
 *       type: object
 *       properties:
 *         id_prod:
 *           type: integer
 *           description: ID del producto
 *         nombre_prod:
 *           type: string
 *           description: Nombre del producto
 *         stock_min:
 *           type: integer
 *           description: Stock mínimo permitido en la sucursal
 *         estado_inventario:
 *           type: string
 *           description: "Estado actual del inventario (por ejemplo: 'óptimo', 'bajo', etc.)"
 */

/**
 * @swagger
 * /api/sucursales/{id}/stock:
 *   get:
 *     summary: Obtener el inventario de una sucursal específica
 *     tags: [Sucursales]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la sucursal de la cual se desea obtener el inventario
 *     responses:
 *       200:
 *         description: Inventario de la sucursal obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Stock'
 *       404:
 *         description: No se encontró una sucursal con el ID proporcionado
 *       500:
 *         description: Error interno del servidor al procesar la solicitud
 */

router.get('/:id/stock', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('ID de sucursal recibido:', id);

    // Validar existencia de la sucursal
    const sucursal = await pool.query(
      'SELECT * FROM sucursal WHERE id_sucursal = $1',
      [id]
    );

    if (sucursal.rows.length === 0) {
      console.log('Sucursal no encontrada para el ID:', id);
      return res.status(404).json({ error: 'Sucursal no encontrada' });
    }

    // Consultar inventario para la sucursal
    const result = await pool.query(
      `SELECT 
         i.id_prod, 
         p.nombre_prod, 
         i.stock_min, 
         i.estado_inventario
       FROM inventario i
       JOIN producto p ON i.id_prod = p.id_prod
       WHERE i.id_sucursal = $1`,
      [id]
    );

    console.log('Resultado de la consulta de inventario:', result.rows);
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener el inventario:', err.message);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;
