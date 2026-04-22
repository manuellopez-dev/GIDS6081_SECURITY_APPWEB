import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Task } from '../entities/task.entity';
import { CreateTaskDto, UpdateTaskDto } from '../dto/create-task.dto';
import { PrismaService } from 'src/common/services/prisma.service';

@Injectable()
export class TaskService {
  constructor(
    @Inject('MYSQL_CONNECTION') private mysql: any,
    private prisma: PrismaService,
  ) {}

  public async getAllTasks(): Promise<Task[]> {
    // Solo para admin — devuelve todas las tareas
    return await this.prisma.task.findMany({
      orderBy: [{ name: 'asc' }],
      select: {
        id: true,
        name: true,
        description: true,
        priority: true,
        completed: true,
        dateVencimiento: true,
        user_id: true,
      },
    });
  }

  public async getTaskById(id: number): Promise<Task | null> {
    return await this.prisma.task.findUnique({ where: { id } });
  }

  public async getTasksByUserId(userId: number): Promise<Task[]> {
    // Cada usuario solo ve sus propias tareas
    return await this.prisma.task.findMany({
      where: { user_id: userId },
      orderBy: [{ name: 'asc' }],
      select: {
        id: true,
        name: true,
        description: true,
        priority: true,
        completed: true,
        dateVencimiento: true,
        user_id: true,
      },
    });
  }

  public async insertTask(task: CreateTaskDto & { user_id: number }): Promise<Task> {
    // user_id viene del JWT, no del body
    return await this.prisma.task.create({ data: task });
  }

  public async updateTask(
    id: number,
    requestingUserId: number,
    requestingUserRole: string,
    taskUpdate: UpdateTaskDto,
  ): Promise<Task> {
    // Verificar que la tarea existe
    const existingTask = await this.prisma.task.findUnique({ where: { id } });

    if (!existingTask) {
      throw new NotFoundException(`Tarea con id ${id} no encontrada`);
    }

    // Prevención de IDOR: solo el dueño o admin puede modificar
    if (existingTask.user_id !== requestingUserId && requestingUserRole !== 'admin') {
      throw new ForbiddenException('No tienes permiso para modificar esta tarea');
    }

    return await this.prisma.task.update({
      where: { id },
      data: taskUpdate,
    });
  }

  public async deleteTask(
    id: number,
    requestingUserId: number,
    requestingUserRole: string,
  ): Promise<Task> {
    // Verificar que la tarea existe
    const existingTask = await this.prisma.task.findUnique({ where: { id } });

    if (!existingTask) {
      throw new NotFoundException(`Tarea con id ${id} no encontrada`);
    }

    // Prevención de IDOR: solo el dueño o admin puede eliminar
    if (existingTask.user_id !== requestingUserId && requestingUserRole !== 'admin') {
      throw new ForbiddenException('No tienes permiso para eliminar esta tarea');
    }

    return await this.prisma.task.delete({ where: { id } });
  }
}