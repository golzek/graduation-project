import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'node:crypto';
import * as PDFDocument from 'pdfkit';
import { Certificate } from './certificate.entity';
import { Course, Enrollment, Progress } from '../courses/course.entity';
import { User } from '../users/user.entity';
import { StorageService } from '../storage/storage.service';
import { NotificationService } from '../notifications/notification.service';
import { fireAndForget } from '../common/logger.util';

@Injectable()
export class CertificateService {
  constructor(
      @InjectRepository(Certificate) private certRepo:       Repository<Certificate>,
      @InjectRepository(Course)      private courseRepo:     Repository<Course>,
      @InjectRepository(Enrollment)  private enrollmentRepo: Repository<Enrollment>,
      @InjectRepository(Progress)    private progressRepo:   Repository<Progress>,
      private readonly storage: StorageService,
      private readonly notifSvc: NotificationService,
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

    const pdfData = pdfBuffer.toString('base64');

    const cert = await this.certRepo.save(
        this.certRepo.create({ userId: user.id, courseId, verifyCode, pdfData }),
    );

    fireAndForget(
        this.notifSvc.notifyCertificateIssued(user.id, courseId, course.title, verifyCode, null),
        'notif:notifyCertificateIssued',
    );

    return cert;
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
    };
  }

  async getPdfBuffer(code: string, userId: string): Promise<Buffer> {
    const cert = await this.certRepo.findOne({ where: { verifyCode: code, userId } });
    if (!cert || !cert.pdfData) throw new NotFoundException('Сертифікат не знайдено');
    return Buffer.from(cert.pdfData, 'base64');
  }

  async findMyAll(userId: string) {
    const certs = await this.certRepo.find({
      where: { userId },
      relations: ['course', 'course.author'],
      order: { issuedAt: 'DESC' },
    });
    return certs.map(c => ({ ...c, pdfUrl: `/certificates/download/${c.verifyCode}` }));
  }

  async regeneratePdf(courseId: string, user: User): Promise<Certificate> {
    const cert = await this.certRepo.findOne({ where: { userId: user.id, courseId } });
    if (!cert) throw new NotFoundException('Сертифікат не знайдено');

    const course = await this.courseRepo.findOne({
      where: { id: courseId },
      relations: ['author'],
    });
    if (!course) throw new NotFoundException('Курс не знайдено');

    const pdfBuffer = await this.generatePdf({
      studentName: user.name,
      courseName:  course.title,
      authorName:  (course.author as any)?.name ?? 'Викладач',
      verifyCode:  cert.verifyCode,
      issuedAt:    cert.issuedAt,
    });

    cert.pdfData = pdfBuffer.toString('base64');
    return this.certRepo.save(cert);
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

      const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0, autoFirstPage: true });
      const chunks: Buffer[] = [];
      doc.on('data', c => chunks.push(c));
      doc.on('end',  () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.registerFont('Regular', regular);
      doc.registerFont('Bold', bold);

      const W = doc.page.width;
      const H = doc.page.height;

      doc.rect(0, 0, W, H).fill('#fafaf8');

      doc.rect(20, 20, W - 40, H - 40).lineWidth(2).stroke('#c9a84c');
      doc.rect(27, 27, W - 54, H - 54).lineWidth(0.5).stroke('#c9a84c');

      doc.fontSize(40).fillColor('#1e1b4b').font('Bold')
          .text('СЕРТИФІКАТ', 0, 70, { align: 'center', width: W, lineBreak: false });

      doc.fontSize(13).fillColor('#6b7280').font('Regular')
          .text('про успішне завершення курсу', 0, 122, { align: 'center', width: W, lineBreak: false });

      doc.moveTo(W * 0.2, 152).lineTo(W * 0.8, 152).lineWidth(1).stroke('#c9a84c');

      doc.fontSize(28).fillColor('#111827').font('Bold')
          .text(data.studentName, 60, 168, { align: 'center', width: W - 120, lineBreak: false });

      doc.fontSize(13).fillColor('#6b7280').font('Regular')
          .text('успішно завершив(-ла) курс', 0, 212, { align: 'center', width: W, lineBreak: false });

      doc.fontSize(19).fillColor('#4f46e5').font('Bold')
          .text(`«${data.courseName}»`, 80, 238, { align: 'center', width: W - 160, lineBreak: true, height: 60 });

      doc.moveTo(W * 0.2, 330).lineTo(W * 0.8, 330).lineWidth(0.5).stroke('#e5e7eb');

      const d = data.issuedAt;
      const dateStr = `${d.getDate().toString().padStart(2,'0')}.${(d.getMonth()+1).toString().padStart(2,'0')}.${d.getFullYear()}`;

      doc.fontSize(11).fillColor('#6b7280').font('Regular')
          .text(`Дата видачі: ${dateStr}`, 60, 360, { lineBreak: false });

      doc.fontSize(11).fillColor('#6b7280').font('Regular')
          .text(`Викладач: ${data.authorName}`, W / 2, 360, { lineBreak: false });

      doc.fontSize(9).fillColor('#9ca3af').font('Regular')
          .text(`Код верифікації: ${data.verifyCode}`, 0, 400, { align: 'center', width: W, lineBreak: false });

      doc.end();
    });
  }
}