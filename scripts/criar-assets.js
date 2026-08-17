const fs = require('fs');
const PNG_1X1 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const buf = Buffer.from(PNG_1X1, 'base64');
const arquivos = [
  'assets/icon.png',
  'assets/splash-icon.png',
  'assets/adaptive-icon.png',
  'assets/favicon.png',
];
arquivos.forEach(f => {
  fs.writeFileSync(f, buf);
  console.log('criado:', f);
});
console.log('OK');
