// Script para generar un hash bcrypt válido
// Ejecuta: node server/scripts/generate_hash.js

const bcrypt = require('bcryptjs');

const password = 'instructor123';

bcrypt.hash(password, 10, (err, hash) => {
  if (err) {
    console.error('Error al generar hash:', err);
    return;
  }
  
  console.log('\n=== Hash bcrypt generado ===');
  console.log('Contraseña:', password);
  console.log('Hash:', hash);
  console.log('\n=== SQL para actualizar ===');
  console.log(`UPDATE usuarios SET password = '${hash}' WHERE email = 'instructor@demo.com';`);
  console.log('\n');
  
  // Verificar que el hash funciona
  bcrypt.compare(password, hash, (err, result) => {
    if (err) {
      console.error('Error al verificar:', err);
      return;
    }
    console.log('✓ Hash verificado correctamente:', result);
  });
});

