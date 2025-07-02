// server/__tests__/productos.test.js
const request = require('supertest');
const express = require('express');
const productosRoutes = require('../routes/producto');

const app = express();
app.use(express.json());
app.use('/api/producto', productosRoutes);

describe('API de Productos', () => {
  test('GET /api/producto retorna lista de productos', async () => {
    const response = await request(app)
      .get('/api/producto')
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    if (response.body.length > 0) {
      expect(response.body[0]).toHaveProperty('id_prod');
      expect(response.body[0]).toHaveProperty('nombre_prod');
      expect(response.body[0]).toHaveProperty('precio_prod');
    }
  });
});