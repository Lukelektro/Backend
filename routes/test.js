const router = require('express').Router();

/**
 * @swagger
 * /api/test:
 *   get:
 *     summary: Ruta de prueba
 *     tags: [Test]
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/', (req, res) => {
  res.json({ message: 'Funciona correctamente' });
});

module.exports = router;
