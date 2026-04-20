import { createConnection } from 'mysql2/promise';

export const mysqlProvider = {
  provide: 'MYSQL_CONNECTION',
  useFactory: async () => {
    const connection = await createConnection({
      host: '8gj4zj.h.filess.io',
      port: 61032,
      user: 'edm_db_feelsince',
      password: '18a2fe119eefb02a487cc74f0cbe7c30c1009ad6',
      database: 'edm_db_feelsince',
    });
    return connection;
  },
};
