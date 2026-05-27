import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { InstructorService } from './instructor.service';
import { OptionalJwtAuthGuard, CurrentUser } from '../auth/auth.guards';

@ApiTags('instructors')
@Controller('instructors')
export class InstructorController {
    constructor(private readonly svc: InstructorService) {}

    @Get(':id')
    @UseGuards(OptionalJwtAuthGuard)
    @ApiOperation({ summary: 'Публічний профіль викладача' })
    getProfile(@Param('id') id: string, @CurrentUser() u?: any) {
        return this.svc.getPublicProfile(id, u?.id);
    }
}