import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateAuditLogDto {
    @IsOptional()
    userId?: number;

    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    username!: string;

    /**
     * Acciones posibles: LOGIN_FAILED, LOGIN_SUCCESS, TASK_CREATED,
     * TASK_DELETED, ROLE_CHANGED, USER_DELETED, REGISTER
     */
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    action!: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(500)
    detail!: string;

    /**
     * Severidades: INFO, WARNING, CRITICAL
     */
    @IsString()
    @IsNotEmpty()
    @MaxLength(20)
    severity!: string;
}