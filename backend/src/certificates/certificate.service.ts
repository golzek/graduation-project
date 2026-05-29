import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'node:crypto';
import * as PDFDocument from 'pdfkit';
import { Certificate } from './certificate.entity';
import { Course, Enrollment, Progress } from '../courses/course.entity';
import { User } from '../users/user.entity';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class CertificateService {
  constructor(
      @InjectRepository(Certificate) private certRepo:       Repository<Certificate>,
      @InjectRepository(Course)      private courseRepo:     Repository<Course>,
      @InjectRepository(Enrollment)  private enrollmentRepo: Repository<Enrollment>,
      @InjectRepository(Progress)    private progressRepo:   Repository<Progress>,
      private readonly storage: StorageService,
  ) {}

  async issue(courseId: string, user: User): Promise<Certificate> {
    const enrolled = await this.enrollmentRepo.findOne({ where: { userId: user.id, courseId } });
    if (!enrolled) throw new BadRequestException('Ти не записаний на цей курс');

    const existing = await this.certRepo.findOne({ where: { userId: user.id, courseId } });
    if (existing) throw new ConflictException('Сертифікат вже виданий');

    const course = await this.courseRepo.findOne({
      where: { id: courseId },
      relations: ['modules', 'modules.lessons', 'author'],
    });
    if (!course) throw new NotFoundException('Курс не знайдено');

    const allIds = course.modules.flatMap(m => m.lessons.map(l => l.id));
    if (!allIds.length) throw new BadRequestException('Курс не має уроків');


    const done = await this.progressRepo.createQueryBuilder('p')
        .where('p.user_id = :uid', { uid: user.id })
        .andWhere('p.lesson_id IN (:...ids)', { ids: allIds })
        .andWhere('p.completed = true').getCount();

    if (done < allIds.length)
      throw new BadRequestException(`Завершено ${done} з ${allIds.length} уроків. Потрібно 100%`);

    const verifyCode = randomBytes(12).toString('hex').toUpperCase();
    const pdfBuffer = await this.generatePdf({
      studentName: user.name,
      courseName:  course.title,
      authorName:  (course.author as any)?.name ?? 'Викладач',
      verifyCode,
      issuedAt: new Date(),
    });

    const pdfUrl = await this.storage.uploadBuffer(
        pdfBuffer,
        `${verifyCode}.pdf`,
    );

    return this.certRepo.save(
        this.certRepo.create({ userId: user.id, courseId, verifyCode, pdfUrl }),
    );
  }

  async verify(code: string) {
    const cert = await this.certRepo.findOne({
      where: { verifyCode: code },
      relations: ['user', 'course'],
    });
    if (!cert) throw new NotFoundException('Сертифікат не знайдено');
    return {
      valid: true,
      studentName: cert.user.name,
      courseName:  cert.course.title,
      issuedAt:    cert.issuedAt,
      verifyCode:  cert.verifyCode,
      pdfUrl:      cert.pdfUrl,
    };
  }

  findMyAll(userId: string) {
    return this.certRepo.find({
      where: { userId },
      relations: ['course', 'course.author'],
      order: { issuedAt: 'DESC' },
    });
  }

  private generatePdf(data: {
    studentName: string; courseName: string;
    authorName: string; verifyCode: string; issuedAt: Date;
  }): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const path   = require('path');
      const fontsDir = path.join(__dirname, '..', 'certificates', 'fonts');
      const regular  = path.join(fontsDir, 'Roboto-Regular.ttf');
      const bold     = path.join(fontsDir, 'Roboto-Bold.ttf');

      const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 60, autoFirstPage: true });
      const chunks: Buffer[] = [];
      doc.on('data', c => chunks.push(c));
      doc.on('end',  () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.registerFont('Regular', regular);
      doc.registerFont('Bold', bold);

      const W = doc.page.width, H = doc.page.height;

      doc.rect(0, 0, W, H).fill('#fafaf8');
      doc.rect(24, 24, W-48, H-48).lineWidth(2).stroke('#c9a84c');
      doc.rect(30, 30, W-60, H-60).lineWidth(0.5).stroke('#c9a84c');

      doc.fontSize(42).fillColor('#1e1b4b').font('Bold')
          .text('СЕРТИФІКАТ', 0, 80, { align: 'center' });

      doc.fontSize(14).fillColor('#6b7280').font('Regular')
          .text('про успішне завершення курсу', 0, 135, { align: 'center' });

      doc.moveTo(W * 0.2, 168).lineTo(W * 0.8, 168).lineWidth(1).stroke('#c9a84c');

      doc.fontSize(30).fillColor('#111827').font('Bold')
          .text(data.studentName, 60, 188, { align: 'center', width: W - 120 });

      doc.fontSize(14).fillColor('#6b7280').font('Regular')
          .text('успішно завершив(-ла) курс', 0, 235, { align: 'center' });

      doc.fontSize(20).fillColor('#4f46e5').font('Bold')
          .text(`«${data.courseName}»`, 60, 262, { align: 'center', width: W - 120 });

      const d = data.issuedAt;
      const dateStr = `${d.getDate().toString().padStart(2,'0')}.${(d.getMonth()+1).toString().padStart(2,'0')}.${d.getFullYear()}`;
      doc.fontSize(12).fillColor('#6b7280').font('Regular')
          .text(`Дата видачі: ${dateStr}`, 80, H - 110);
      doc.fontSize(12).fillColor('#6b7280').font('Regular')
          .text(`Викладач: ${data.authorName}`, W / 2 + 20, H - 110);

      doc.fontSize(10).fillColor('#9ca3af').font('Regular')
          .text(`Код верифікації: ${data.verifyCode}`, 0, H - 60, { align: 'center' });

      doc.end();
    });
  }
}