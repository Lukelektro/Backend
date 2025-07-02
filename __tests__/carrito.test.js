const request = require('supertest');
const app = require('../app'); // Importar app en lugar de index
const pool = require('../config/db');

describe('Carrito Integration Tests', () => {
  // Setup para limpiar después de las pruebas
  afterAll(async () => {
    // Cerrar conexión de la base de datos
    await pool.end();
  });

  test('Debería obtener un producto específico', async () => {
    const res = await request(app)
      .get('/api/producto/1');
    
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id_prod');
    expect(res.body).toHaveProperty('stock_prod');
    expect(res.body).toHaveProperty('precio_prod');
  });

  test('Debería obtener lista de productos', async () => {
    const res = await request(app)
      .get('/api/producto');
    
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test('Debería crear un pedido y reducir stock', async () => {
    // 1. Obtener producto inicial
    const productRes = await request(app)
      .get('/api/producto/1');
    
    expect(productRes.status).toBe(200);
    const stockInicial = productRes.body.stock_prod;
    
    // 2. Crear pedido
    const pedidoData = {
      cliente_id: 1,
      estado_id: 1,
      productos: [{
        producto_id: 1,
        cantidad: 2,
        precio_unitario: productRes.body.precio_prod
      }]
    };
    
    const pedidoRes = await request(app)
      .post('/api/pedidos')
      .send(pedidoData);
      
    expect(pedidoRes.status).toBe(201);
    expect(pedidoRes.body).toHaveProperty('pedido_id');
    
    // 3. Verificar que el stock se redujo
    const productUpdated = await request(app)
      .get('/api/producto/1');
    
    expect(productUpdated.status).toBe(200);
    expect(productUpdated.body.stock_prod).toBe(stockInicial - 2);
  });

  test('No debería permitir pedido con stock insuficiente', async () => {
    // Obtener producto
    const productRes = await request(app)
      .get('/api/producto/1');
    
    const pedidoData = {
      cliente_id: 1,
      estado_id: 1,
      productos: [{
        producto_id: 1,
        cantidad: productRes.body.stock_prod + 10, // Más del stock disponible
        precio_unitario: productRes.body.precio_prod
      }]
    };
    
    const res = await request(app)
      .post('/api/pedidos')
      .send(pedidoData);
      
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Stock insuficiente');
  });
});