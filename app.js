require('dotenv').config();
const express = require('express');
const cors = require('cors');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const path = require('path');

const app = express();

// Solo mostrar logs si no estamos en modo test
const isTestMode = process.env.NODE_ENV === 'test';

// Configuración Swagger
if (!isTestMode) console.log('Cargando configuraciones de Swagger...');
const swaggerOptions = require('./config/swagger');
const swaggerDocs = swaggerJsDoc(swaggerOptions);
if (!isTestMode) console.log('Configuraciones de Swagger cargadas correctamente.');

// Middlewares
if (!isTestMode) console.log('Configurando middlewares...');
// CORS configurado correctamente para local y producción
const allowedOrigins = [
  'http://localhost:3000',
  'https://frontend-d6bb3n9tk-lukelektros-projects.vercel.app' // NO CAMBIAR, SOLO SI SE ACTUALIZA EL DOMINIO
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log(`❌ CORS bloqueado para origen: ${origin}`);
      callback(new Error('No autorizado por política CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());
if (!isTestMode) console.log('Middlewares configurados.');

//imagenes
app.use('/images', express.static(path.join(__dirname, 'images')));

// Documentación Swagger
if (!isTestMode) console.log('Configurando documentación Swagger...');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
if (!isTestMode) console.log('Documentación Swagger disponible en /api-docs');

// Rutas
if (!isTestMode) console.log('Cargando rutas...');

const webpayRoutes = require('./routes/webpay');
if (!isTestMode) console.log('Ruta /api/webpay cargada.');

const productoRoutes = require('./routes/producto');
if (!isTestMode) console.log('Ruta /api/producto cargada.');

const tipoProductoRoutes = require('./routes/tipo_producto');
if (!isTestMode) console.log('Ruta /api/tipo-producto cargada.');

const sucursalRoutes = require('./routes/sucursal');
if (!isTestMode) console.log('Ruta /api/sucursal cargada.');

const pedidosRoutes = require('./routes/pedidos');
if (!isTestMode) console.log('Ruta /api/pedido cargada.');

const contactoRoutes = require('./routes/contacto');
if (!isTestMode) console.log('Ruta /api/contacto cargada.');

const monedaRoutes = require('./routes/moneda');
if (!isTestMode) console.log('Ruta /api/moneda cargada.');

const testRoutes = require('./routes/test');
if (!isTestMode) console.log('Ruta /api/test cargada.');

const authRoutes = require('./auth/auth.routes');
if (!isTestMode) console.log('Ruta /api/auth cargada.');

const uploadRoutes = require('./routes/upload');
if (!isTestMode) console.log('Ruta /api/upload cargada.');

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
  if (!isTestMode) console.log('Solicitud recibida en /api/test');
  res.json({ message: 'API funcionando correctamente' });
});

// NO TOCAR, YA LO ARREGLE DEJENLO TAL CUAL NO HAGAN NADA O ME SUICIDO
app.use((req, res) => {
  if (!isTestMode) console.log(`Ruta no encontrada: ${req.originalUrl}`);
  res.status(404).json({ error: 'Ruta no encontrada' });
});

module.exports = app;