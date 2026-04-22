const { PrismaMariaDb } = require('@prisma/adapter-mariadb');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const adapter = new PrismaMariaDb(process.env.DATABASE_URL);
const prisma = new PrismaClient({ adapter });

prisma.$connect()
  .then(() => {
    console.log('CONECTADO exitosamente');
    process.exit(0);
  })
  .catch((e) => {
    console.log('ERROR:', e.message);
    process.exit(1);
  });