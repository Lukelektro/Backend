const router = require('express').Router();
const { WebpayPlus } = require('transbank-sdk');
const pool = require('../config/db');

// Inicializar WebPay en modo de integración (desarrollo)
const webpay = new WebpayPlus.Transaction(
  '597055555532',
  '579B532A7440BB0C9079DED94D31EA1615BACEB56610332264630D42D0A36B1C',
  'TEST'
);

/**
 * @swagger
 * /api/webpay/create:
 *   post:
 *     summary: Iniciar una transacción WebPay (modo simulación)
 *     tags: [WebPay]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - buyOrder
 *               - sessionId
 *               - amount
 *               - returnUrl
 *             properties:
 *               buyOrder:
 *                 type: string
 *                 description: Número único de orden de compra
 *                 example: "ORD-123456"
 *               sessionId:
 *                 type: string
 *                 description: Identificador único de sesión
 *                 example: "SID-987654"
 *               amount:
 *                 type: number
 *                 description: Monto total a pagar
 *                 example: 15000
 *               returnUrl:
 *                 type: string
 *                 description: URL de retorno después de completar el pago
 *                 example: "http://localhost:3000/pago-exitoso"
 *     responses:
 *       200:
 *         description: URL y token generados para el pago
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                   example: "http://localhost:3000/webpay-simulator?token=SIM-12345&amount=15000"
 *                 token:
 *                   type: string
 *                   example: "SIM-12345"
 *       400:
 *         description: Faltan campos obligatorios
 *       500:
 *         description: Error del servidor
 */
router.post('/create', async (req, res) => {
  try {
    const { buyOrder, sessionId, amount, returnUrl } = req.body;

    if (!buyOrder || !sessionId || !amount || !returnUrl) {
      return res.status(400).json({
        error: 'Faltan campos obligatorios (buyOrder, sessionId, amount, returnUrl)'
      });
    }

    const simulatedToken = `SIM-${Date.now()}`;

    await pool.query(
      'INSERT INTO transaccion (token_trans, fecha_trans) VALUES ($1, CURRENT_TIMESTAMP) RETURNING id_trans',
      [simulatedToken]
    );

    return res.json({
      url: `http://localhost:3000/webpay-simulator?token=${simulatedToken}&amount=${amount}`,
      token: simulatedToken
    });

  } catch (error) {
    console.error('Error al crear transacción WebPay:', error.message);
    res.status(500).json({ error: 'Error al procesar el pago' });
  }
});

/**
 * @swagger
 * /api/webpay/commit:
 *   get:
 *     summary: Confirmar una transacción WebPay (simulación o real)
 *     tags: [WebPay]
 *     parameters:
 *       - in: query
 *         name: token_ws
 *         required: true
 *         schema:
 *           type: string
 *         description: Token entregado por WebPay luego del intento de pago
 *     responses:
 *       302:
 *         description: Redirección a página de éxito o fallo según estado de la transacción
 *       400:
 *         description: Token no proporcionado
 *       500:
 *         description: Error del servidor durante la confirmación del pago
 */
router.get('/commit', async (req, res) => {
  try {
    const { token_ws } = req.query;

    if (!token_ws) {
      return res.status(400).json({ error: 'Token no proporcionado' });
    }

    if (token_ws.startsWith('SIM-')) {
      const simulatedResponse = {
        status: 'AUTHORIZED',
        amount: 1000,
        buy_order: 'simulated-order',
        session_id: 'simulated-session',
        card_detail: {
          card_number: '1234'
        },
        accounting_date: new Date().toISOString().split('T')[0],
        transaction_date: new Date().toISOString(),
        authorization_code: 'SIM123',
        payment_type_code: 'VN',
        installments_number: 0,
        vci: 'TSY'
      };

      await pool.query(
        'UPDATE pedido SET id_estado_ped = 2 WHERE id_pedido = (SELECT id_pedido FROM pedido WHERE id_estado_ped = 1 ORDER BY fecha_pedido DESC LIMIT 1)'
      );

      return res.redirect('http://localhost:3000/pago-exitoso?token=' + token_ws);
    }

    const response = await webpay.commit(token_ws);

    if (response.status === 'AUTHORIZED') {
      await pool.query(
        'UPDATE pedido SET id_estado_ped = 2 WHERE id_trans = (SELECT id_trans FROM transaccion WHERE token_trans = $1)',
        [token_ws]
      );

      return res.redirect('http://localhost:3000/pago-exitoso?token=' + token_ws);
    } else {
      return res.redirect('http://localhost:3000/pago-fallido?token=' + token_ws);
    }

  } catch (error) {
    console.error('Error al confirmar transacción WebPay:', error.message);
    res.redirect('http://localhost:3000/pago-fallido');
  }
});

module.exports = router;
