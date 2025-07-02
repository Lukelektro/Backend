// Configuración global para las pruebas
process.env.NODE_ENV = 'test';

// Cargar variables de entorno desde .env (si no están ya cargadas)
require('dotenv').config();

// Para pruebas, usar valores por defecto seguros si no están definidas
process.env.DB_HOST = process.env.DB_HOST || 'localhost';
process.env.DB_PORT = process.env.DB_PORT || '5432';
process.env.DB_USER = process.env.DB_USER || 'testuser';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'testpass';
process.env.DB_NAME = process.env.DB_NAME || 'testdb';
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'test-access-secret';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret';
process.env.ACCESS_EXPIRES = process.env.ACCESS_EXPIRES || '900';
process.env.REFRESH_EXPIRES = process.env.REFRESH_EXPIRES || '604800';

// Silenciar logs molestos durante las pruebas
const originalConsoleLog = console.log;

console.log = (...args) => {
  const message = args.join(' ');
  // Filtrar logs de configuración que no necesitamos ver en tests
  if (!message.includes('Ruta') && 
      !message.includes('cargada') && 
      !message.includes('Configurando') &&
      !message.includes('Swagger') &&
      !message.includes('Middlewares') &&
      !message.includes('Conectado a PostgreSQL') &&
      !message.includes('✅') &&
      !message.includes('Productos obtenidos')) {
    originalConsoleLog(...args);
  }
};

// Timeout para pruebas que puedan tardar más
jest.setTimeout(30000);

// Limpiar después de cada test
afterEach(() => {
  jest.clearAllMocks();
});

// Cleanup global después de todas las pruebas
afterAll(async () => {
  // Cerrar cualquier conexión abierta
  if (global.gc) {
    global.gc();
  }
});