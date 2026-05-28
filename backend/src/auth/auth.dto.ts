import { IsEmail, IsString, MinLength, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../users/user.entity';

export class RegisterDto {
  @ApiProperty({ example: 'Іван Петренко' })
  @IsString() name: string;

  @ApiProperty({ example: 'ivan@example.com' })
  @IsEmail({}, { message: 'Невірний формат email' }) email: string;

  @ApiProperty({ example: 'secret123', minLength: 6 })
  @IsString() @MinLength(6, { message: 'Пароль мінімум 6 символів' }) password: string;

  @ApiPropertyOptional({ enum: UserRole })
  @IsEnum(UserRole) @IsOptional() role?: UserRole;

  @ApiPropertyOptional({ description: 'Реферальний токен запрошувача' })
  @IsString() @IsOptional() referralToken?: string;
}

export class LoginDto {
  @ApiProperty({ example: 'ivan@example.com' })
  @IsEmail({}, { message: 'Невірний формат email' }) email: string;

  @ApiProperty({ example: 'secret123' })
  @IsString() password: string;
}