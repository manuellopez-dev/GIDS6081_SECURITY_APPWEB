import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/common/services/prisma.service';
import { UtilService } from 'src/common/services/util.service';
import { AuditService } from 'src/modules/audit/interface/audit.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private utilService: UtilService,
    private jwtService: JwtService,
    private auditService: AuditService,
  ) {}

  async register(
    name: string, 
    lastName: string, 
    username: string, 
    email: string, 
    password: string
  ) {
    const hashedPassword = await this.utilService.hashPassword(password);

    const user = await this.prisma.user.create({
      data: {
        name,
        lastName,
        username,
        email,
        password: hashedPassword,
        role: 'user' // rol por defecto
      },
    });

    // Registrar evento de auditoria
    await this.auditService.log({
      userId: user.id,
      username: user.username,
      action: 'REGISTER',
      detail: `Usuario ${user.username} se registró exitosamente`,
      severity: 'INFO',
    });

    const payload = {
      sub: user.id,
      username: user.username,
      name: user.name,
      lastName: user.lastName,
      role: user.role, // incluir role en el jwt
    };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '1d' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  async login(username: string, password: string) {
    const user = await this.prisma.user.findFirst({
      where: { username },
    });

    if (!user) {
      await this.auditService.log({
        userId: undefined,
        username: username,
        action: 'LOGIN_FAILED',
        detail: `Intento de login fallido para el usuario: ${username} (usuario no existe)`,
        severity: 'WARNING',
      })
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isPasswordValid = await this.utilService.checkPassword(
      password,
      user.password,
    );

    // Contraseña incorrecta - registrar login fallido
    if (!isPasswordValid) {
      await this.auditService.log({
        userId: user.id,
        username: user.username,
        action: 'LOGIN_FAILED',
        detail: `Intento de login fallido para el usuario: ${username} (contraseña incorrecta)`,
        severity: 'WARNING',
      });
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Login Exitoso
    await this.auditService.log({
      userId: user.id,
      username: user.username,
      action: 'LOGIN_SUCCESS',
      detail: `Usuario ${user.username} inició sesión exitosamente`,
      severity: 'INFO',
    });

    const payload = {
      sub: user.id,
      username: user.username,
      name: user.name,
      lastName: user.lastName,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '60s' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    return {
      accessToken,
      refreshToken,
    };
  }
}
