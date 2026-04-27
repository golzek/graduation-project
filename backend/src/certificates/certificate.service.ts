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
    // ← StorageService тепер глобальний, просто інжектуємо
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

    // Генеруємо PDF і одразу зберігаємо в R2/S3
    const pdfBuffer = await this.generatePdf({
      studentName: user.name,
      courseName:  course.title,
      authorName:  (course.author as any)?.name ?? 'Викладач',
      verifyCode,
      issuedAt: new Date(),
    });

    // Зберігаємо PDF в хмарне сховище
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
      const doc    = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 60 });
      const chunks: Buffer[] = [];
      doc.on('data', c => chunks.push(c));
      doc.on('end',  () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const W = doc.page.width, H = doc.page.height;
      doc.rect(0, 0, W, H).fill('#fafaf8');
      doc.rect(24, 24, W-48, H-48).lineWidth(2).stroke('#c9a84c');
      doc.rect(30, 30, W-60, H-60).lineWidth(0.5).stroke('#c9a84c');
      doc.fontSize(40).fillColor('#1e1b4b').font('Helvetica-Bold')
        .text('СЕРТИФІКАТ', 0, 80, { align: 'center' });
      doc.fontSize(14).fillColor('#6b7280').font('Helvetica')
        .text('про успішне завершення курсу', 0, 132, { align: 'center' });
      doc.moveTo(W*.2, 165).lineTo(W*.8, 165).lineWidth(1).stroke('#c9a84c');
      doc.fontSize(32).fillColor('#111827').font('Helvetica-Bold')
        .text(data.studentName, 0, 185, { align: 'center' });
      doc.fontSize(14).fillColor('#6b7280').font('Helvetica')
        .text('успішно завершив(ла) курс', 0, 230, { align: 'center' });
      doc.fontSize(22).fillColor('#4f46e5').font('Helvetica-Bold')
        .text(`«${data.courseName}»`, 0, 258, { align: 'center' });
      const dateStr = data.issuedAt.toLocaleDateString('uk-UA', {
        day: 'numeric', month: 'long', year: 'numeric',
      });
      doc.fontSize(12).fillColor('#6b7280').font('Helvetica')
        .text(`Дата видачі: ${dateStr}`, 80, H-140);
      doc.text(`Викладач: ${data.authorName}`, W/2, H-140, { align: 'center' });
      doc.fontSize(10).fillColor('#9ca3af')
        .text(`Код верифікації: ${data.verifyCode}`, 0, H-60, { align: 'center' });
      doc.end();
    });
  }
}
