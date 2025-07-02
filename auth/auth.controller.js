// server/auth/auth.controller.js
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');
const pool       = require('../config/db');
const { genAccess, genRefresh } = require('./token');

/* ---------- Registro cliente ---------- */
exports.register = async (req, res) => {
  const { correo, password, nombre, apellido, apellido2 } = req.body;

  // 1️⃣ comprobar duplicado
  const dup = await pool.query(
    'SELECT 1 FROM usuario WHERE correo_user = $1',
    [correo]
  );
  if (dup.rowCount)
    return res.status(409).json({ error: 'Correo ya registrado' });

  // 2️⃣ insertar en usuario
  const hash = await bcrypt.hash(password, 12);
  const { rows } = await pool.query(
    `INSERT INTO usuario (correo_user, pass_hash_user, nombre_user, apellido_user, apellido2_user)
     VALUES ($1,$2,$3,$4,$5) RETURNING id_usuario, correo_user`,
    [correo, hash, nombre, apellido, apellido2]
  );
  const usuario = rows[0];

  // 3️⃣ (opcional) insertar en cliente para habilitar carrito
  await pool.query(
    'INSERT INTO cliente (id_usuario) VALUES ($1)',
    [usuario.id_usuario]
  );

  res.status(201).json({ message: 'Registro exitoso' });
};

/* ---------- Login (todos los roles) ---------- */
exports.login = async (req, res) => {
  const { correo, password } = req.body;

  // buscar en usuario
  const { rows } = await pool.query(
    'SELECT id_usuario, correo_user, pass_hash_user FROM usuario WHERE correo_user = $1',
    [correo]
  );
  const user = rows[0];
  if (!user || !(await bcrypt.compare(password, user.pass_hash_user)))
    return res.status(401).json({ error: 'Credenciales inválidas' });

  // detectar rol principal: administrador, empleado o cliente
  let rol = 'cliente';
  const isAdmin = await pool.query(
    'SELECT 1 FROM administrador WHERE id_admin = $1',
    [user.id_usuario]
  );
  if (isAdmin.rowCount) rol = 'admin';
  else {
    const isEmpleado = await pool.query(
      'SELECT 1 FROM empleado WHERE id_usuario = $1',
      [user.id_usuario]
    );
    if (isEmpleado.rowCount) rol = 'empleado';
  }

  const payload = { sub: user.id_usuario, correo: user.correo_user, rol };
  res.json({
    access:  genAccess(payload),
    refresh: genRefresh(payload),
  });
};

/* ---------- Obtener Perfil ---------- */
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.sub;

    const { rows } = await pool.query(
      'SELECT nombre_user, apellido_user, apellido2_user, correo_user FROM usuario WHERE id_usuario = $1',
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const user = rows[0];
    res.json({
      nombre: user.nombre_user,
      apellido: user.apellido_user,
      apellido2: user.apellido2_user,
      correo: user.correo_user
    });
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/* ---------- Actualizar Perfil ---------- */
exports.updateProfile = async (req, res) => {
  try {
    const { nombre, apellido, apellido2 } = req.body;
    const userId = req.user.sub;

    const { rows } = await pool.query(
      `UPDATE usuario 
       SET nombre_user = $1, apellido_user = $2, apellido2_user = $3 
       WHERE id_usuario = $4 
       RETURNING nombre_user, apellido_user, apellido2_user, correo_user`,
      [nombre, apellido, apellido2, userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const user = rows[0];
    res.json({
      message: 'Perfil actualizado correctamente',
      user: {
        nombre: user.nombre_user,
        apellido: user.apellido_user,
        apellido2: user.apellido2_user,
        correo: user.correo_user
      }
    });
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/* ---------- Cambiar Contraseña ---------- */
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.sub;

    // Verificar contraseña actual
    const { rows } = await pool.query(
      'SELECT pass_hash_user FROM usuario WHERE id_usuario = $1',
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const user = rows[0];
    const isValidPassword = await bcrypt.compare(currentPassword, user.pass_hash_user);

    if (!isValidPassword) {
      return res.status(400).json({ error: 'Contraseña actual incorrecta' });
    }

    // Hashear nueva contraseña
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Actualizar contraseña
    await pool.query(
      'UPDATE usuario SET pass_hash_user = $1 WHERE id_usuario = $2',
      [hashedNewPassword, userId]
    );

    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/* ---------- Refresh ---------- */
exports.refreshToken = (req, res) => {
  const { refresh } = req.body;
  if (!refresh) return res.status(401).json({ error: 'Refresh token requerido' });

  try {
    const decoded = jwt.verify(refresh, process.env.JWT_REFRESH_SECRET);
    const payload = { sub: decoded.sub, correo: decoded.correo, rol: decoded.rol };
    res.json({
      access: genAccess(payload),
    });
  } catch {
    res.status(401).json({ error: 'Refresh token inválido' });
  }
};