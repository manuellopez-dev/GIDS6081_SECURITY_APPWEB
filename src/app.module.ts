import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CommonModule } from './common/common.module';
import { AuthModule } from './modules/auth/interface/auth.module';
import { TaskModule } from './modules/task/interface/task.module';
import { UserModule } from './modules/user/interface/user.module';
import { AuditModule } from './modules/audit/interface/audit.nodule';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CommonModule,
    AuthModule,
    TaskModule,
    UserModule,
    AuditModule,
  ],
})
export class AppModule {}
