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
    function toLatyn(str: string): string {
      const map: Record<string, string> = {
        'а':'a','б':'b','в':'v','г':'h','ґ':'g','д':'d','е':'e','є':'ye',
        'ж':'zh','з':'z','и':'y','і':'i','ї':'yi','й':'y','к':'k','л':'l',
        'м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u',
        'ф':'f','х':'kh','ц':'ts','ч':'ch','ш':'sh','щ':'shch','ь':'',
        'ю':'yu','я':'ya','ё':'yo','э':'e','ъ':'','ы':'y',
        'А':'A','Б':'B','В':'V','Г':'H','Ґ':'G','Д':'D','Е':'E','Є':'Ye',
        'Ж':'Zh','З':'Z','И':'Y','І':'I','Ї':'Yi','Й':'Y','К':'K','Л':'L',
        'М':'M','Н':'N','О':'O','П':'P','Р':'R','С':'S','Т':'T','У':'U',
        'Ф':'F','Х':'Kh','Ц':'Ts','Ч':'Ch','Ш':'Sh','Щ':'Shch','Ь':'',
        'Ю':'Yu','Я':'Ya','Ё':'Yo','Э':'E','Ъ':'','Ы':'Y',
      };
      return str.split('').map(c => map[c] ?? c).join('');
    }
    const pdfBuffer = await this.generatePdf({
      studentName: toLatyn(user.name),
      courseName:  toLatyn(course.title),
      authorName:  toLatyn((course.author as any)?.name ?? 'Vykladach'),
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
          .text('SERTYFIKAT', 0, 80, { align: 'center' });
      doc.fontSize(14).fillColor('#6b7280').font('Helvetica')
          .text('pro uspishne zavershennia kursu', 0, 132, { align: 'center' });
      doc.moveTo(W*.2, 165).lineTo(W*.8, 165).lineWidth(1).stroke('#c9a84c');
      doc.fontSize(32).fillColor('#111827').font('Helvetica-Bold')
        .text(data.studentName, 0, 185, { align: 'center' });
      doc.fontSize(14).fillColor('#6b7280').font('Helvetica')
          .text('uspishno zavershy`v(la) kurs', 0, 230, { align: 'center' });
      doc.fontSize(22).fillColor('#4f46e5').font('Helvetica-Bold')
        .text(`«${data.courseName}»`, 0, 258, { align: 'center' });
      const d = data.issuedAt;
      const dateStr = `${d.getDate().toString().padStart(2,'0')}.${(d.getMonth()+1).toString().padStart(2,'0')}.${d.getFullYear()}`;
      doc.fontSize(12).fillColor('#6b7280').font('Helvetica')
          .text(`Data vydachi: ${dateStr}`, 80, H-140);
      doc.text(`Vykladach: ${data.authorName}`, W/2, H-140, { align: 'center' });
      doc.fontSize(10).fillColor('#9ca3af')
          .text(`Kod veryfikatsii: ${data.verifyCode}`, 0, H-60, { align: 'center' });
      doc.end();
    });

  }
}
