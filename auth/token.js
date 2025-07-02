// helpers para firmar y verificar JWT
const jwt = require('jsonwebtoken');

function genAccess(payload) {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: Number(process.env.ACCESS_EXPIRES || 900) // 15 min por defecto
  });
}

function genRefresh(payload) {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: Number(process.env.REFRESH_EXPIRES || 604800) // 7 días
  });
}

module.exports = { genAccess, genRefresh };
