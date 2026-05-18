import { Injectable } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Notification, NotificationType } from './notification.entity';
import { UserRole } from '../users/user.entity';

@Injectable()
export class NotificationService {
    constructor(
        @InjectRepository(Notification)
        private notifRepo: Repository<Notification>,
        @InjectDataSource() private dataSource: DataSource,
    ) {}

    async getForUser(userId: string, onlyUnread = false) {
        const where: any = { userId };
        if (onlyUnread) where.isRead = false;
        return this.notifRepo.find({ where, order: { createdAt: 'DESC' }, take: 50 });
    }

    async getUnreadCount(userId: string): Promise<number> {
        return this.notifRepo.count({ where: { userId, isRead: false } });
    }

    async markRead(id: string, userId: string) {
        await this.notifRepo.update({ id, userId }, { isRead: true });
        return { ok: true };
    }

    async markAllRead(userId: string) {
        await this.notifRepo.update({ userId, isRead: false }, { isRead: true });
        return { ok: true };
    }

    async deleteOne(id: string, userId: string) {
        await this.notifRepo.delete({ id, userId });
        return { ok: true };
    }

    private save(userId: string, type: NotificationType, title: string, message: string, meta?: Record<string, any>) {
        return this.notifRepo.save(this.notifRepo.create({ userId, type, title, message, meta: meta ?? null }));
    }

    async notifyAdminsCourseNeedsReview(courseId: string, courseTitle: string, authorName: string) {
        const admins = await this.dataSource.query<{ id: string }[]>(
            `SELECT id FROM users WHERE role = $1 AND is_active = true`, [UserRole.ADMIN],
        );
        await Promise.all(admins.map(a =>
            this.save(a.id, NotificationType.COURSE_PENDING_REVIEW,
                '📋 Новий курс потребує перевірки',
                `Викладач ${authorName} створив курс «${courseTitle}». Перейдіть до адмін-панелі щоб схвалити або відхилити.`,
                { courseId, courseTitle, authorName }),
        ));
    }

    async notifyTeacherCourseStatusChanged(teacherId: string, courseId: string, courseTitle: string, newStatus: string) {
        const approved = newStatus === 'published';
        await this.save(
            teacherId,
            approved ? NotificationType.COURSE_APPROVED : NotificationType.COURSE_REJECTED,
            approved ? '✅ Курс схвалено' : '❌ Курс відхилено',
            approved
                ? `Ваш курс «${courseTitle}» схвалено і тепер доступний студентам у каталозі.`
                : `Ваш курс «${courseTitle}» не пройшов модерацію. Виправте вміст і надішліть знову.`,
            { courseId, courseTitle, newStatus },
        );
    }

    async notifyStudentsNewCourse(courseId: string, courseTitle: string) {
        const students = await this.dataSource.query<{ id: string }[]>(
            `SELECT id FROM users WHERE role = $1 AND is_active = true`, [UserRole.STUDENT],
        );
        const chunk = 50;
        for (let i = 0; i < students.length; i += chunk) {
            await Promise.all(students.slice(i, i + chunk).map(s =>
                this.save(s.id, NotificationType.NEW_COURSE_AVAILABLE,
                    "🎓 З'явився новий курс",
                    `У каталозі доступний новий курс «${courseTitle}». Перегляньте деталі та запишіться!`,
                    { courseId, courseTitle }),
            ));
        }
    }

    async notifyStudentEnrolled(studentId: string, courseId: string, courseTitle: string) {
        await this.save(studentId, NotificationType.ENROLLMENT_CONFIRMED,
            '🎉 Ви записані на курс',
            `Вітаємо! Ви успішно записались на курс «${courseTitle}». Починайте навчання прямо зараз!`,
            { courseId, courseTitle },
        );
    }

    async notifyTeacherNewEnrollment(teacherId: string, studentName: string, courseId: string, courseTitle: string) {
        await this.save(teacherId, NotificationType.NEW_ENROLLMENT,
            '👤 Новий студент на курсі',
            `${studentName} записався(-лась) на ваш курс «${courseTitle}».`,
            { courseId, courseTitle, studentName },
        );
    }

    async notifyAdminsNewUser(userName: string, userEmail: string, userId: string) {
        const admins = await this.dataSource.query<{ id: string }[]>(
            `SELECT id FROM users WHERE role = $1 AND is_active = true`, [UserRole.ADMIN],
        );
        await Promise.all(admins.map(a =>
            this.save(a.id, NotificationType.NEW_USER_REGISTERED,
                '👥 Новий користувач',
                `${userName} (${userEmail}) зареєструвався на платформі.`,
                { userId, userName, userEmail }),
        ));
    }
}