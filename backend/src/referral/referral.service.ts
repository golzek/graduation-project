import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Referral } from './referral.entity';

@Injectable()
export class ReferralService {
    constructor(
        @InjectRepository(Referral) private referralRepo: Repository<Referral>,
        private readonly jwtService: JwtService,
        private readonly config: ConfigService,
    ) {}

    generateLink(userId: string): string {
        const token = this.jwtService.sign(
            { sub: userId, type: 'referral' },
            { secret: this.config.get('JWT_SECRET'), expiresIn: '365d' },
        );
        const baseUrl = this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:3001';
        return `${baseUrl}/register?ref=${token}`;
    }

    decodeToken(token: string): string | null {
        try {
            const payload = this.jwtService.verify<{ sub: string; type: string }>(token, {
                secret: this.config.get('JWT_SECRET'),
            });
            if (payload.type !== 'referral') return null;
            return payload.sub;
        } catch {
            return null;
        }
    }

    async track(referrerId: string, refereeId: string): Promise<void> {
        if (referrerId === refereeId) return;
        const exists = await this.referralRepo.findOne({ where: { refereeId } });
        if (exists) return;
        await this.referralRepo.save(
            this.referralRepo.create({ referrerId, refereeId }),
        );
    }

    async getMyReferrals(userId: string): Promise<{ id: string; name: string; createdAt: Date }[]> {
        const rows = await this.referralRepo.find({
            where: { referrerId: userId },
            relations: ['referee'],
            order: { createdAt: 'DESC' },
        });
        return rows.map(r => ({
            id:        r.referee.id,
            name:      r.referee.name,
            createdAt: r.createdAt,
        }));
    }

    countReferrals(userId: string): Promise<number> {
        return this.referralRepo.count({ where: { referrerId: userId } });
    }
}