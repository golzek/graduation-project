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


    send(
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
        const admins = await this.getAdminIds();
        await Promise.all(admins.map(id =>
            this.send(id, NotificationType.COURSE_PENDING_REVIEW,
                '📋 Новий курс потребує перевірки',
                `Викладач ${authorName} створив курс «${courseTitle}». Перейдіть до адмін-панелі.`,
                { courseId, courseTitle, authorName }),
        ));
    }

    async notifyAdminsNewUser(userName: string, userEmail: string, userId: string) {
        const admins = await this.getAdminIds();
        await Promise.all(admins.map(id =>
            this.send(id, NotificationType.NEW_USER_REGISTERED,
                '👥 Новий користувач',
                `${userName} (${userEmail}) зареєструвався на платформі.`,
                { userId, userName, userEmail }),
        ));
    }

    async notifyAdminsPromoCodePending(teacherName: string, courseTitle: string, promoCode: string, promoCodeId: string) {
        const admins = await this.getAdminIds();
        await Promise.all(admins.map(id =>
            this.send(id, NotificationType.PROMO_CODE_PENDING,
                '🏷️ Новий промокод на перевірку',
                `Викладач ${teacherName} створив промокод «${promoCode}» для курсу «${courseTitle}».`,
                { promoCodeId, promoCode, courseTitle, teacherName }),
        ));
    }

    async notifyAdminsPayoutRequest(teacherId: string, amount: number) {
        const admins = await this.getAdminIds();
        const teacher = await this.dataSource.query<{ name: string }[]>(
            `SELECT name FROM users WHERE id = $1`, [teacherId],
        );
        const name = teacher[0]?.name ?? 'Викладач';
        await Promise.all(admins.map(id =>
            this.send(id, NotificationType.PAYOUT_REQUEST_PENDING,
                '💸 Новий запит на виплату',
                `${name} подав запит на виплату ${amount.toLocaleString('uk-UA')} ₴.`,
                { teacherId, amount }),
        ));
    }

    async notifyAdminsNewReview(studentName: string, courseTitle: string, reviewId: string, courseId: string) {
        const admins = await this.getAdminIds();
        await Promise.all(admins.map(id =>
            this.send(id, NotificationType.NEW_REVIEW_PENDING,
                '⭐ Новий відгук на перевірку',
                `${studentName} залишив відгук на курс «${courseTitle}».`,
                { reviewId, courseId, courseTitle, studentName }),
        ));
    }


    async notifyTeacherCourseStatusChanged(teacherId: string, courseId: string, courseTitle: string, newStatus: string) {
        const approved = newStatus === 'published';
        await this.send(
            teacherId,
            approved ? NotificationType.COURSE_APPROVED : NotificationType.COURSE_REJECTED,
            approved ? '✅ Курс схвалено' : '❌ Курс відхилено',
            approved
                ? `Ваш курс «${courseTitle}» схвалено і тепер доступний студентам.`
                : `Ваш курс «${courseTitle}» не пройшов модерацію. Виправте вміст і надішліть знову.`,
            { courseId, courseTitle, newStatus },
        );
    }

    async notifyTeacherNewEnrollment(teacherId: string, studentName: string, courseId: string, courseTitle: string) {
        await this.send(teacherId, NotificationType.NEW_ENROLLMENT,
            '👤 Новий студент на курсі',
            `${studentName} записався(-лась) на ваш курс «${courseTitle}».`,
            { courseId, courseTitle, studentName },
        );
    }

    async notifyTeacherPromoCodeReviewed(teacherId: string, promoCode: string, approved: boolean, adminComment?: string) {
        await this.send(
            teacherId,
            approved ? NotificationType.PROMO_CODE_APPROVED : NotificationType.PROMO_CODE_REJECTED,
            approved ? '✅ Промокод схвалено' : '❌ Промокод відхилено',
            approved
                ? `Ваш промокод «${promoCode}» схвалено і тепер активний.`
                : `Ваш промокод «${promoCode}» відхилено.${adminComment ? ` Причина: ${adminComment}` : ''}`,
            { promoCode, adminComment },
        );
    }

    async notifyTeacherPayoutReviewed(teacherId: string, amount: number, status: string) {
        const map: Record<string, { type: NotificationType; title: string; msg: string }> = {
            approved: { type: NotificationType.PAYOUT_APPROVED, title: '✅ Запит на виплату схвалено', msg: `Ваш запит на виплату ${amount.toLocaleString('uk-UA')} ₴ схвалено.` },
            rejected: { type: NotificationType.PAYOUT_REJECTED, title: '❌ Запит на виплату відхилено', msg: `Ваш запит на виплату ${amount.toLocaleString('uk-UA')} ₴ відхилено.` },
            paid:     { type: NotificationType.PAYOUT_PAID,     title: '💰 Виплату здійснено',         msg: `Виплату ${amount.toLocaleString('uk-UA')} ₴ здійснено.` },
        };
        const entry = map[status] ?? map['approved'];
        await this.send(teacherId, entry.type, entry.title, entry.msg, { amount, status });
    }

    async notifyTeacherNewQuestion(teacherId: string, studentName: string, courseTitle: string, courseId: string, questionId: string) {
        await this.send(teacherId, NotificationType.NEW_QA_QUESTION,
            '❓ Нове питання до курсу',
            `${studentName} задав питання у курсі «${courseTitle}».`,
            { courseId, questionId },
        );
    }

    async notifyTeacherNewReview(teacherId: string, studentName: string, courseTitle: string, courseId: string, rating: number) {
        await this.send(teacherId, NotificationType.NEW_REVIEW_ON_COURSE,
            '💬 Новий відгук на вашому курсі',
            `${studentName} залишив відгук (${rating}★) на курс «${courseTitle}».`,
            { courseId, courseTitle, studentName, rating },
        );
    }


    async notifyStudentEnrolled(studentId: string, courseId: string, courseTitle: string) {
        await this.send(studentId, NotificationType.ENROLLMENT_CONFIRMED,
            '🎉 Ви записані на курс',
            `Вітаємо! Ви успішно записались на курс «${courseTitle}». Починайте навчання!`,
            { courseId, courseTitle },
        );
    }

    async notifyStudentsNewCourse(courseId: string, courseTitle: string) {
        const students = await this.dataSource.query<{ id: string }[]>(
            `SELECT id FROM users WHERE role = $1 AND "isActive" = true`, [UserRole.STUDENT],
        );
        const CHUNK = 50;
        for (let i = 0; i < students.length; i += CHUNK) {
            await Promise.all(students.slice(i, i + CHUNK).map(s =>
                this.send(s.id, NotificationType.NEW_COURSE_AVAILABLE,
                    "🎓 З'явився новий курс",
                    `У каталозі доступний новий курс «${courseTitle}». Перегляньте деталі та запишіться!`,
                    { courseId, courseTitle }),
            ));
        }
    }

    async notifyStudentNewAnswer(studentId: string, instructorName: string, courseTitle: string, courseId: string, questionId: string) {
        await this.send(studentId, NotificationType.NEW_QA_ANSWER,
            '💬 Викладач відповів на ваше питання',
            `${instructorName} відповів на ваше питання у курсі «${courseTitle}».`,
            { courseId, questionId },
        );
    }

    async notifyStudentReviewApproved(studentId: string, courseTitle: string, courseId: string) {
        await this.send(studentId, NotificationType.REVIEW_APPROVED,
            '✅ Ваш відгук опубліковано',
            `Ваш відгук на курс «${courseTitle}» пройшов модерацію.`,
            { courseId, courseTitle },
        );
    }


    async notifyUserBanned(userId: string, reason: string) {
        await this.send(userId, NotificationType.ACCOUNT_BANNED,
            '🚫 Ваш акаунт заблоковано',
            `Причина: ${reason}`,
            { reason },
        );
    }

    async notifyUserUnbanned(userId: string) {
        await this.send(userId, NotificationType.ACCOUNT_UNBANNED,
            '✅ Ваш акаунт розблоковано',
            'Ваш акаунт було розблоковано. Ви знову можете користуватись платформою.',
        );
    }

    async notifyCertificateIssued(userId: string, courseId: string, courseTitle: string, verifyCode: string, pdfUrl: string) {
        await this.send(userId, NotificationType.CERTIFICATE_ISSUED,
            '🏆 Сертифікат отримано',
            `Вітаємо! Ви отримали сертифікат про завершення курсу «${courseTitle}».`,
            { courseId, courseTitle, verifyCode, pdfUrl },
        );
    }


    async notifyCourseAnnouncement(
        enrolledUserIds: string[],
        courseId: string,
        courseTitle: string,
        announcementTitle: string,
        announcementId: string,
    ) {
        const CHUNK = 50;
        for (let i = 0; i < enrolledUserIds.length; i += CHUNK) {
            await Promise.all(enrolledUserIds.slice(i, i + CHUNK).map(uid =>
                this.send(uid, NotificationType.COURSE_ANNOUNCEMENT,
                    `📢 ${courseTitle}`,
                    announcementTitle,
                    { courseId, announcementId },
                ),
            ));
        }
    }

    private async getAdminIds(): Promise<string[]> {
        const rows = await this.dataSource.query<{ id: string }[]>(
            `SELECT id FROM users WHERE role IN ($1, $2) AND "isActive" = true`,
            [UserRole.ADMIN, UserRole.SUPER_ADMIN],
        );
        return rows.map(r => r.id);
    }
}
