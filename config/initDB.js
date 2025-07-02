const axios = require('axios');
const path = require('path');
const bcrypt = require('bcrypt'); 
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { Client, Pool } = require('pg');

async function initDB() {
  const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, PIXABAY_API_KEY } = process.env; // PIXABAY no tiene uso, pero en caso de que se necesite otra API, solo se reemplaza esa, todo lo edmas esta puesto

  console.log('🔐 Verificando credenciales cargadas:');
  console.log('DB_USER:', DB_USER);
  console.log('DB_PASSWORD:', typeof DB_PASSWORD, DB_PASSWORD ? '[OK]' : '[VACÍA]');

  const adminClient = new Client({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: 'postgres'
  });

  try {
    await adminClient.connect();
    console.log('✅ Conectado a PostgreSQL como administrador.');

    const result = await adminClient.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [DB_NAME]
    );``

    if (result.rows.length === 0) {
      console.log(`📦 La base de datos "${DB_NAME}" no existe. Creándola...`);
      await adminClient.query(`CREATE DATABASE "${DB_NAME}"`);
      console.log(`✅ Base de datos "${DB_NAME}" creada exitosamente.`);
    } else {
      console.log(`📂 La base de datos "${DB_NAME}" ya existe.`);
    }

    await adminClient.end();

    const pool = new Pool({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME
    });

    const client = await pool.connect();

    console.log('🔧 Creando tablas nuevas...');
    await client.query('BEGIN');
    await client.query(`
      CREATE TABLE region (
        id_region SERIAL PRIMARY KEY,
        nom_region VARCHAR(100) NOT NULL
      );

      CREATE TABLE comuna (
        id_comuna SERIAL PRIMARY KEY,
        id_region INTEGER REFERENCES region(id_region),
        nom_comuna VARCHAR(100) NOT NULL
      );

      CREATE TABLE sucursal (
        id_sucursal SERIAL PRIMARY KEY,
        nombre_sucursal VARCHAR(100) NOT NULL,
        direccion_sucursal VARCHAR(255) NOT NULL,
        id_comuna INTEGER REFERENCES comuna(id_comuna)
      );

      CREATE TABLE tipo_producto (
        id_tipoprod SERIAL PRIMARY KEY,
        nombre_tipoprod VARCHAR(100) NOT NULL,
        desc_tipoprod TEXT
      );

      CREATE TABLE producto (
        id_prod SERIAL PRIMARY KEY,
        nombre_prod VARCHAR(100) NOT NULL,
        precio_prod DECIMAL(10, 2) NOT NULL,
        stock_prod INTEGER,
        id_tipoprod INTEGER REFERENCES tipo_producto(id_tipoprod),
        imagen_url TEXT,
        destacado_prod BOOLEAN DEFAULT FALSE
      );

      CREATE TABLE inventario (
        id_sucursal INTEGER REFERENCES sucursal(id_sucursal),
        id_prod INTEGER REFERENCES producto(id_prod),
        stock_prod INTEGER,
        stock_min_prod INTEGER,
        estado_inventario VARCHAR(50),
        PRIMARY KEY (id_sucursal, id_prod)
      );

      CREATE TABLE usuario (
        id_usuario SERIAL PRIMARY KEY,
        correo_user VARCHAR(150) UNIQUE NOT NULL,
        pass_hash_user TEXT NOT NULL,
        nombre_user VARCHAR(100),
        apellido_user VARCHAR(100),
        apellido2_user VARCHAR(100)
      );

      CREATE TABLE tipo_empleado (
        id_rol_emp SERIAL PRIMARY KEY,
        nom_rol_emp VARCHAR(20),
        desc_rol_emp VARCHAR(100)
      );

      CREATE TABLE empleado (
        id_usuario INTEGER PRIMARY KEY REFERENCES usuario(id_usuario) ON DELETE CASCADE,
        id_sucursal INTEGER REFERENCES sucursal(id_sucursal),
        id_rol_emp INTEGER REFERENCES tipo_empleado(id_rol_emp),
        fecha_contrato DATE
      );

      CREATE TABLE tipo_pago (
        id_tipopago SERIAL PRIMARY KEY,
        nom_tipopago VARCHAR(50),
        desc_tipopago VARCHAR(100)
      );

      CREATE TABLE medio_pago (
        id_medpago SERIAL PRIMARY KEY,
        id_tipopago INTEGER REFERENCES tipo_pago(id_tipopago),
        token_medpago TEXT,
        pred_medpago BOOLEAN
      );

      CREATE TABLE cliente (
        id_cliente SERIAL PRIMARY KEY,
        id_usuario INTEGER REFERENCES usuario(id_usuario),
        id_medpago INTEGER REFERENCES medio_pago(id_medpago),
        direccion_cli TEXT,
        run_cli NUMERIC(9, 0) UNIQUE,
        dv_run_cli VARCHAR(1)
      );

      CREATE TABLE carrito (
        id_carrito SERIAL PRIMARY KEY,
        id_cliente INTEGER REFERENCES cliente(id_cliente),
        total DECIMAL(10,2),
        fecha_carrito TIMESTAMP
      );

      CREATE TABLE carrito_producto (
        id_carrito INTEGER REFERENCES carrito(id_carrito) ON DELETE CASCADE,
        id_prod INTEGER REFERENCES producto(id_prod),
        cantidad INTEGER,
        precio_unit DECIMAL(10,2),
        precio_total DECIMAL(10,2),
        fecha_carrito TIMESTAMP,
        PRIMARY KEY (id_carrito, id_prod)
      );

      CREATE TABLE estado_pedido (
        id_estado_ped SERIAL PRIMARY KEY,
        nom_estado_ped VARCHAR(50),
        desc_estado_ped VARCHAR(100)
      );

      CREATE TABLE transaccion (
        id_trans SERIAL PRIMARY KEY,
        token_trans TEXT,
        fecha_trans TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE pedido (
        id_pedido SERIAL PRIMARY KEY,
        id_estado_ped INTEGER REFERENCES estado_pedido(id_estado_ped),
        id_cliente INTEGER REFERENCES cliente(id_cliente),
        id_trans INTEGER REFERENCES transaccion(id_trans),
        fecha_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_entrega DATE
      );

      CREATE TABLE detalle_pedido (
        id_detalle_ped SERIAL PRIMARY KEY,
        id_pedido INTEGER REFERENCES pedido(id_pedido) ON DELETE CASCADE,
        id_producto INTEGER REFERENCES producto(id_prod),
        cantidad INTEGER,
        precio_unit DECIMAL(10,2),
        precio_total DECIMAL(10,2),
        nombre_producto VARCHAR(100)
      );

      CREATE TABLE contacto (
        id_contacto SERIAL PRIMARY KEY,
        nombre_contacto VARCHAR(100) NOT NULL,
        correo_contacto VARCHAR(150) NOT NULL,
        mensaje_contacto TEXT NOT NULL,
        telefono_contacto NUMERIC(9, 0),
        fecha_contacto TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE administrador (
        id_admin INTEGER PRIMARY KEY REFERENCES usuario(id_usuario) ON DELETE CASCADE
      );

    `);
    await client.query('COMMIT');
    console.log('✅ Migración de tablas completada con éxito.');

    // 👈 Hashear contraseña antes de insertar
    const hashedAdminPass = await bcrypt.hash('123', 12);
    console.log('🔐 Contraseña hasheada para administradores');
  

    console.log('📥 Insertando datos iniciales...');
    await client.query('BEGIN');
    await client.query(`
      INSERT INTO region (nom_region) VALUES
        ('Región Metropolitana'),
        ('Región de Valparaíso'),
        ('Región del Biobío')
      ON CONFLICT DO NOTHING;

      INSERT INTO comuna (id_region, nom_comuna) VALUES
        (1, 'Santiago'),
        (2, 'Valparaíso'),
        (3, 'Concepción')
      ON CONFLICT DO NOTHING;

      INSERT INTO sucursal (nombre_sucursal, direccion_sucursal, id_comuna) VALUES
        ('Sucursal Centro', 'Av. Principal 123', 1),
        ('Sucursal Puerto', 'Calle Marina 456', 2)
      ON CONFLICT DO NOTHING;
      
      INSERT INTO estado_pedido (id_estado_ped, nom_estado_ped, desc_estado_ped) VALUES
      (1, 'Pendiente', 'Pedido registrado pero pendiente de pago'),
      (2, 'Pagado', 'Pedido con pago confirmado'),
      (3, 'En preparación', 'Pedido siendo preparado para envío'),
      (4, 'Enviado', 'Pedido enviado al cliente'),
      (5, 'Entregado', 'Pedido entregado al cliente'),
      (6, 'Cancelado', 'Pedido cancelado');

      INSERT INTO tipo_producto (nombre_tipoprod, desc_tipoprod) VALUES
        ('Herramientas', 'Herramientas manuales y eléctricas'),
        ('Electricidad', 'Material eléctrico'),
        ('Construcción', 'Materiales de obra'),
        ('Pintura', 'Pinturas, esmaltes y accesorios'),
        ('Jardinería', 'Herramientas y productos para jardín'),
        ('Ferretería', 'Elementos generales: tornillos, pernos, etc.')
      ON CONFLICT DO NOTHING;


      INSERT INTO producto (nombre_prod, precio_prod, stock_prod, id_tipoprod, imagen_url) VALUES
        ('Taladro', 49990, 10, 1, '/images/Taladro.png'),
        ('Destornillador eléctrico', 29990, 15, 1, '/images/Destornillador_electronico.png'),
        ('Caja de herramientas', 39990, 20, 1, '/images/Caja_herramienta.png'),
        ('Alargador', 7990, 25, 2, '/images/Alargador.png'),
        ('Interruptor doble', 1990, 100, 2, '/images/Interruptor_doble.png'),
        ('Portalámparas', 1290, 80, 2, '/images/Porta_lampara.png'),
        ('Cemento', 12000, 50, 3, '/images/Cemento.png'),
        ('Arena gruesa', 6000, 100, 3, '/images/Arena_gruesa.png'),
        ('Plancha OSB', 9500, 40, 3, '/images/Plancha_osb.png'),
        ('Esmalte sintético blanco', 15990, 30, 4, '/images/Esmalte_blanco.png'),
        ('Rodillo para pintar', 2990, 60, 4, '/images/Rodillo_pintura.png'),
        ('Pintura látex color crema', 13990, 25, 4, '/images/Pintura_latex.png'),
        ('Tijera de podar', 7990, 35, 5, '/images/Tijera_podar.png'),
        ('Manguera 15m', 12990, 40, 5, '/images/Manguera.png'),
        ('Abono orgánico 5kg', 4990, 25, 5, '/images/Abono_organico.png'),
        ('Caja de clavos 1"', 1990, 100, 6, '/images/Caja_clavos.png'),
        ('Pack de tornillos 2"', 2490, 120, 6, '/images/Caja_tornillos.png'),
        ('Bisagra metálica 3"', 990, 70, 6, '/images/Bisagra_metalica.png')
      ON CONFLICT DO NOTHING;

      INSERT INTO tipo_empleado (nom_rol_emp, desc_rol_emp) VALUES
        ('Administrador', 'Acceso total'),
        ('Vendedor', 'Atención al cliente')
      ON CONFLICT DO NOTHING;

      INSERT INTO usuario (correo_user, pass_hash_user, nombre_user, apellido_user, apellido2_user) VALUES
        ('admin@ejemplo.com', 'hashed_pass', 'Admin', 'Uno', 'Dos'),
        ('cliente@ejemplo.com', 'hashed_pass', 'Cliente', 'Tres', 'Cuatro')
      ON CONFLICT DO NOTHING;

      INSERT INTO tipo_pago (nom_tipopago, desc_tipopago) VALUES
        ('Tarjeta', 'Pago con tarjeta'),
        ('Efectivo', 'Pago en efectivo')
      ON CONFLICT DO NOTHING;

      INSERT INTO medio_pago (id_tipopago, token_medpago, pred_medpago) VALUES
        (1, 'token123', true),
        (2, 'token456', false)
      ON CONFLICT DO NOTHING;

      INSERT INTO cliente (id_usuario, id_medpago, direccion_cli, run_cli, dv_run_cli) VALUES
        (2, 1, 'Calle Falsa 123', 12345678, '9')
      ON CONFLICT DO NOTHING;
      
      UPDATE producto SET destacado_prod = true WHERE id_prod IN (1, 2);
    `);
    // Insertar cada administrador por separado
    await client.query(
      'INSERT INTO usuario (correo_user, pass_hash_user, nombre_user, apellido_user, apellido2_user) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING',
      ['lukas@admin.com', hashedAdminPass, 'Lukas', 'Admin', 'Sistema']
    );
    await client.query(
      'INSERT INTO usuario (correo_user, pass_hash_user, nombre_user, apellido_user, apellido2_user) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING',
      ['franco@admin.com', hashedAdminPass, 'Franco', 'Admin', 'Sistema']
    );
    await client.query(
      'INSERT INTO usuario (correo_user, pass_hash_user, nombre_user, apellido_user, apellido2_user) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING',
      ['martin@admin.com', hashedAdminPass, 'Martin', 'Admin', 'Sistema']
    );
    // Insertar registros de administrador
    await client.query(`
      INSERT INTO administrador (id_admin) VALUES
        ((SELECT id_usuario FROM usuario WHERE correo_user = 'lukas@admin.com')),
        ((SELECT id_usuario FROM usuario WHERE correo_user = 'franco@admin.com')),
        ((SELECT id_usuario FROM usuario WHERE correo_user = 'martin@admin.com'))
      ON CONFLICT DO NOTHING;
    `);

    await client.query('COMMIT');
    console.log('✅ Datos insertados correctamente.');

    client.release();
    await pool.end();
  } catch (err) {
    console.error('❌ Error al inicializar la base de datos:', err.message);
    process.exit(1);
  }
}

initDB();