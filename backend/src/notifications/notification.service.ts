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
            `SELECT id FROM users WHERE role = $1 AND "isActive" = true`, [UserRole.ADMIN],
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
            `SELECT id FROM users WHERE role = $1 AND "isActive" = true`, [UserRole.STUDENT],
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
            `SELECT id FROM users WHERE role = $1 AND "isActive" = true`, [UserRole.ADMIN],
        );
        await Promise.all(admins.map(a =>
            this.save(a.id, NotificationType.NEW_USER_REGISTERED,
                '👥 Новий користувач',
                `${userName} (${userEmail}) зареєструвався на платформі.`,
                { userId, userName, userEmail }),
        ));
    }

    async notifyAdminsPromoCodePending(teacherName: string, courseTitle: string, promoCode: string, promoCodeId: string) {
        const admins = await this.dataSource.query<{ id: string }[]>(
            `SELECT id FROM users WHERE role = $1 AND "isActive" = true`, [UserRole.ADMIN],
        );
        await Promise.all(admins.map(a =>
            this.save(a.id, NotificationType.PROMO_CODE_PENDING,
                '🏷️ Новий промокод на перевірку',
                `Викладач ${teacherName} створив промокод «${promoCode}» для курсу «${courseTitle}».`,
                { promoCodeId, promoCode, courseTitle, teacherName }),
        ));
    }

    async notifyTeacherPromoCodeReviewed(teacherId: string, promoCode: string, approved: boolean, adminComment?: string) {
        await this.save(
            teacherId,
            approved ? NotificationType.PROMO_CODE_APPROVED : NotificationType.PROMO_CODE_REJECTED,
            approved ? '✅ Промокод схвалено' : '❌ Промокод відхилено',
            approved
                ? `Ваш промокод «${promoCode}» схвалено і тепер активний.`
                : `Ваш промокод «${promoCode}» відхилено.${adminComment ? ` Причина: ${adminComment}` : ''}`,
            { promoCode, adminComment },
        );
    }

    async notifyUserBanned(userId: string, reason: string) {
        await this.save(
            userId,
            NotificationType.ACCOUNT_BANNED,
            '🚫 Ваш акаунт заблоковано',
            `Причина: ${reason}`,
            { reason },
        );
    }

    async notifyUserUnbanned(userId: string) {
        await this.save(
            userId,
            NotificationType.ACCOUNT_UNBANNED,
            '✅ Ваш акаунт розблоковано',
            'Ваш акаунт було розблоковано. Ви знову можете користуватись платформою.',
        );
    }

    async notifyAdminsPayoutRequest(teacherId: string, amount: number) {
        const admins = await this.dataSource.query<{ id: string }[]>(
            `SELECT id FROM users WHERE role = $1 AND "isActive" = true`, [UserRole.ADMIN],
        );
        const teacher = await this.dataSource.query<{ name: string }[]>(
            `SELECT name FROM users WHERE id = $1`, [teacherId],
        );
        const name = teacher[0]?.name ?? 'Викладач';
        await Promise.all(admins.map(a =>
            this.save(a.id, NotificationType.PAYOUT_REQUEST_PENDING,
                '💸 Новий запит на виплату',
                `${name} подав запит на виплату ${amount.toLocaleString('uk-UA')} ₴. Перейдіть до адмін-панелі для обробки.`,
                { teacherId, amount }),
        ));
    }

    async notifyTeacherPayoutReviewed(teacherId: string, amount: number, status: string) {
        const typeMap: Record<string, NotificationType> = {
            approved: NotificationType.PAYOUT_APPROVED,
            rejected: NotificationType.PAYOUT_REJECTED,
            paid:     NotificationType.PAYOUT_PAID,
        };
        const titleMap: Record<string, string> = {
            approved: '✅ Запит на виплату схвалено',
            rejected: '❌ Запит на виплату відхилено',
            paid:     '💰 Виплату здійснено',
        };
        const msgMap: Record<string, string> = {
            approved: `Ваш запит на виплату ${amount.toLocaleString('uk-UA')} ₴ схвалено. Очікуйте зарахування коштів.`,
            rejected: `Ваш запит на виплату ${amount.toLocaleString('uk-UA')} ₴ відхилено. Зверніться до підтримки.`,
            paid:     `Виплату ${amount.toLocaleString('uk-UA')} ₴ здійснено. Кошти відправлені на ваші реквізити.`,
        };
        await this.save(
            teacherId,
            typeMap[status] ?? NotificationType.PAYOUT_APPROVED,
            titleMap[status] ?? '💸 Зміна статусу виплати',
            msgMap[status]   ?? `Статус вашої виплати змінено на "${status}".`,
            { amount, status },
        );
    }
    async notifyCertificateIssued(userId: string, courseId: string, courseTitle: string, verifyCode: string, pdfUrl: string) {
        await this.save(
            userId,
            NotificationType.CERTIFICATE_ISSUED,
            '🏆 Сертифікат отримано',
            `Вітаємо! Ви отримали сертифікат про завершення курсу «${courseTitle}». Перегляньте його у розділі «Мої сертифікати».`,
            { courseId, courseTitle, verifyCode, pdfUrl },
        );
    }
}