// server/auth/auth.routes.js
const router = require('express').Router();
const { register, login, refreshToken, updateProfile, changePassword, getProfile } = require('./auth.controller');
const authenticate = require('./authenticate.js');

router.post('/register', register);
router.post('/login',    login);
router.post('/refresh',  refreshToken);

/* NUEVO endpoint protegido */
router.get('/me', authenticate, (req, res) => {
  // req.user viene del middleware
  const { sub: id, correo, rol } = req.user;
  res.json({ id, correo, rol });
});

/* Nuevas rutas para perfil */
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.put('/password', authenticate, changePassword);

module.exports = router;