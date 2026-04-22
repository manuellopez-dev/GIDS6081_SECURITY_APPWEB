import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { User } from '../entities/user.entity';
import { CreateUserDto, UpdateUserDto } from '../dto/create-user.dto';
import { PrismaService } from 'src/common/services/prisma.service';

@Injectable()
export class UserService {
  constructor(
    @Inject('MYSQL_CONNECTION') private mysql: any,
    private prisma: PrismaService,
  ) {}

  // Lista todos los usuarios — campos sensibles excluidos (sin password, sin refreshToken)
  public async getAllUsers() {
  return await this.prisma.user.findMany({
    orderBy: [{ name: 'asc' }],
    select: {
      id: true,
      name: true,
      lastName: true,
      username: true,
      role: true,
      createdAt: true,
    },
  });
}

  // Ver perfil por id — el propio usuario ve su email, otros no
  public async getUserById(
    id: number,
    requestingUserId: number,
    requestingUserRole: string,
  ): Promise<Omit<User, 'password'> | null> {
    const isOwnerOrAdmin =
      requestingUserId === id || requestingUserRole === 'admin';

    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        lastName: true,
        username: true,
        role: true,
        createdAt: true,
        task: isOwnerOrAdmin, // tareas solo visibles para el dueño o admin
        // email solo visible para el dueño o admin
        email: isOwnerOrAdmin,
      },
    });

    return user;
  }

  public async insertUser(user: CreateUserDto): Promise<Omit<User, 'password'>> {
    const newUser = await this.prisma.user.create({
      data: { ...user, role: 'user' },
      select: {
        id: true,
        name: true,
        lastName: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
    return newUser as Omit<User, 'password'>;
  }

  // Actualizar perfil — solo el dueño puede editar su propio perfil
  public async updateUser(
    id: number,
    requestingUserId: number,
    requestingUserRole: string,
    userUpdate: UpdateUserDto,
  ): Promise<Omit<User, 'password'>> {
    // Prevención de IDOR: solo el dueño o admin puede editar
    if (requestingUserId !== id && requestingUserRole !== 'admin') {
      throw new ForbiddenException(
        'No tienes permiso para editar el perfil de otro usuario',
      );
    }

    // Un usuario normal no puede cambiar su propio rol
    if (requestingUserRole !== 'admin' && (userUpdate as any).role) {
      throw new ForbiddenException(
        'No tienes permiso para cambiar el rol de un usuario',
      );
    }

    const userUpdated = await this.prisma.user.update({
      where: { id },
      data: userUpdate,
      select: {
        id: true,
        name: true,
        lastName: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
    return userUpdated as Omit<User, 'password'>;
  }

  // Solo admin puede eliminar usuarios
  public async deleteUser(id: number): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { task: true },
    });

    if (!user) {
      throw new NotFoundException(`Usuario con id ${id} no encontrado`);
    }

    if (user.task && user.task.length > 0) {
      throw new HttpException(
        `No se puede eliminar el usuario porque tiene ${user.task.length} tarea(s) relacionada(s)`,
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.prisma.user.delete({ where: { id } });
  }

  // Solo admin puede cambiar el rol de un usuario
  public async changeRole(
    id: number,
    newRole: string,
  ): Promise<Omit<User, 'password'>> {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException(`Usuario con id ${id} no encontrado`);
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: { role: newRole },
      select: {
        id: true,
        name: true,
        lastName: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
    return updated as Omit<User, 'password'>;
  }
}