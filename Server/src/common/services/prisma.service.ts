import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';

require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');

// Crear el adapter UNA sola vez fuera de la clase
const dbUrl = process.env.DATABASE_URL;
const adapter = new PrismaMariaDb(dbUrl);

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({ adapter });
  }

  async onModuleInit() {
    await this['$connect']();
  }

  async onModuleDestroy() {
    await this['$disconnect']();
  }
}