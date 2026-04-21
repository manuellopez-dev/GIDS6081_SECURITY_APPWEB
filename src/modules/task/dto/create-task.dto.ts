import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
  @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres '})
  name!: string;

  @IsString()
  @IsNotEmpty({ message: 'La descripción es requerida' })
  @MinLength(5, { message: 'La descripción debe tener al menos 5 caracteres' })
  @MaxLength(250, { message: 'La descripción no puede exceder 250 caracteres' })
  description!: string;

  @IsNotEmpty({ message: 'La prioridad es requerida' })
  @IsInt({ message: 'La prioridad debe ser un número entero' })
  @Min(1, { message: 'La prioridad mínima es 1' })
  @Max(3, { message: 'La prioridad máxima es 3' })
  priority!: number;

  @IsNotEmpty({ message: 'El estado es requerido' })
  @IsBoolean({ message: 'El estado debe se verdadero o falso' })
  completed!: boolean;

  @IsNotEmpty({ message: 'La fecha de vencimiento es requerida' })
  @IsString()
  dateVencimiento!: string;

  // user_id ya NO viene del body, se asigna desde el JWT en el controller
}

export class UpdateTaskDto {
  @IsOptional()
  @IsString( {message: "El nombre debe ser una cadena de texto"} )
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
  @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres' })
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(5, { message: 'La descripción debe tener al menos 5 caracteres' })
  @MaxLength(250, { message: 'La descripción no puede exceder 250 caracteres' })
  description?: string;

  @IsOptional()
  @IsInt({ message: 'La prioridad debe ser un numero entero' })
  @Min(1, { message: 'La prioridad mínima es 1' })
  @Max(3, { message: 'La prioridad máxima es 3' })
  priority?: number;

  @IsOptional()
  @IsBoolean({message: 'El estado debe ser verdadero o falso' })
  completed?: boolean;

  @IsOptional()
  @IsString()
  dateVencimiento?: string;
}
