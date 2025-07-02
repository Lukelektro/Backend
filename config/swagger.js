const swaggerOptions = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'API Integración',
        version: '1.0.0',
        description: 'API para gestionar productos, categorías, sucursales, pedidos y contacto',
      },
      servers: [
        {
          url: 'http://localhost:5000',
        },
      ],
    },
    apis: ['routes/*.js'],
  };
  
  module.exports = swaggerOptions;
  