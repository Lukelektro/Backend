const express = require('express');
const router = express.Router();
const pool = require('../config/db');

/**
 * @swagger
 * /api/productos:
 *   get:
 *     summary: Obtener todos los productos
 *     tags: [Productos]
 *     responses:
 *       200:
 *         description: Lista de productos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id_prod:
 *                     type: integer
 *                   nombre_prod:
 *                     type: string
 *                   precio_prod:
 *                     type: number
 *                   stock_prod:
 *                     type: integer
 *                   imagen_url:
 *                     type: string
 *                   tipo_producto:
 *                     type: string
 *                   destacado_prod:
 *                     type: boolean
 *                   id_tipoprod:
 *                     type: integer
 *       500:
 *         description: Error del servidor
 */
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.id_prod, 
        p.nombre_prod, 
        p.precio_prod, 
        p.stock_prod, 
        p.imagen_url, 
        p.destacado_prod,
        p.id_tipoprod,
        tp.nombre_tipoprod AS tipo_producto
      FROM producto p
      LEFT JOIN tipo_producto tp ON p.id_tipoprod = tp.id_tipoprod
      ORDER BY p.id_prod
    `);

    console.log('Productos obtenidos:', result.rows);
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener productos:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// ...existing code...

/**
 * @swagger
 * /api/productos/destacados:
 *   get:
 *     summary: Obtener productos destacados
 *     tags: [Productos]
 *     responses:
 *       200:
 *         description: Lista de productos destacados
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id_prod:
 *                     type: integer
 *                   nombre_prod:
 *                     type: string
 *                   precio_prod:
 *                     type: number
 *                   stock_prod:
 *                     type: integer
 *                   imagen_url:
 *                     type: string
 *       500:
 *         description: Error del servidor
 */
router.get('/destacados', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id_prod, nombre_prod, precio_prod, stock_prod, imagen_url
      FROM producto
      WHERE destacado_prod = true
      LIMIT 4
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener productos destacados:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @swagger
 * /api/productos/{codigo}:
 *   get:
 *     summary: Obtener un producto por su ID
 *     tags: [Productos]
 *     parameters:
 *       - in: path
 *         name: codigo
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del producto
 *     responses:
 *       200:
 *         description: Producto encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id_prod:
 *                   type: integer
 *                 nombre_prod:
 *                   type: string
 *                 precio_prod:
 *                   type: number
 *                 stock_prod:
 *                   type: integer
 *                 tipo_producto:
 *                   type: string
 *       404:
 *         description: Producto no encontrado
 *       500:
 *         description: Error del servidor
 */
router.get('/:codigo', async (req, res) => {
  try {
    const { codigo } = req.params;
    console.log('Código recibido:', codigo);

    const result = await pool.query(`
      SELECT 
        p.id_prod,
        p.nombre_prod,
        p.precio_prod,
        p.stock_prod,
        tp.nombre_tipoprod AS tipo_producto
      FROM producto p
      LEFT JOIN tipo_producto tp ON p.id_tipoprod = tp.id_tipoprod
      WHERE p.id_prod = $1
    `, [codigo]);

    console.log('Resultado de la consulta:', result.rows);

    if (result.rows.length === 0) {
      console.log('Producto no encontrado para el código:', codigo);
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error al obtener producto por código:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});
/**
 * @swagger
 * /api/producto:
 *   post:
 *     summary: Crear un nuevo producto
 *     tags: [Productos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre_prod
 *               - precio_prod
 *               - stock_prod
 *               - id_tipoprod
 *             properties:
 *               nombre_prod:
 *                 type: string
 *                 description: Nombre del producto
 *               precio_prod:
 *                 type: number
 *                 description: Precio del producto
 *               stock_prod:
 *                 type: integer
 *                 description: Stock disponible
 *               id_tipoprod:
 *                 type: integer
 *                 description: ID del tipo de producto
 *               imagen_url:
 *                 type: string
 *                 description: URL de la imagen del producto
 *               destacado_prod:
 *                 type: boolean
 *                 description: Si el producto es destacado
 *     responses:
 *       201:
 *         description: Producto creado exitosamente
 *       400:
 *         description: Datos inválidos
 *       500:
 *         description: Error del servidor
 */
router.post('/', async (req, res) => {
  const { nombre_prod, precio_prod, stock_prod, id_tipoprod, imagen_url, destacado_prod } = req.body;

  // Validaciones
  if (!nombre_prod || !precio_prod || !stock_prod || !id_tipoprod) {
    return res.status(400).json({ error: 'Faltan campos requeridos: nombre_prod, precio_prod, stock_prod, id_tipoprod' });
  }

  try {
    console.log('Datos recibidos en POST:', req.body);
    
    const result = await pool.query(
      `INSERT INTO producto (nombre_prod, precio_prod, stock_prod, id_tipoprod, imagen_url, destacado_prod)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        nombre_prod, 
        precio_prod, 
        stock_prod, 
        id_tipoprod, 
        imagen_url || null, 
        destacado_prod || false
      ]
    );

    console.log('Producto creado exitosamente:', result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error al crear producto:', err.message);
    res.status(500).json({ error: 'Error del servidor al crear el producto' });
  }
});

/**
 * @swagger
 * /api/producto/{id}:
 *   put:
 *     summary: Actualizar un producto existente
 *     tags: [Productos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre_prod:
 *                 type: string
 *               precio_prod:
 *                 type: number
 *               stock_prod:
 *                 type: integer
 *               id_tipoprod:
 *                 type: integer
 *               imagen_url:
 *                 type: string
 *               destacado_prod:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Producto actualizado exitosamente
 *       404:
 *         description: Producto no encontrado
 *       500:
 *         description: Error del servidor
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre_prod, precio_prod, stock_prod, id_tipoprod, imagen_url, destacado_prod } = req.body;

    const result = await pool.query(
      `UPDATE producto 
       SET nombre_prod = $1, precio_prod = $2, stock_prod = $3, id_tipoprod = $4, imagen_url = $5, destacado_prod = $6
       WHERE id_prod = $7 
       RETURNING *`,
      [nombre_prod, precio_prod, stock_prod, id_tipoprod, imagen_url, destacado_prod, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error al actualizar producto:', err.message);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

/**
 * @swagger
 * /api/producto/{id}:
 *   delete:
 *     summary: Eliminar un producto
 *     tags: [Productos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Producto eliminado exitosamente
 *       404:
 *         description: Producto no encontrado
 *       500:
 *         description: Error del servidor
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM producto WHERE id_prod = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json({ message: 'Producto eliminado exitosamente', producto: result.rows[0] });
  } catch (err) {
    console.error('Error al eliminar producto:', err.message);
    res.status(500).json({ error: 'Error del servidor' });
  }
});


module.exports = router;
