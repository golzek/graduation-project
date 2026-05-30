import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { IsEnum, IsOptional, IsBoolean, IsString, MaxLength, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User, UserRole } from '../users/user.entity';
import { Course, CourseStatus, Enrollment, Lesson, Progress } from '../courses/course.entity';
import { Certificate } from '../certificates/certificate.entity';
import { NotificationService } from '../notifications/notification.service';
import { fireAndForget } from '../common/logger.util';

export class UpdateUserDto {
  @ApiPropertyOptional({ enum: UserRole })
  @IsOptional() @IsEnum(UserRole) role?: UserRole;

  @ApiPropertyOptional()
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class BanUserDto {
  @ApiProperty({ description: 'Причина блокування', example: 'Порушення правил платформи' })
  @IsString() @IsNotEmpty() @MaxLength(500)
  reason: string;
}

export class UpdateCourseStatusDto {
  @ApiPropertyOptional({ enum: CourseStatus })
  @IsEnum(CourseStatus) status: CourseStatus;
}

@Injectable()
export class AdminService {
  constructor(
      @InjectRepository(User)       private userRepo:       Repository<User>,
      @InjectRepository(Course)     private courseRepo:     Repository<Course>,
      @InjectRepository(Enrollment) private enrollmentRepo: Repository<Enrollment>,
      @InjectRepository(Lesson)     private lessonRepo:     Repository<Lesson>,
      @InjectRepository(Progress)   private progressRepo:   Repository<Progress>,
      @InjectRepository(Certificate) private certRepo:        Repository<Certificate>,
      private readonly notifSvc: NotificationService,
  ) {}

  async getUsers(search?: string, role?: UserRole, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (role)   where.role  = role;
    if (search) where.email = ILike(`%${search}%`);
    const [data, total] = await this.userRepo.findAndCount({
      where, order: { createdAt: 'DESC' },
      select: ['id', 'name', 'email', 'role', 'isActive', 'createdAt'],
      skip, take: limit,
    });
    return { data, total, page, totalPages: Math.ceil(total / limit) };
  }

  async updateUser(id: string, dto: UpdateUserDto, requesterId?: string) {
    const u = await this.userRepo.findOne({ where: { id } });
    if (!u) throw new NotFoundException('Користувача не знайдено');
    if (u.role === UserRole.SUPER_ADMIN) throw new BadRequestException('Не можна змінювати супер-адміна');
    if (dto.role === UserRole.SUPER_ADMIN) throw new BadRequestException('Не можна призначити роль супер-адміна');
    if (dto.role === UserRole.ADMIN) {
      const requester = requesterId ? await this.userRepo.findOne({ where: { id: requesterId } }) : null;
      if (!requester || requester.role !== UserRole.SUPER_ADMIN) {
        throw new ForbiddenException('Тільки супер-адмін може призначати адміністраторів');
      }
    }
    return this.userRepo.save(Object.assign(u, dto));
  }

  async banUser(id: string, dto: BanUserDto, adminId: string) {
    const u = await this.userRepo.findOne({ where: { id } });
    if (!u) throw new NotFoundException('Користувача не знайдено');
    if (!u.isActive) throw new BadRequestException('Користувач вже заблокований');
    if (u.role === UserRole.ADMIN) throw new BadRequestException('Не можна заблокувати адміна');
    if (u.role === UserRole.SUPER_ADMIN) throw new BadRequestException('Не можна заблокувати супер-адміна');

    u.isActive  = false;
    u.banReason = dto.reason;
    u.bannedAt  = new Date();
    u.bannedBy  = adminId;
    await this.userRepo.save(u);

    fireAndForget(this.notifSvc.notifyUserBanned(u.id, dto.reason), 'admin:notifyUserBanned');

    return {
      id: u.id, name: u.name, email: u.email,
      isActive: false, banReason: u.banReason, bannedAt: u.bannedAt,
    };
  }

  async unbanUser(id: string) {
    const u = await this.userRepo.findOne({ where: { id } });
    if (!u) throw new NotFoundException('Користувача не знайдено');
    if (u.isActive) throw new BadRequestException('Користувач не заблокований');

    u.isActive  = true;
    u.banReason = null;
    u.bannedAt  = null;
    u.bannedBy  = null;
    await this.userRepo.save(u);

    fireAndForget(this.notifSvc.notifyUserUnbanned(u.id), 'admin:notifyUserUnbanned');

    return { id: u.id, name: u.name, email: u.email, isActive: true };
  }

