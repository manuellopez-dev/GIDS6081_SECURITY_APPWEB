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
import { TaskService } from './task.service';
import { CreateTaskDto, UpdateTaskDto } from '../dto/create-task.dto';
import { Task } from '../entities/task.entity';
import { AuthGuard } from 'src/common/guards/auth.guards';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { AuditService } from 'src/modules/audit/interface/audit.service';

@Controller('/api/task')
@UseGuards(AuthGuard, RolesGuard)
export class TaskController {
  constructor(
    private tasksvc: TaskService,
    private auditService: AuditService,
  ) {}

  // Cualquier usuario autenticado ve solo sus tareas
  @Get('my-tasks')
  async getMyTasks(@Req() req: any): Promise<Task[]> {
    const userId = req.user.sub;
    return await this.tasksvc.getTasksByUserId(userId);
  }

  // Solo admin puede ver todas las tareas
  @Get('')
  @Roles('admin')
  async getAllTasks(): Promise<Task[]> {
    return await this.tasksvc.getAllTasks();
  }

  // El usuario puede ver una tarea por id solo si es suya o es admin
  @Get(':id')
  async getTaskById(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
  ): Promise<Task> {
    const task = await this.tasksvc.getTaskById(id);

    if (!task) {
      throw new Error(`Tarea con id ${id} no encontrada`);
    }

    // Prevención IDOR en lectura
    if (task.user_id !== req.user.sub && req.user.role !== 'admin') {
      throw new Error('No tienes permiso para ver esta tarea');
    }

    return task;
  }

  // Crear tarea — user_id se toma del JWT, no del body
  @Post('')
  @HttpCode(HttpStatus.CREATED)
  async insertTask(
    @Body() task: CreateTaskDto,
    @Req() req: any,
  ): Promise<Task> {
    const userId = req.user.sub;
    const result = await this.tasksvc.insertTask({ ...task, user_id: userId });

    // Registrar evento de auditoría
    await this.auditService.log({
      userId,
      username: req.user.username,
      action: 'TASK_CREATED',
      detail: `Usuario ${req.user.username} creó la tarea: ${task.name}`,
      severity: 'INFO',
    });

    return result;
  }

  // Actualizar — verifica ownership en el service
  @Put(':id')
  async updateTask(
    @Param('id', ParseIntPipe) id: number,
    @Body() taskUpdate: UpdateTaskDto,
    @Req() req: any,
  ): Promise<Task> {
    return await this.tasksvc.updateTask(
      id,
      req.user.sub,
      req.user.role,
      taskUpdate,
    );
  }

  // Eliminar — verifica ownership en el service
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteTask(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
  ): Promise<boolean> {
    await this.tasksvc.deleteTask(id, req.user.sub, req.user.role);

    // Registrar evento de auditoría
    await this.auditService.log({
      userId: req.user.sub,
      username: req.user.username,
      action: 'TASK_DELETED',
      detail: `Usuario ${req.user.username} eliminó la tarea con id: ${id}`,
      severity: 'WARNING',
    });

    return true;
  }
}