import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course, Enrollment, Progress } from '../courses/course.entity';
import { Certificate } from '../certificates/certificate.entity';

@Injectable()
export class AnalyticsService {
  constructor(
      @InjectRepository(Course)       private courseRepo:      Repository<Course>,
      @InjectRepository(Enrollment)   private enrollmentRepo:  Repository<Enrollment>,
      @InjectRepository(Progress)     private progressRepo:    Repository<Progress>,
      @InjectRepository(Certificate)  private certRepo:        Repository<Certificate>,
  ) {}

  async getStudentStats(userId: string) {
    try {
      const [timeRow] = await this.progressRepo.query(`
        SELECT SUM(CASE WHEN p."watchedSec" > 0 THEN p."watchedSec" ELSE COALESCE(l."durationSec", 0) END) AS total
        FROM progress p
        LEFT JOIN lessons l ON l.id = p.lesson_id
        WHERE p.user_id = $1
          AND (p."watchedSec" > 0 OR p.completed = true)
      `, [userId]);
      const totalWatchedSec = parseInt(timeRow?.total ?? '0') || 0;

      const activityByDay: { day: string; seconds: string }[] = await this.progressRepo.query(`
        SELECT DATE(p.updated_at) AS day, COUNT(*) AS seconds
        FROM progress p
        WHERE p.user_id = $1
          AND (p."watchedSec" > 0 OR p.completed = true)
          AND p.updated_at > NOW() - INTERVAL '60 days'
        GROUP BY DATE(p.updated_at)
        ORDER BY day ASC
      `, [userId]);

      const streak = this.calcStreak(activityByDay.map(r => r.day));

      const weeklySeconds: { week: string; seconds: string }[] = await this.progressRepo.query(`
        SELECT DATE_TRUNC('week', p.updated_at) AS week,
               SUM(CASE WHEN p."watchedSec" > 0 THEN p."watchedSec" ELSE COALESCE(l."durationSec", 0) END) AS seconds
        FROM progress p
        LEFT JOIN lessons l ON l.id = p.lesson_id
        WHERE p.user_id = $1
          AND (p."watchedSec" > 0 OR p.completed = true)
          AND p.updated_at > NOW() - INTERVAL '8 weeks'
        GROUP BY DATE_TRUNC('week', p.updated_at)
        ORDER BY week ASC
      `, [userId]);

      const hourHeatmap: { hour: string; seconds: string }[] = await this.progressRepo.query(`
        SELECT EXTRACT(HOUR FROM p.updated_at)::int AS hour,
               SUM(CASE WHEN p."watchedSec" > 0 THEN p."watchedSec" ELSE COALESCE(l."durationSec", 0) END) AS seconds
        FROM progress p
        LEFT JOIN lessons l ON l.id = p.lesson_id
        WHERE p.user_id = $1
          AND (p."watchedSec" > 0 OR p.completed = true)
        GROUP BY EXTRACT(HOUR FROM p.updated_at)
        ORDER BY hour ASC
      `, [userId]);

      const weekdaySeconds: { dow: string; seconds: string }[] = await this.progressRepo.query(`
        SELECT EXTRACT(DOW FROM p.updated_at)::int AS dow,
               SUM(CASE WHEN p."watchedSec" > 0 THEN p."watchedSec" ELSE COALESCE(l."durationSec", 0) END) AS seconds
        FROM progress p
        LEFT JOIN lessons l ON l.id = p.lesson_id
        WHERE p.user_id = $1
          AND (p."watchedSec" > 0 OR p.completed = true)
        GROUP BY EXTRACT(DOW FROM p.updated_at)
        ORDER BY dow ASC
      `, [userId]);

      return {
        totalWatchedSec,
        streak,
        activityByDay:  activityByDay.map(r  => ({ day:  r.day,            seconds: parseInt(r.seconds) })),
        weeklySeconds:  weeklySeconds.map(r  => ({ week: r.week,           seconds: parseInt(r.seconds) })),
        hourHeatmap:    hourHeatmap.map(r    => ({ hour: parseInt(r.hour), seconds: parseInt(r.seconds) })),
        weekdaySeconds: weekdaySeconds.map(r => ({ dow:  parseInt(r.dow),  seconds: parseInt(r.seconds) })),
      };
    } catch (err) {
      console.error('[AnalyticsService] getStudentStats error:', JSON.stringify(err, Object.getOwnPropertyNames(err)));
      return {
        totalWatchedSec: 0,
        streak: 0,
        activityByDay: [],
        weeklySeconds: [],
        hourHeatmap: [],
        weekdaySeconds: [],
      };
    }
  }

