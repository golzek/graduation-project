import {
  Controller, Post, Get, Param,
  UseGuards, UseInterceptors,
  UploadedFile, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { StorageService } from './storage.service';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '../auth/auth.guards';
import { UserRole } from '../users/user.entity';

const MAX_VIDEO_MB = 500;
const MAX_IMAGE_MB = 5;

@ApiTags('upload')
@Controller('upload')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT')
export class UploadController {
  constructor(private readonly storage: StorageService) {}

  @Post('video')
  @UseGuards(RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: MAX_VIDEO_MB * 1024 * 1024 },
    fileFilter: (_, file, cb) => {
      const allowed = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
      if (!allowed.includes(file.mimetype)) {
        return cb(new BadRequestException('Дозволені формати: mp4, webm, ogg, mov'), false);
      }
      cb(null, true);
    },
  }))
  @ApiOperation({ summary: 'Завантажити відео уроку (до 500MB)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  async uploadVideo(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Файл не знайдено');
    const key = await this.storage.upload(file.buffer, file.originalname, 'videos', file.mimetype);
    return { key, message: 'Відео завантажено. Використовуй key як contentUrl уроку.' };
  }

  @Get('video-url/:key(*)')
  @ApiOperation({ summary: 'Отримати тимчасовий URL для відтворення відео (1 год)' })
  async getVideoUrl(@Param('key') key: string) {
    const url = await this.storage.getSignedVideoUrl(key);
    return { url };
  }

  @Post('image')
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: MAX_IMAGE_MB * 1024 * 1024 },
    fileFilter: (_, file, cb) => {
      const allowed = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowed.includes(file.mimetype)) {
        return cb(new BadRequestException('Дозволені формати: jpg, png, webp'), false);
      }
      cb(null, true);
    },
  }))
  @ApiOperation({ summary: 'Завантажити зображення (thumbnail / аватар)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: any,
  ) {
    if (!file) throw new BadRequestException('Файл не знайдено');
    const folder = user.role === 'student' ? 'avatars' : 'thumbnails';
    const url = await this.storage.upload(file.buffer, file.originalname, folder, file.mimetype);
    return { url };
  }
}
