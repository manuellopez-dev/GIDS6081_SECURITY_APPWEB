import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuthGuard } from 'src/common/guards/auth.guards';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { AuditLog } from '../entities/audit-log.entity';

@Controller('/api/audit')
@UseGuards(AuthGuard,  RolesGuard)
export class AuditController {
    constructor(private auditService: AuditService) {}

    /**
     * Solo admin puede consultar los logs de auditoría.
     * Soporta filtros por username, action, severity, from y to (fechas ISO)
     */

    @Get('')
    @Roles('admin')
    async getLogs(
        @Query('username') username?: string,
        @Query('action') action?: string,
        @Query('severity') severity?: string,
        @Query('from') from?: string,
        @Query('to') to?: string,
    ): Promise<AuditLog[]> {
        return await this.auditService.getLogs({
            username,
            action,
            severity,
            from,
            to,
        });
    }
}