import { IsEmail, IsString, MinLength, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../users/user.entity';

export class RegisterDto {
  @ApiProperty({ example: 'Іван Петренко', description: "Повне ім'я користувача" })
  @IsString() name: string;

  @ApiProperty({ example: 'ivan@example.com', description: 'Email адреса (унікальна)' })
  @IsEmail({}, { message: 'Невірний формат email' }) email: string;

  @ApiProperty({ example: 'secret123', minLength: 6, description: 'Пароль (мінімум 6 символів)' })
  @IsString() @MinLength(6, { message: 'Пароль мінімум 6 символів' }) password: string;

  @ApiPropertyOptional({ enum: UserRole, default: UserRole.STUDENT, description: 'Роль при реєстрації' })
  @IsEnum(UserRole) @IsOptional() role?: UserRole;

  @ApiPropertyOptional({ example: 'abc123xyz', description: 'Реферальний токен запрошувача' })
  @IsString() @IsOptional() referralToken?: string;
}

export class LoginDto {
  @ApiProperty({ example: 'ivan@example.com', description: 'Email адреса' })
  @IsEmail({}, { message: 'Невірний формат email' }) email: string;

  @ApiProperty({ example: 'secret123', description: 'Пароль' })
  @IsString() password: string;
}

export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh token отриманий при вході' })
  @IsString() refreshToken: string;
}
export class ForgotPasswordDto {
  @ApiProperty({ example: 'ivan@example.com' })
  @IsEmail({}, { message: 'Невірний формат email' }) email: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: 'Токен з листа' })
  @IsString() token: string;

  @ApiProperty({ example: 'newSecret123', minLength: 6 })
  @IsString() @MinLength(6, { message: 'Пароль мінімум 6 символів' }) password: string;
}