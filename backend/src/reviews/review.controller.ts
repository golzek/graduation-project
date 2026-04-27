import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReviewService, CreateReviewDto } from './review.service';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '../auth/auth.guards';
import { UserRole } from '../users/user.entity';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewController {
  constructor(private readonly svc: ReviewService) {}

  @Get('admin/pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Відгуки на модерацію' })
  pending() { return this.svc.findPending(); }

  @Patch('admin/:id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Схвалити відгук' })
  approve(@Param('id') id: string) { return this.svc.approve(id); }

  @Get(':courseId')
  @ApiOperation({ summary: 'Відгуки курсу (публічні)' })
  findByCourse(@Param('courseId') courseId: string) { return this.svc.findByCourse(courseId); }

  @Post(':courseId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Залишити відгук' })
  create(@Param('courseId') courseId: string, @Body() dto: CreateReviewDto, @CurrentUser() u: any) {
    return this.svc.create(courseId, dto, u);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Редагувати відгук' })
  update(@Param('id') id: string, @Body() dto: Partial<CreateReviewDto>, @CurrentUser() u: any) {
    return this.svc.update(id, dto, u);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Видалити відгук' })
  remove(@Param('id') id: string, @CurrentUser() u: any) { return this.svc.remove(id, u); }
}
