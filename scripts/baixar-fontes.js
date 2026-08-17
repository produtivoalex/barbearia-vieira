const https = require('https');
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'assets', 'fonts');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const fonts = [
  ['Montserrat-Regular',  'https://fonts.gstatic.com/s/montserrat/v29/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCtr6Hw5aX8.ttf'],
  ['Montserrat-Medium',   'https://fonts.gstatic.com/s/montserrat/v29/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCuM73w5aX8.ttf'],
  ['Montserrat-SemiBold', 'https://fonts.gstatic.com/s/montserrat/v29/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCu173w5aX8.ttf'],
  ['Montserrat-Bold',     'https://fonts.gstatic.com/s/montserrat/v29/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCuM73w5aX8.ttf'],
];

let done = 0;

fonts.forEach(([name, url]) => {
  const dest = path.join(dir, name + '.ttf');
  const file = fs.createWriteStream(dest);
  https.get(url, (res) => {
    res.pipe(file);
    file.on('finish', () => {
      file.close();
      const size = fs.statSync(dest).size;
      console.log('OK: ' + name + ' (' + size + ' bytes)');
      done++;
      if (done === fonts.length) console.log('\nTODAS FONTES BAIXADAS');
    });
  }).on('error', (err) => {
    console.error('ERRO: ' + name + ' - ' + err.message);
  });
});
