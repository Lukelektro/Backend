const express = require('express');
const router = express.Router();
const pool = require('../config/db');

/**
 * @swagger
 * components:
 *   schemas:
 *     TipoProducto:
 *       type: object
 *       required:
 *         - nombre_tipoprod
 *       properties:
 *         id_tipoprod:
 *           type: integer
 *           description: ID único del tipo de producto
 *         nombre_tipoprod:
 *           type: string
 *           description: Nombre del tipo de producto
 *         desc_tipoprod:
 *           type: string
 *           description: Descripción detallada del tipo de producto
 */

/**
 * @swagger
 * /api/tipo-producto:
 *   get:
 *     summary: Obtener todos los tipos de productos
 *     tags: [TipoProducto]
 *     responses:
 *       200:
 *         description: Lista completa de tipos de productos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TipoProducto'
 *       500:
 *         description: Error interno del servidor
 */
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tipo_producto ORDER BY id_tipoprod');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error al obtener tipos de producto:', error.message);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

/**
 * @swagger
 * /api/tipo-producto:
 *   post:
 *     summary: Crear un nuevo tipo de producto
 *     tags: [TipoProducto]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TipoProducto'
 *     responses:
 *       201:
 *         description: Tipo de producto creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TipoProducto'
 *       400:
 *         description: El campo nombre_tipoprod es obligatorio
 *       500:
 *         description: Error interno del servidor
 */
router.post('/', async (req, res) => {
  const { nombre_tipoprod, desc_tipoprod } = req.body;
  if (!nombre_tipoprod) {
    return res.status(400).json({ error: 'El nombre_tipoprod es obligatorio' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO tipo_producto (nombre_tipoprod, desc_tipoprod) VALUES ($1, $2) RETURNING *',
      [nombre_tipoprod, desc_tipoprod]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error al crear tipo de producto:', error.message);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

/**
 * @swagger
 * /api/tipo-producto/{id}:
 *   put:
 *     summary: Actualizar un tipo de producto por ID
 *     tags: [TipoProducto]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del tipo de producto a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TipoProducto'
 *     responses:
 *       200:
 *         description: Tipo de producto actualizado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TipoProducto'
 *       400:
 *         description: Datos inválidos proporcionados
 *       404:
 *         description: Tipo de producto no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre_tipoprod, desc_tipoprod } = req.body;

  try {
    const result = await pool.query(
      'UPDATE tipo_producto SET nombre_tipoprod = $1, desc_tipoprod = $2 WHERE id_tipoprod = $3 RETURNING *',
      [nombre_tipoprod, desc_tipoprod, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tipo de producto no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al actualizar tipo de producto:', error.message);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

/**
 * @swagger
 * /api/tipo-producto/{id}:
 *   delete:
 *     summary: Eliminar un tipo de producto por ID
 *     tags: [TipoProducto]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del tipo de producto a eliminar
 *     responses:
 *       200:
 *         description: Tipo de producto eliminado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Tipo de producto eliminado
 *                 tipo_producto:
 *                   $ref: '#/components/schemas/TipoProducto'
 *       404:
 *         description: Tipo de producto no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM tipo_producto WHERE id_tipoprod = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tipo de producto no encontrado' });
    }

    res.json({ message: 'Tipo de producto eliminado', tipo_producto: result.rows[0] });
  } catch (error) {
    console.error('Error al eliminar tipo de producto:', error.message);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;
