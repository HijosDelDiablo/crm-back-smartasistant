import {
  IsString,
  IsNumber,
  IsInt,
  IsNotEmpty,
  Min,
  IsOptional,
} from 'class-validator';

export class CreateProductDto {
  @IsString({ message: 'El nombre debe ser un texto.' })
  @IsNotEmpty({ message: 'El nombre es obligatorio.' })
  nombre: string;

  @IsString({ message: 'La descripción debe ser un texto.' })
  @IsNotEmpty({ message: 'La descripción es obligatoria.' })
  descripcion: string;

  @IsNumber({}, { message: 'El precio debe ser un número.' })
  @Min(0, { message: 'El precio no puede ser negativo.' })
  precio: number;

  @IsInt({ message: 'El stock debe ser un número entero.' })
  @Min(0, { message: 'El stock no puede ser negativo.' })
  stock: number;

  @IsOptional()
  @IsString({ message: 'La URL de la imagen debe ser un texto.' })
  imageUrl?: string;
}

export class UpdateProductDto {
  @IsOptional()
  @IsString({ message: 'El nombre debe ser un texto.' })
  nombre?: string;

  @IsOptional()
  @IsString({ message: 'La descripción debe ser un texto.' })
  descripcion?: string;

  @IsOptional()
  @IsNumber({}, { message: 'El precio debe ser un número.' })
  @Min(0, { message: 'El precio no puede ser negativo.' })
  precio?: number;

  @IsOptional()
  @IsInt({ message: 'El stock debe ser un número entero.' })
  @Min(0, { message: 'El stock no puede ser negativo.' })
  stock?: number;

  @IsOptional()
  @IsString({ message: 'La URL de la imagen debe ser un texto.' })
  imageUrl?: string;
}