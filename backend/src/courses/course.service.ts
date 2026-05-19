import {
  Injectable, NotFoundException, ForbiddenException, ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course, CourseModule, Lesson, Enrollment, Progress, CourseStatus } from './course.entity';
import { User, UserRole } from '../users/user.entity';
import {
  CreateCourseDto, UpdateCourseDto, CourseFilterDto,
  CreateModuleDto, CreateLessonDto, UpdateProgressDto,
} from './course.dto';
import { NotificationService } from '../notifications/notification.service';

@Injectable()
export class CourseService {
  constructor(
      @InjectRepository(Course)       private courseRepo:     Repository<Course>,
      @InjectRepository(CourseModule) private moduleRepo:     Repository<CourseModule>,
      @InjectRepository(Lesson)       private lessonRepo:     Repository<Lesson>,
      @InjectRepository(Enrollment)   private enrollmentRepo: Repository<Enrollment>,
      @InjectRepository(Progress)     private progressRepo:   Repository<Progress>,
      private readonly notifSvc: NotificationService,
  ) {}

  async findAll(f: CourseFilterDto) {
    const { search, category, level, page = 1, limit = 12, minPrice, maxPrice, minRating } = f;
    const qb = this.courseRepo.createQueryBuilder('c')
        .leftJoinAndSelect('c.author', 'author')
        .where('c.status = :s', { s: CourseStatus.PUBLISHED });
    if (search)    qb.andWhere('(c.title ILIKE :q OR c.description ILIKE :q)', { q: `%${search}%` });
    if (category)  qb.andWhere('c.category = :category', { category });
    if (level)     qb.andWhere('c.level = :level', { level });
    if (minPrice !== undefined) qb.andWhere('c.price >= :minPrice', { minPrice });
    if (maxPrice !== undefined) qb.andWhere('c.price <= :maxPrice', { maxPrice });
    if (minRating !== undefined && Number(minRating) > 0) qb.andWhere('c.rating >= :minRating', { minRating });
    const [data, total] = await qb.skip((page - 1) * limit).take(limit)
        .orderBy('c.createdAt', 'DESC').getManyAndCount();
    return { data: data.map(this.safeAuthor), total, page, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string, userId?: string) {
    const course = await this.courseRepo.findOne({
      where: { id },
      relations: ['modules', 'modules.lessons', 'author'],
      order: { modules: { orderIndex: 'ASC', lessons: { orderIndex: 'ASC' } } } as any,
    });
    if (!course) throw new NotFoundException('Курс не знайдено');
    let isEnrolled = false;
    if (userId) {
      isEnrolled = !!(await this.enrollmentRepo.findOne({ where: { userId, courseId: id } }));
    }
    if (!isEnrolled) {
      course.modules?.forEach(m => m.lessons?.forEach(l => { if (!l.isFree) l.contentUrl = null; }));
    }
    return { ...this.safeAuthor(course), isEnrolled };
  }

  async create(dto: CreateCourseDto, author: User) {
    const course = await this.courseRepo.save(this.courseRepo.create({ ...dto, authorId: author.id }));
    // Повідомляємо адмінів що є новий курс на перевірку
    this.notifSvc.notifyAdminsCourseNeedsReview(course.id, course.title, author.name).catch(() => {});
    return course;
  }

  async update(id: string, dto: UpdateCourseDto, user: User) {
    const c = await this.courseRepo.findOne({ where: { id } });
    if (!c) throw new NotFoundException();
    this.checkOwner(c, user);
    return this.courseRepo.save(Object.assign(c, dto));
  }

  async remove(id: string, user: User) {
    const c = await this.courseRepo.findOne({ where: { id } });
    if (!c) throw new NotFoundException();
    this.checkOwner(c, user);
    await this.courseRepo.remove(c);
  }

  findMyCourses(authorId: string) {
    return this.courseRepo.find({ where: { authorId }, order: { createdAt: 'DESC' } });
  }

  async findMyEnrollmentsProgress(userId: string): Promise<{ courseId: string; percent: number }[]> {
    const enrollments = await this.enrollmentRepo.find({ where: { userId } });
    if (!enrollments.length) return [];

    const results = await Promise.all(
        enrollments.map(async e => {
          const p = await this.getCourseProgress(e.courseId, userId);
          return { courseId: e.courseId, percent: p.percent };
        }),
    );
    return results;
  }

  async addModule(courseId: string, dto: CreateModuleDto, user: User) {
    const c = await this.courseRepo.findOne({ where: { id: courseId } });
    if (!c) throw new NotFoundException();
    this.checkOwner(c, user);
    const count = await this.moduleRepo.count({ where: { courseId } });
    return this.moduleRepo.save(this.moduleRepo.create({ ...dto, courseId, orderIndex: dto.orderIndex ?? count }));
  }

  async updateModule(moduleId: string, dto: Partial<CreateModuleDto>, user: User) {
    const m = await this.moduleRepo.findOne({ where: { id: moduleId }, relations: ['course'] });
    if (!m) throw new NotFoundException();
    this.checkOwner(m.course, user);
    return this.moduleRepo.save(Object.assign(m, dto));
  }

  async removeModule(moduleId: string, user: User) {
    const m = await this.moduleRepo.findOne({ where: { id: moduleId }, relations: ['course'] });
    if (!m) throw new NotFoundException();
    this.checkOwner(m.course, user);
    await this.moduleRepo.remove(m);
  }

  async addLesson(moduleId: string, dto: CreateLessonDto, user: User) {
    const m = await this.moduleRepo.findOne({ where: { id: moduleId }, relations: ['course'] });
    if (!m) throw new NotFoundException('Модуль не знайдено');
    this.checkOwner(m.course, user);
    const count = await this.lessonRepo.count({ where: { moduleId } });
    return this.lessonRepo.save(this.lessonRepo.create({ ...dto, moduleId, orderIndex: dto.orderIndex ?? count }));
  }

  async updateLesson(lessonId: string, dto: Partial<CreateLessonDto>, user: User) {
    const l = await this.lessonRepo.findOne({ where: { id: lessonId }, relations: ['module', 'module.course'] });
    if (!l) throw new NotFoundException();
    this.checkOwner(l.module.course, user);
    return this.lessonRepo.save(Object.assign(l, dto));
  }

  async removeLesson(lessonId: string, user: User) {
    const l = await this.lessonRepo.findOne({ where: { id: lessonId }, relations: ['module', 'module.course'] });
    if (!l) throw new NotFoundException();
    this.checkOwner(l.module.course, user);
    await this.lessonRepo.remove(l);
  }

  async enroll(courseId: string, user: User) {
    const c = await this.courseRepo.findOne({ where: { id: courseId }, relations: ['author'] });
    if (!c) throw new NotFoundException();
    const exists = await this.enrollmentRepo.findOne({ where: { userId: user.id, courseId } });
    if (exists) throw new ConflictException('Вже записаний на цей курс');
    const enrollment = await this.enrollmentRepo.save(
        this.enrollmentRepo.create({ userId: user.id, courseId, paidPrice: c.price }),
    );
    this.notifSvc.notifyStudentEnrolled(user.id, courseId, c.title).catch(() => {});
    if (c.authorId) {
      this.notifSvc.notifyTeacherNewEnrollment(c.authorId, user.name, courseId, c.title).catch(() => {});
    }
    return enrollment;
  }

  async updateProgress(dto: UpdateProgressDto, user: User) {
    const lesson = await this.lessonRepo.findOne({
      where: { id: dto.lessonId },
      relations: ['module'],
    });
    if (!lesson) throw new NotFoundException('Урок не знайдено');
    if (!lesson.module) throw new NotFoundException('Модуль уроку не знайдено');

    const enrolled = await this.enrollmentRepo.findOne({
      where: { userId: user.id, courseId: lesson.module.courseId },
    });
    if (!enrolled) throw new ForbiddenException('Спочатку запишись на курс');

    let p = await this.progressRepo.findOne({
      where: { userId: user.id, lessonId: dto.lessonId },
    });
    if (!p) p = this.progressRepo.create({ userId: user.id, lessonId: dto.lessonId, watchedSec: 0 });

    p.completed  = dto.completed;
    p.watchedSec = Math.max(p.watchedSec ?? 0, dto.watchedSec ?? 0);
    return this.progressRepo.save(p);
  }
  async getCourseProgress(courseId: string, userId: string) {
    const c = await this.courseRepo.findOne({ where: { id: courseId }, relations: ['modules', 'modules.lessons'] });
    if (!c) throw new NotFoundException();
    const ids = c.modules.flatMap(m => m.lessons.map(l => l.id));
    if (!ids.length) return { percent: 0, completedCount: 0, totalCount: 0 };

    const result = await this.progressRepo.query(
        `SELECT COUNT(*) as done FROM progress WHERE user_id = $1 AND lesson_id = ANY($2) AND completed = true`,
        [userId, ids],
    );

    const done = parseInt(result[0]?.done) || 0;
    return { percent: Math.round((done / ids.length) * 100), completedCount: done, totalCount: ids.length };
  }

  private checkOwner(course: Course, user: User) {
    if (course.authorId !== user.id && user.role !== UserRole.ADMIN)
      throw new ForbiddenException('Це не твій курс');
  }

  private safeAuthor(c: Course) {
    if (c.author) { const { password, ...a } = c.author as any; return { ...c, author: a }; }
    return c;
  }
}