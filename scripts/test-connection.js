require('dotenv').config();
const pool = require('./db');

async function testConnection() {
  try {
    // Intentar una consulta simple
    const result = await pool.query('SELECT NOW() as current_time');
    console.log('✅ Conexión exitosa a PostgreSQL');
    console.log('Hora actual del servidor:', result.rows[0].current_time);
    
    // Verificar si existe la base de datos
    const dbResult = await pool.query('SELECT current_database() as db_name');
    console.log('Base de datos actual:', dbResult.rows[0].db_name);
    
    // Verificar si el usuario tiene permisos
    try {
      const createTableTest = await pool.query(`
        CREATE TABLE IF NOT EXISTS test_connection (
          id SERIAL PRIMARY KEY,
          test_column VARCHAR(50)
        );
      `);
      console.log('✅ Tienes permisos para crear tablas');
      
      // Limpiar después de la prueba
      await pool.query('DROP TABLE test_connection');
    } catch (permError) {
      console.error('❌ No tienes permisos suficientes:', permError.message);
    }
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error de conexión a PostgreSQL:', err.message);
    console.log('Verifica los siguientes puntos:');
    console.log('1. ¿PostgreSQL está instalado y en ejecución?');
    console.log('2. ¿Las credenciales en el archivo .env son correctas?');
    console.log('3. ¿Existe el usuario "integracion" en PostgreSQL?');
    console.log('4. ¿Existe la base de datos "integracion"?');
    console.log('5. ¿El usuario tiene permisos adecuados?');
    process.exit(1);
  }
}

testConnection();