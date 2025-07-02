const router = require('express').Router();
const pool = require('../config/db');

/**
 * @swagger
 * components:
 *   schemas:
 *     Contacto:
 *       type: object
 *       required:
 *         - nombre
 *         - email
 *         - mensaje
 *       properties:
 *         nombre:
 *           type: string
 *           description: "Nombre de la persona que envía el mensaje"
 *           example: "María López"
 *         email:
 *           type: string
 *           format: email
 *           description: "Correo electrónico de contacto"
 *           example: "maria@example.com"
 *         telefono:
 *           type: string
 *           description: "Número de teléfono de contacto (opcional)"
 *           example: "+56912345678"
 *         mensaje:
 *           type: string
 *           description: "Contenido del mensaje"
 *           example: "Hola, tengo una consulta sobre un producto."
 */

/**
 * @swagger
 * /api/contacto:
 *   post:
 *     summary: "Enviar un mensaje de contacto"
 *     tags: [Contacto]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Contacto'
 *     responses:
 *       200:
 *         description: "Mensaje enviado correctamente"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Message submitted successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Contacto'
 *       500:
 *         description: "Error interno del servidor"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Server error"
 */

router.post('/', async (req, res) => {
  const { nombre, email, telefono, mensaje } = req.body;

  console.log('Request body:', req.body);

  try {
    const result = await pool.query(
      'INSERT INTO contacto (nombre_contacto, correo_contacto, telefono_contacto, mensaje_contacto) VALUES ($1, $2, $3, $4) RETURNING *',
      [nombre, email, telefono, mensaje]
    );

    res.status(200).json({
      message: 'Message submitted successfully',
      data: result.rows[0],
    });
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
