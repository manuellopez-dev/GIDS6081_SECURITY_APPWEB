import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/services/prisma.service';
import { CreateAuditLogDto } from '../dto/create-audit-log.dto';
import { AuditLog } from '../entities/audit-log.entity';

@Injectable()
export class AuditService {
    constructor(private prisma: PrismaService) {}

    /**
     * Registra un evento de auditoria en ñla base de datos.
     * Este método es llamado internamente desde otros servicios,
     * nunca directamente por el usuario.
     */
    async log(dto: CreateAuditLogDto): Promise<void> {
        await this.prisma.auditLog.create({
            data: {
                userId: dto.userId ?? null,
                username: dto.username,
                action: dto.action,
                detail: dto.detail,
                severity: dto.severity,
            },
        });
    }

    /**
     * Consulta logs con filtros opcionales por fecha, usuario y acción
     * Solo accesible para administradores (controlado en el controller)
     */
    async getLogs(filters: {
        username?: string;
        action?: string;
        severity?: string;
        from?: string;
        to?: string;
    }): Promise<AuditLog[]> {
        const where: any = {};

        if (filters.username) {
            where.username = { contains: filters.username };
        }

        if (filters.action) {
            where.action = filters.action;
        }

        if (filters.severity) {
            where.severity = filters.severity;
        }

        if (filters.from || filters.to) {
            where.createdAt = {};
            if (filters.from) {
                where.createdAt.gte = new Date(filters.from);
            }
            if (filters.to) {
                where.createdAt.lte = new Date(filters.to);
            }
        }

        return await this.prisma.auditLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: 200
        })
    }
}