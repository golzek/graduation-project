import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { User, UserRole } from '../users/user.entity';
import { Course, CourseStatus, Enrollment } from '../courses/course.entity';

export class UpdateUserDto {
  @ApiPropertyOptional({ enum: UserRole })
  @IsOptional() @IsEnum(UserRole) role?: UserRole;

  @ApiPropertyOptional()
  @IsOptional() @IsBoolean() isActive?: boolean;
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
    return this.courseRepo.save(c);
  }

  async deleteCourse(id: string) {
    const c = await this.courseRepo.findOne({ where: { id } });
    if (!c) throw new NotFoundException();
    await this.courseRepo.remove(c);
  }

  async getPlatformStats() {
    const [totalUsers, totalCourses, totalEnrollments] = await Promise.all([
      this.userRepo.count(), this.courseRepo.count(), this.enrollmentRepo.count(),
    ]);
    const usersByRole = await this.userRepo.createQueryBuilder('u')
        .select('u.role','role').addSelect('COUNT(*)','count').groupBy('u.role').getRawMany();
    const rev = await this.enrollmentRepo.createQueryBuilder('e')
        .select('SUM(e.paidPrice)','total').getRawOne();
    const newUsersThisMonth = await this.userRepo.createQueryBuilder('u')
        .where("u.createdAt > DATE_TRUNC('month', NOW())").getCount();
    const newCoursesThisMonth = await this.courseRepo.createQueryBuilder('c')
        .where("c.createdAt > DATE_TRUNC('month', NOW())").getCount();
    const registrationsByDay = await this.userRepo.createQueryBuilder('u')
        .select("DATE_TRUNC('day', u.\"createdAt\")",'day').addSelect('COUNT(*)','count')
        .where("u.\"createdAt\" > NOW() - INTERVAL '7 days'")
        .groupBy("DATE_TRUNC('day', u.\"createdAt\")").orderBy('day','ASC').getRawMany();
    return {
      totalUsers, totalCourses, totalEnrollments,
      totalRevenue: parseFloat(rev?.total) || 0,
      newUsersThisMonth, newCoursesThisMonth,
      usersByRole: Object.fromEntries(usersByRole.map(r => [r.role, parseInt(r.count)])),
      registrationsByDay: registrationsByDay.map(r => ({ date: r.day, count: parseInt(r.count) })),
    };
  }
}