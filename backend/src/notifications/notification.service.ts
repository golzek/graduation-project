import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './notification.entity';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
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
        return this.notifRepo.find({
            where,
            order: { createdAt: 'DESC' },
            take: 50,
        });
    }

    async getUnreadCount(userId: string): Promise<number> {
        return this.notifRepo.count({ where: { userId, isRead: false } });
    }

    async markRead(id: string, userId: string) {
        await this.notifRepo.update({ id, userId }, { isRead: true });
    }

    async markAllRead(userId: string) {
        await this.notifRepo.update({ userId, isRead: false }, { isRead: true });
    }

    async deleteOne(id: string, userId: string) {
        await this.notifRepo.delete({ id, userId });
    }

    private create(
        userId: string,
        type: NotificationType,
        title: string,
        message: string,
        meta?: Record<string, any>,
    ) {
        return this.notifRepo.save(
            this.notifRepo.create({ userId, type, title, message, meta: meta ?? null }),
        );
    }


    async notifyAdminsCourseNeedsReview(courseId: string, courseTitle: string, authorName: string) {
        const admins = await this.dataSource.query<{ id: string }[]>(
            `SELECT id FROM users WHERE role = $1 AND is_active = true`,
            [UserRole.ADMIN],
        );
        const promises = admins.map(a =>
            this.create(
                a.id,
                NotificationType.COURSE_PENDING_REVIEW,
                '📋 Новий курс потребує перевірки',
                `Викладач ${authorName} створив курс «${courseTitle}». Перейдіть до адмін-панелі, щоб розглянути та схвалити або відхилити.`,
                { courseId, courseTitle, authorName },
            ),
        );
        await Promise.all(promises);
    }

    async notifyTeacherCourseStatusChanged(
        teacherId: string,
        courseId: string,
        courseTitle: string,
        newStatus: string,
    ) {
        const isApproved = newStatus === 'published';
        await this.create(
            teacherId,
            isApproved ? NotificationType.COURSE_APPROVED : NotificationType.COURSE_REJECTED,
            isApproved ? '✅ Курс схвалено' : '❌ Курс відхилено',
            isApproved
                ? `Ваш курс «${courseTitle}» схвалено і тепер доступний студентам у каталозі.`
                : `Ваш курс «${courseTitle}» не пройшов модерацію. Перегляньте вміст і надішліть знову після виправлень.`,
            { courseId, courseTitle, newStatus },
        );
    }

    async notifyStudentsNewCourse(courseId: string, courseTitle: string) {
        const students = await this.dataSource.query<{ id: string }[]>(
            `SELECT id FROM users WHERE role = $1 AND is_active = true`,
            [UserRole.STUDENT],
        );
        // Batch insert — не робимо 1000 окремих INSERT
        const chunk = 100;
        for (let i = 0; i < students.length; i += chunk) {
            const batch = students.slice(i, i + chunk);
            const values = batch
                .map((_, j) => `($${j * 5 + 1}, $${j * 5 + 2}, $${j * 5 + 3}, $${j * 5 + 4}, $${j * 5 + 5})`)
                .join(', ');
            const params = batch.flatMap(s => [
                s.id,
                NotificationType.NEW_COURSE_AVAILABLE,
                '🎓 З\'явився новий курс',
                `У каталозі доступний новий курс «${courseTitle}». Перегляньте деталі та запишіться!`,
                JSON.stringify({ courseId, courseTitle }),
            ]);
            await this.dataSource.query(
                `INSERT INTO notifications (user_id, type, title, message, meta, is_read, created_at)
         VALUES ${values.replace(/\$\d+/g, (_, i) => `\$${Math.floor((parseInt(i) - 1) / 5) * 5 + (parseInt(i) - 1) % 5 + 1}`).replace(/\$\d+/g, (m, offset, str) => m)}
        `,

                [],
            );

            await Promise.all(
                batch.map(s =>
                    this.create(
                        s.id,
                        NotificationType.NEW_COURSE_AVAILABLE,
                        '🎓 З\'явився новий курс',
                        `У каталозі доступний новий курс «${courseTitle}». Перегляньте деталі та запишіться!`,
                        { courseId, courseTitle },
                    ),
                ),
            );
        }
    }

    async notifyStudentEnrolled(studentId: string, courseId: string, courseTitle: string) {
        await this.create(
            studentId,
            NotificationType.ENROLLMENT_CONFIRMED,
            '🎉 Ви записані на курс',
            `Вітаємо! Ви успішно записались на курс «${courseTitle}». Починайте навчання прямо зараз!`,
            { courseId, courseTitle },
        );
    }

    async notifyTeacherNewEnrollment(
        teacherId: string,
        studentName: string,
        courseId: string,
        courseTitle: string,
    ) {
        await this.create(
            teacherId,
            NotificationType.NEW_ENROLLMENT,
            '👤 Новий студент на курсі',
            `${studentName} записався(-лась) на ваш курс «${courseTitle}».`,
            { courseId, courseTitle, studentName },
        );
    }


    async notifyAdminsNewUser(userName: string, userEmail: string, userId: string) {
        const admins = await this.dataSource.query<{ id: string }[]>(
            `SELECT id FROM users WHERE role = $1 AND is_active = true`,
            [UserRole.ADMIN],
        );
        await Promise.all(
            admins.map(a =>
                this.create(
                    a.id,
                    NotificationType.NEW_USER_REGISTERED,
                    '👥 Новий користувач',
                    `${userName} (${userEmail}) зареєструвався на платформі.`,
                    { userId, userName, userEmail },
                ),
            ),
        );
    }
}