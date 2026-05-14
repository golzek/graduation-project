
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course, Enrollment, Progress } from '../courses/course.entity';
import { Certificate } from '../certificates/certificate.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Course)       private courseRepo:     Repository<Course>,
    @InjectRepository(Enrollment)   private enrollmentRepo: Repository<Enrollment>,
    @InjectRepository(Progress)     private progressRepo:   Repository<Progress>,
    @InjectRepository(Certificate)  private certRepo:       Repository<Certificate>,
  ) {}

  async getTeacherStats(teacherId: string) {
    const courses   = await this.courseRepo.find({ where: { authorId: teacherId } });
    const courseIds = courses.map(c => c.id);
    if (!courseIds.length) return { totalCourses: 0, totalStudents: 0, totalRevenue: 0, totalCertificates: 0, courses: [] };

    const enroll = await this.enrollmentRepo.createQueryBuilder('e')
      .select('COUNT(*)', 'students').addSelect('SUM(e.paid_price)', 'revenue')
      .where('e.course_id IN (:...courseIds)', { courseIds }).getRawOne();

    const totalCertificates = await this.certRepo.createQueryBuilder('c')
      .where('c.course_id IN (:...courseIds)', { courseIds }).getCount();

    const coursesStats = await Promise.all(courses.map(c => this.getCourseStats(c.id)));

    return {
      totalCourses: courses.length,
      totalStudents: parseInt(enroll.students) || 0,
      totalRevenue:  parseFloat(enroll.revenue)  || 0,
      totalCertificates,
      courses: coursesStats,
    };
  }

  async getCourseStats(courseId: string) {
    const course = await this.courseRepo.findOne({ where: { id: courseId }, relations: ['modules', 'modules.lessons'] });
    const allIds = course.modules.flatMap(m => m.lessons.map(l => l.id));

    const summary = await this.enrollmentRepo.createQueryBuilder('e')
      .select('COUNT(*)', 'students').addSelect('SUM(e.paid_price)', 'revenue')
      .where('e.course_id = :courseId', { courseId }).getRawOne();

    const avgP = allIds.length ? await this.progressRepo.createQueryBuilder('p')
      .select('AVG(CASE WHEN p.completed THEN 1 ELSE 0 END) * 100', 'avg')
      .where('p.lesson_id IN (:...ids)', { ids: allIds }).getRawOne() : { avg: 0 };

    const enrollsByDay = await this.enrollmentRepo.createQueryBuilder('e')
      .select("DATE_TRUNC('day', e.enrolled_at)", 'day').addSelect('COUNT(*)', 'count')
      .where('e.course_id = :courseId', { courseId })
      .andWhere("e.enrolled_at > NOW() - INTERVAL '30 days'")
      .groupBy("DATE_TRUNC('day', e.enrolled_at)").orderBy('day', 'ASC').getRawMany();

    const topLessons = allIds.length ? await this.progressRepo.createQueryBuilder('p')
      .leftJoin('p.lesson', 'lesson')
      .select('lesson.title', 'title').addSelect('COUNT(*)', 'views').addSelect('AVG(p.watched_sec)', 'avgWatched')
      .where('p.lesson_id IN (:...ids)', { ids: allIds })
      .groupBy('lesson.id, lesson.title').orderBy('views', 'DESC').limit(5).getRawMany() : [];

    const certs = await this.certRepo.count({ where: { courseId } });

    return {
      courseId, title: course.title,
      students: parseInt(summary.students) || 0,
      revenue:  parseFloat(summary.revenue)  || 0,
      certificates: certs,
      avgProgressPercent: Math.round(parseFloat(avgP.avg) || 0),
      enrollsByDay: enrollsByDay.map(r => ({ date: r.day, count: parseInt(r.count) })),
      topLessons:   topLessons.map(l  => ({ title: l.title, views: parseInt(l.views), avgWatchedSec: Math.round(parseFloat(l.avgWatched)) })),
    };
  }
}