  async deleteUser(id: string) {
    const u = await this.userRepo.findOne({ where: { id } });
    if (!u) throw new NotFoundException();
    await this.userRepo.remove(u);
  }

  async getCourses(search?: string, status?: CourseStatus, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const qb = this.courseRepo.createQueryBuilder('c')
        .leftJoinAndSelect('c.author', 'author')
        .select(['c.id','c.title','c.status','c.price','c.createdAt','author.id','author.name','author.email']);
    if (search) qb.andWhere('c.title ILIKE :s', { s: `%${search}%` });
    if (status) qb.andWhere('c.status = :status', { status });
    const [data, total] = await qb.orderBy('c.createdAt', 'DESC').skip(skip).take(limit).getManyAndCount();
    return { data, total, page, totalPages: Math.ceil(total / limit) };
  }

  async updateCourseStatus(id: string, dto: UpdateCourseStatusDto) {
    const c = await this.courseRepo.findOne({ where: { id } });
    if (!c) throw new NotFoundException('Курс не знайдено');
    c.status = dto.status;
    const saved = await this.courseRepo.save(c);

    fireAndForget(
        this.notifSvc.notifyTeacherCourseStatusChanged(c.authorId, c.id, c.title, dto.status),
        'admin:notifyTeacherCourseStatusChanged',
    );

    if (dto.status === CourseStatus.PUBLISHED) {
      fireAndForget(this.notifSvc.notifyStudentsNewCourse(c.id, c.title), 'admin:notifyStudentsNewCourse');
    }

    return saved;
  }

  async deleteCourse(id: string) {
    const c = await this.courseRepo.findOne({ where: { id } });
    if (!c) throw new NotFoundException();
    await this.courseRepo.remove(c);
  }

