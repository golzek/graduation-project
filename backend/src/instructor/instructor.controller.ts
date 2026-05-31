import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { InstructorService } from './instructor.service';
import { OptionalJwtAuthGuard, CurrentUser } from '../auth/auth.guards';

@ApiTags('instructors')
@Controller('instructors')
export class InstructorController {
    constructor(private readonly svc: InstructorService) {}

    @Get(':id')
    @UseGuards(OptionalJwtAuthGuard)
    @ApiOperation({
        summary: 'Публічний профіль викладача',
        description: 'Повертає ім\'я, аватар, біо, список опублікованих курсів та рейтинг',
    })
    @ApiParam({ name: 'id', description: 'UUID викладача' })
    @ApiResponse({ status: 200, description: 'Профіль викладача' })
    @ApiResponse({ status: 404, description: 'Викладача не знайдено' })
    getProfile(@Param('id') id: string, @CurrentUser() u?: any) {
        return this.svc.getPublicProfile(id, u?.id);
    }
}