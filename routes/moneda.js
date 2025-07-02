const router = require('express').Router();
const axios = require('axios');

/**
 * @swagger
 * components:
 *   schemas:
 *     ConversionResult:
 *       type: object
 *       properties:
 *         monto_original:
 *           type: number
 *           description: "Monto original a convertir"
 *           example: 100
 *         moneda_origen:
 *           type: string
 *           description: "Código de moneda de origen (ej: USD, EUR)"
 *           example: "USD"
 *         monto_clp:
 *           type: number
 *           description: "Monto convertido en pesos chilenos (CLP)"
 *           example: 87000
 *         tasa_conversion:
 *           type: number
 *           description: "Tasa de cambio aplicada"
 *           example: 870
 *         fecha:
 *           type: string
 *           format: date-time
 *           description: "Fecha y hora de la conversión"
 *           example: "2025-05-21T23:40:00.000Z"
 */

/**
 * @swagger
 * /api/moneda/convertir:
 *   get:
 *     summary: "Convertir una moneda extranjera a CLP (peso chileno)"
 *     tags: [Moneda]
 *     parameters:
 *       - in: query
 *         name: monto
 *         schema:
 *           type: number
 *         required: true
 *         description: "Monto que se desea convertir"
 *         example: 100
 *       - in: query
 *         name: moneda
 *         schema:
 *           type: string
 *         required: true
 *         description: "Código de la moneda de origen (ejemplo: USD, EUR, BRL)"
 *         example: "USD"
 *     responses:
 *       200:
 *         description: "Resultado exitoso de la conversión"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ConversionResult'
 *       400:
 *         description: "Parámetros inválidos o faltantes"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Missing required query parameters: monto or moneda"
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


router.get('/convertir', async (req, res) => {
  const { monto, moneda } = req.query;

  console.log('Query parameters:', req.query);

  if (!monto || !moneda) {
    return res.status(400).json({ error: 'Missing required query parameters: monto or moneda' });
  }

  try {
    const response = await axios.get(`https://api.exchangerate-api.com/v4/latest/${moneda}`);
    const tasaConversion = response.data.rates.CLP;
    const montoCLP = monto * tasaConversion;

    res.json({
      monto_original: parseFloat(monto),
      moneda_origen: moneda,
      monto_clp: montoCLP,
      tasa_conversion: tasaConversion,
      fecha: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Error fetching exchange rate:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