  async getPlatformStats(from?: string, to?: string, period?: string) {
    let dateFrom: Date | null = null;
    let dateTo: Date | null = null;

    if (period === 'year') {
      dateFrom = new Date(); dateFrom.setFullYear(dateFrom.getFullYear() - 1); dateFrom.setHours(0,0,0,0);
    } else if (period === 'month') {
      dateFrom = new Date(); dateFrom.setMonth(dateFrom.getMonth() - 1); dateFrom.setHours(0,0,0,0);
    } else if (period === 'week') {
      dateFrom = new Date(); dateFrom.setDate(dateFrom.getDate() - 7); dateFrom.setHours(0,0,0,0);
    } else if (from) {
      dateFrom = new Date(from);
    }
    if (to) { dateTo = new Date(to); dateTo.setHours(23,59,59,999); }

    const userQb   = this.userRepo.createQueryBuilder('u');
    const courseQb = this.courseRepo.createQueryBuilder('c');
    const enrollQb = this.enrollmentRepo.createQueryBuilder('e');
    if (dateFrom) {
      userQb.andWhere('u."createdAt" >= :df', { df: dateFrom });
      courseQb.andWhere('c."createdAt" >= :df', { df: dateFrom });
      enrollQb.andWhere('e."enrolledAt" >= :df', { df: dateFrom });
    }
    if (dateTo) {
      userQb.andWhere('u."createdAt" <= :dt', { dt: dateTo });
      courseQb.andWhere('c."createdAt" <= :dt', { dt: dateTo });
      enrollQb.andWhere('e."enrolledAt" <= :dt', { dt: dateTo });
    }

    const [totalUsers, totalCourses, totalEnrollments] = await Promise.all([
      (dateFrom || dateTo) ? userQb.getCount()   : this.userRepo.count(),
      (dateFrom || dateTo) ? courseQb.getCount() : this.courseRepo.count(),
      (dateFrom || dateTo) ? enrollQb.getCount() : this.enrollmentRepo.count(),
    ]);

    const usersByRole = await this.userRepo.createQueryBuilder('u')
        .select('u.role','role').addSelect('COUNT(*)','count').groupBy('u.role').getRawMany();

    const revQb = this.enrollmentRepo.createQueryBuilder('e').select('SUM(e.paidPrice)','total');
    if (dateFrom) revQb.andWhere('e."enrolledAt" >= :df', { df: dateFrom });
    if (dateTo)   revQb.andWhere('e."enrolledAt" <= :dt', { dt: dateTo });
    const rev = await revQb.getRawOne();

    const periodLabel = period === 'year'  ? 'за рік'
        : period === 'month' ? 'за місяць'
            : period === 'week'  ? 'за 7 днів'
                : (from || to)       ? 'за період'
                    : null;

    const newUsersThisMonth = periodLabel ? null : await this.userRepo.createQueryBuilder('u')
        .where("u.\"createdAt\" > DATE_TRUNC('month', NOW())").getCount();
    const newCoursesThisMonth = periodLabel ? null : await this.courseRepo.createQueryBuilder('c')
        .where("c.\"createdAt\" > DATE_TRUNC('month', NOW())").getCount();

    const effectiveDateFrom = dateFrom ?? (() => {
      const d = new Date(); d.setDate(d.getDate() - 7); d.setHours(0,0,0,0); return d;
    })();

    const diffDays = Math.ceil(
        ((dateTo ?? new Date()).getTime() - effectiveDateFrom.getTime()) / 86400000
    );
    const trunc = diffDays > 60 ? 'month' : 'day';

    const regQb = this.userRepo.createQueryBuilder('u')
        .select(`DATE_TRUNC('${trunc}', u."createdAt")`,'day')
        .addSelect('COUNT(*)','count')
        .groupBy(`DATE_TRUNC('${trunc}', u."createdAt")`)
        .orderBy('day','ASC')
        .where('u."createdAt" >= :df', { df: effectiveDateFrom });
    if (dateTo) regQb.andWhere('u."createdAt" <= :dt', { dt: dateTo });

    const registrationsByDay = await regQb.getRawMany();

    const revChartQb = this.enrollmentRepo.createQueryBuilder('e')
        .select(`DATE_TRUNC('${trunc}', e."enrolledAt")`,'day')
        .addSelect('SUM(e."paidPrice")','revenue')
        .groupBy(`DATE_TRUNC('${trunc}', e."enrolledAt")`)
        .orderBy('day','ASC')
        .where('e."enrolledAt" >= :df', { df: effectiveDateFrom });
    if (dateTo) revChartQb.andWhere('e."enrolledAt" <= :dt', { dt: dateTo });
    const revenueByDay = await revChartQb.getRawMany();

    const topCoursesQb = this.enrollmentRepo.createQueryBuilder('e')
        .leftJoin('e.course', 'c')
        .select('c.id', 'courseId')
        .addSelect('c.title', 'title')
        .addSelect('COUNT(e.id)', 'enrollments')
        .addSelect('SUM(e."paidPrice")', 'revenue')
        .where('c.id IS NOT NULL')
        .andWhere('e."enrolledAt" >= :df', { df: effectiveDateFrom })
        .groupBy('c.id')
        .addGroupBy('c.title')
        .orderBy('"enrollments"', 'DESC')
        .limit(5);
    if (dateTo) topCoursesQb.andWhere('e."enrolledAt" <= :dt', { dt: dateTo });
    const topCoursesRaw = await topCoursesQb.getRawMany();

    const completionRateQb = this.enrollmentRepo.createQueryBuilder('e')
        .leftJoin('e.course', 'c')
        .leftJoin(
            qb => qb
                .from(Lesson, 'l')
                .select('m.course_id', 'cid')
                .addSelect('COUNT(l.id)', 'total')
                .innerJoin('modules', 'm', 'm.id = l."module_id"')
                .groupBy('m.course_id'),
            'lc',
            'lc.cid = e."course_id"',
        )
        .leftJoin(
            qb => qb
                .from(Progress, 'p')
                .innerJoin('lessons', 'l', 'l.id = p."lesson_id"')
                .innerJoin('modules', 'm', 'm.id = l."module_id"')
                .select('m.course_id', 'cid')
                .addSelect('p."user_id"', 'uid')
                .addSelect('COUNT(p.id)', 'done')
                .where('p.completed = true')
                .groupBy('m.course_id, p."user_id"'),
            'pc',
            'pc.cid = e."course_id" AND pc.uid = e."user_id"',
        )
        .select('COUNT(e.id)', 'totalEnrollments')
        .addSelect(
            'COUNT(CASE WHEN COALESCE(lc.total,0) > 0 AND COALESCE(pc.done,0) >= lc.total THEN 1 END)',
            'completedEnrollments',
        );

    if (dateFrom) completionRateQb.andWhere('e."enrolledAt" >= :df', { df: dateFrom });
    if (dateTo)   completionRateQb.andWhere('e."enrolledAt" <= :dt', { dt: dateTo });

    const crRaw = await completionRateQb.getRawOne();
    const crTotal     = parseInt(crRaw?.totalEnrollments)     || 0;
    const crCompleted = parseInt(crRaw?.completedEnrollments) || 0;
    const completionRate = crTotal > 0 ? Math.round((crCompleted / crTotal) * 100) : 0;

    return {
      totalUsers, totalCourses, totalEnrollments,
      totalRevenue: parseFloat(rev?.total) || 0,
      completionRate,
      newUsersThisMonth, newCoursesThisMonth, periodLabel,
      usersByRole: Object.fromEntries(usersByRole.map(r => [r.role, parseInt(r.count)])),
      registrationsByDay: registrationsByDay.map(r => ({ date: r.day, count: parseInt(r.count) })),
      revenueByDay: revenueByDay.map(r => ({ date: r.day, revenue: parseFloat(r.revenue) || 0 })),
      topCourses: topCoursesRaw.map(r => ({
        courseId: r.courseId,
        title: r.title,
        enrollments: parseInt(r.enrollments),
        revenue: parseFloat(r.revenue) || 0,
      })),
      granularity: trunc,
      dateFrom: dateFrom?.toISOString() ?? null,
      dateTo: (dateTo ?? new Date()).toISOString(),
    };
  }

