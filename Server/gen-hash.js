const bcrypt = require('bcrypt');

async function main() {
  const hash = await bcrypt.hash('Test1234!', 10);
  console.log('Hash:', hash);
}

main();