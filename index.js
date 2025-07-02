// index.js
const app = require('./app');
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Servidor backend escuchando en el puerto: ${PORT}`);
});