  private calcStreak(days: string[]): number {
    if (!days.length) return 0;
    const set = new Set(days.map(d => d.slice(0, 10)));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let streak = 0;
    const cur = new Date(today);
    if (!set.has(cur.toISOString().slice(0, 10))) {
      cur.setDate(cur.getDate() - 1);
    }
    while (set.has(cur.toISOString().slice(0, 10))) {
      streak++;
      cur.setDate(cur.getDate() - 1);
    }
    return streak;
  }

  async getTeacherStats(teacherId: string) {
    const courses   = await this.courseRepo.find({ where: { authorId: teacherId } });
    const courseIds = courses.map(c => c.id);
    if (!courseIds.length) {
      return { totalCourses: 0, totalStudents: 0, totalRevenue: 0, totalCertificates: 0, courses: [] };
    }

    const enroll = await this.enrollmentRepo
        .createQueryBuilder('e')
        .select('COUNT(*)', 'students')
        .addSelect('SUM(e.paidPrice)', 'revenue')
        .where('e.courseId IN (:...courseIds)', { courseIds })
        .getRawOne();

    const totalCertificates = await this.certRepo
        .createQueryBuilder('c')
        .where('c.courseId IN (:...courseIds)', { courseIds })
        .getCount();

    const coursesStats = await Promise.all(courses.map(c => this.getCourseStats(c.id)));

    return {
      totalCourses:  courses.length,
      totalStudents: parseInt(enroll?.students) || 0,
      totalRevenue:  parseFloat(enroll?.revenue) || 0,
      totalCertificates,
      courses: coursesStats,
    };
  }

  async getCourseStats(courseId: string) {
    const course = await this.courseRepo.findOne({
      where: { id: courseId },
      relations: ['modules', 'modules.lessons'],
    });
    if (!course) return null;

    const allIds = course.modules.flatMap(m => m.lessons.map(l => l.id));

    const summary = await this.enrollmentRepo
        .createQueryBuilder('e')
        .select('COUNT(*)', 'students')
        .addSelect('SUM(e.paidPrice)', 'revenue')
        .where('e.courseId = :courseId', { courseId })
        .getRawOne();

    const avgP = allIds.length
        ? await this.progressRepo
            .createQueryBuilder('p')
            .select('AVG(CASE WHEN p.completed = true THEN 1 ELSE 0 END) * 100', 'avg')
            .where('p.lessonId IN (:...ids)', { ids: allIds })
            .getRawOne()
        : { avg: 0 };

    const enrollsByDay = await this.enrollmentRepo
        .createQueryBuilder('e')
        .select("DATE_TRUNC('day', e.enrolledAt)", 'day')
        .addSelect('COUNT(*)', 'count')
        .where('e.courseId = :courseId', { courseId })
        .andWhere("e.enrolledAt > NOW() - INTERVAL '30 days'")
        .groupBy("DATE_TRUNC('day', e.enrolledAt)")
        .orderBy('day', 'ASC')
        .getRawMany();

    const topLessons = allIds.length
        ? await this.progressRepo
            .createQueryBuilder('p')
            .leftJoin('p.lesson', 'lesson')
            .select('lesson.title', 'title')
            .addSelect('COUNT(*)', 'views')
            .addSelect('AVG(p.watchedSec)', 'avgWatched')
            .where('p.lessonId IN (:...ids)', { ids: allIds })
            .groupBy('lesson.id, lesson.title')
            .orderBy('views', 'DESC')
            .limit(5)
            .getRawMany()
        : [];

    const certs = await this.certRepo.count({ where: { courseId } });

    return {
      courseId,
      title:              course.title,
      students:           parseInt(summary?.students) || 0,
      revenue:            parseFloat(summary?.revenue) || 0,
      certificates:       certs,
      avgProgressPercent: Math.round(parseFloat(avgP?.avg) || 0),
      enrollsByDay:       enrollsByDay.map(r => ({ date: r.day,   count: parseInt(r.count) })),
      topLessons:         topLessons.map(l  => ({
        title:         l.title,
        views:         parseInt(l.views),
        avgWatchedSec: Math.round(parseFloat(l.avgWatched)),
      })),
    };
  }
}