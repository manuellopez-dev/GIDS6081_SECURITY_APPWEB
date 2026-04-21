import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto, UpdateUserDto } from '../dto/create-user.dto';
import { User } from '../entities/user.entity';
import { UtilService } from 'src/common/services/util.service';
import { AuthGuard } from 'src/common/guards/auth.guards';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { AuditService } from 'src/modules/audit/interface/audit.service';

@Controller('/api/user')
@UseGuards(AuthGuard, RolesGuard)
export class UserController {
  constructor(
    private usersvc: UserService,
    private utilSvc: UtilService,
    private auditService: AuditService,
  ) {}

  // Solo admin puede ver la lista completa de usuarios
  @Get('')
  @Roles('admin')
  async getAllUsers() {
    return await this.usersvc.getAllUsers();
  }

  // Cualquier usuario autenticado puede ver un perfil
  // pero el service filtra los campos según si es dueño o admin
  @Get(':id')
  async getUserById(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
  ): Promise<Omit<User, 'password'> | null> {
    return await this.usersvc.getUserById(id, req.user.sub, req.user.role);
  }

  // Solo admin puede crear usuarios desde este endpoint
  // (el registro público va por /api/auth/register)
  @Post('')
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  async insertUser(@Body() user: CreateUserDto): Promise<Omit<User, 'password'>> {
    const encryptedPassword = await this.utilSvc.hashPassword(user.password);
    user.password = encryptedPassword;
    return await this.usersvc.insertUser(user);
  }

  // Actualizar perfil — el service verifica ownership (prevención IDOR)
  @Put(':id')
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() userUpdate: UpdateUserDto,
    @Req() req: any,
  ): Promise<Omit<User, 'password'>> {
    if (userUpdate.password) {
      userUpdate.password = await this.utilSvc.hashPassword(userUpdate.password);
    }
    return await this.usersvc.updateUser(
      id,
      req.user.sub,
      req.user.role,
      userUpdate,
    );
  }

  // Solo admin puede eliminar usuarios
  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async deleteUser(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
  ): Promise<boolean> {
    await this.usersvc.deleteUser(id);

    await this.auditService.log({
      userId: req.user.sub,
      username: req.user.username,
      action: 'USER_DELETED',
      detail: `Admin ${req.user.username} eliminó al usuario con id: ${id}`,
      severity: 'CRITICAL',
    });

    return true;
  }

  // Solo admin puede cambiar roles
  @Put(':id/role')
  @Roles('admin')
  async changeRole(
    @Param('id', ParseIntPipe) id: number,
    @Body('role') newRole: string,
    @Req() req: any,
  ): Promise<Omit<User, 'password'>> {
    const updated = await this.usersvc.changeRole(id, newRole);

    await this.auditService.log({
      userId: req.user.sub,
      username: req.user.username,
      action: 'ROLE_CHANGED',
      detail: `Admin ${req.user.username} cambió el rol del usuario id: ${id} a: ${newRole}`,
      severity: 'CRITICAL',
    });

    return updated;
  }
}