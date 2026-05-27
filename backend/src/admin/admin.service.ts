import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { IsEnum, IsOptional, IsBoolean, IsString, MaxLength, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User, UserRole } from '../users/user.entity';
import { Course, CourseStatus, Enrollment } from '../courses/course.entity';
import { NotificationService } from '../notifications/notification.service';

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
      private readonly notifSvc: NotificationService,
  ) {}

  getUsers(search?: string, role?: UserRole) {
    const where: any = {};
    if (role)   where.role  = role;
    if (search) where.email = ILike(`%${search}%`);
    return this.userRepo.find({
      where, order: { createdAt: 'DESC' },
      select: ['id', 'name', 'email', 'role', 'isActive', 'createdAt'],
    });
  }

  async updateUser(id: string, dto: UpdateUserDto) {
    const u = await this.userRepo.findOne({ where: { id } });
    if (!u) throw new NotFoundException('Користувача не знайдено');
    return this.userRepo.save(Object.assign(u, dto));
  }

  async banUser(id: string, dto: BanUserDto, adminId: string) {
    const u = await this.userRepo.findOne({ where: { id } });
    if (!u) throw new NotFoundException('Користувача не знайдено');
    if (!u.isActive) throw new BadRequestException('Користувач вже заблокований');
    if (u.role === UserRole.ADMIN) throw new BadRequestException('Не можна заблокувати адміна');

    u.isActive  = false;
    u.banReason = dto.reason;
    u.bannedAt  = new Date();
    u.bannedBy  = adminId;
    await this.userRepo.save(u);

    this.notifSvc.notifyUserBanned(u.id, dto.reason).catch(() => {});

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

    this.notifSvc.notifyUserUnbanned(u.id).catch(() => {});

    return { id: u.id, name: u.name, email: u.email, isActive: true };
  }

  async deleteUser(id: string) {
    const u = await this.userRepo.findOne({ where: { id } });
    if (!u) throw new NotFoundException();
    await this.userRepo.remove(u);
  }

  getCourses(search?: string, status?: CourseStatus) {
    const qb = this.courseRepo.createQueryBuilder('c')
        .leftJoinAndSelect('c.author', 'author')
        .select(['c.id','c.title','c.status','c.price','c.createdAt','author.id','author.name','author.email']);
    if (search) qb.andWhere('c.title ILIKE :s', { s: `%${search}%` });
    if (status) qb.andWhere('c.status = :status', { status });
    return qb.orderBy('c.createdAt', 'DESC').getMany();
  }

  async updateCourseStatus(id: string, dto: UpdateCourseStatusDto) {
    const c = await this.courseRepo.findOne({ where: { id } });
    if (!c) throw new NotFoundException('Курс не знайдено');
    c.status = dto.status;
    const saved = await this.courseRepo.save(c);

    this.notifSvc
        .notifyTeacherCourseStatusChanged(c.authorId, c.id, c.title, dto.status)
        .catch(() => {});

    if (dto.status === CourseStatus.PUBLISHED) {
      this.notifSvc.notifyStudentsNewCourse(c.id, c.title).catch(() => {});
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

    return {
      totalUsers, totalCourses, totalEnrollments,
      totalRevenue: parseFloat(rev?.total) || 0,
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
      dateTo: dateTo?.toISOString() ?? null,
    };
  }
}