  async getTeachersStats() {
    const teachers = await this.userRepo.find({
      where: { role: UserRole.TEACHER, isActive: true },
      select: ['id', 'name', 'email', 'createdAt'],
      order: { createdAt: 'DESC' },
    });

    if (!teachers.length) return [];

    const teacherIds = teachers.map(t => t.id);

    const revenueRows = await this.enrollmentRepo
        .createQueryBuilder('e')
        .leftJoin('e.course', 'c')
        .select('c."author_id"', 'teacherId')
        .addSelect('SUM(e."paidPrice")', 'revenue')
        .addSelect('COUNT(e.id)', 'enrollments')
        .where('c."author_id" IN (:...ids)', { ids: teacherIds })
        .groupBy('c."author_id"')
        .getRawMany();

    const courseRows = await this.courseRepo
        .createQueryBuilder('c')
        .select('c."author_id"', 'teacherId')
        .addSelect('COUNT(c.id)', 'total')
        .addSelect(`COUNT(CASE WHEN c.status = 'published' THEN 1 END)`, 'published')
        .addSelect(`COUNT(CASE WHEN c.status = 'pending' THEN 1 END)`, 'pending')
        .where('c."author_id" IN (:...ids)', { ids: teacherIds })
        .groupBy('c."author_id"')
        .getRawMany();

    const certRows = await this.certRepo
        .createQueryBuilder('cert')
        .leftJoin('cert.course', 'c')
        .select('c."author_id"', 'teacherId')
        .addSelect('COUNT(cert.id)', 'certificates')
        .where('c."author_id" IN (:...ids)', { ids: teacherIds })
        .groupBy('c."author_id"')
        .getRawMany();

    const ratingRows = await this.courseRepo
        .createQueryBuilder('c')
        .leftJoin('reviews', 'r', 'r."courseId" = c.id')
        .select('c."author_id"', 'teacherId')
        .addSelect('AVG(r.rating)', 'avgRating')
        .addSelect('COUNT(r.id)', 'reviewCount')
        .where('c."author_id" IN (:...ids)', { ids: teacherIds })
        .groupBy('c."author_id"')
        .getRawMany();

    const revenueMap    = Object.fromEntries(revenueRows.map(r => [r.teacherId, r]));
    const courseMap     = Object.fromEntries(courseRows.map(r => [r.teacherId, r]));
    const certMap       = Object.fromEntries(certRows.map(r => [r.teacherId, r]));
    const ratingMap     = Object.fromEntries(ratingRows.map(r => [r.teacherId, r]));

    return teachers.map(t => ({
      id:           t.id,
      name:         t.name,
      email:        t.email,
      joinedAt:     t.createdAt,
      revenue:      parseFloat(revenueMap[t.id]?.revenue)     || 0,
      enrollments:  parseInt(revenueMap[t.id]?.enrollments)   || 0,
      totalCourses: parseInt(courseMap[t.id]?.total)          || 0,
      published:    parseInt(courseMap[t.id]?.published)      || 0,
      pending:      parseInt(courseMap[t.id]?.pending)        || 0,
      certificates: parseInt(certMap[t.id]?.certificates)     || 0,
      avgRating:    parseFloat(ratingMap[t.id]?.avgRating)    || 0,
      reviewCount:  parseInt(ratingMap[t.id]?.reviewCount)    || 0,
    })).sort((a, b) => b.revenue - a.revenue);
  }
}