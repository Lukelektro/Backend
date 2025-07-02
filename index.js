require('dotenv').config();
const express = require('express');
const cors = require('cors');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const app = require('./app');
const path = require('path');

// Configuración Swagger
console.log('Cargando configuraciones de Swagger...');
const swaggerOptions = require('./config/swagger');
const swaggerDocs = swaggerJsDoc(swaggerOptions);
console.log('Configuraciones de Swagger cargadas correctamente.');

// Middlewares
console.log('Configurando middlewares...');
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());
console.log('Middlewares configurados.');

//imagenes
app.use('/images', express.static(path.join(__dirname, 'images')));

// Documentación Swagger
console.log('Configurando documentación Swagger...');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
console.log('Documentación Swagger disponible en /api-docs');

// Rutas
console.log('Cargando rutas...');

const webpayRoutes = require('./routes/webpay');
console.log('Ruta /api/webpay cargada.');

const productoRoutes = require('./routes/producto');
console.log('Ruta /api/producto cargada.');

const tipoProductoRoutes = require('./routes/tipo_producto');
console.log('Ruta /api/tipo-producto cargada.');

const sucursalRoutes = require('./routes/sucursal');
console.log('Ruta /api/sucursal cargada.');

const pedidosRoutes = require('./routes/pedidos');
console.log('Ruta /api/pedido cargada.');

const contactoRoutes = require('./routes/contacto');
console.log('Ruta /api/contacto cargada.');

const monedaRoutes = require('./routes/moneda');
console.log('Ruta /api/moneda cargada.');

const testRoutes = require('./routes/test');
console.log('Ruta /api/test cargada.');

const authRoutes = require('./auth/auth.routes');
console.log('Ruta /api/auth cargada.');

const uploadRoutes = require('./routes/upload');
console.log('Ruta /api/upload cargada.');

// Registro de rutas
app.use('/api/producto', productoRoutes);
app.use('/api/tipo-producto', tipoProductoRoutes);
app.use('/api/sucursal', sucursalRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/contacto', contactoRoutes);
app.use('/api/moneda', monedaRoutes);
app.use('/api/test', testRoutes);
app.use('/api/webpay', webpayRoutes);
app.use('/api/auth', authRoutes);
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/api/upload', uploadRoutes);

// Ruta de prueba
app.get('/api/test', (req, res) => {
  console.log('Solicitud recibida en /api/test');
  res.json({ message: 'API funcionando correctamente' });
});

// NO TOCAR, YA LO ARREGLE DEJENLO TAL CUAL NO HAGAN NADA O ME SUICIDO
app.use((req, res) => {
  console.log(`Ruta no encontrada: ${req.originalUrl}`);
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Levantar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Servidor backend en http://localhost:${PORT}`));
