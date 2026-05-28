import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { Referral } from './referral.entity';
import { ReferralService } from './referral.service';
import { ReferralController } from './referral.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([Referral]),
        JwtModule.register({}),
    ],
    providers:   [ReferralService],
    controllers: [ReferralController],
    exports:     [ReferralService],
})
export class ReferralModule {}