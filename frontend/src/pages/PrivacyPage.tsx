import React from 'react';
import { Link } from 'react-router-dom';

export function PrivacyPage() {
    return (
        <div style={s.page}>
            <div style={s.inner} className="r-prose-inner">
                <p style={s.breadcrumb}>
                    <Link to="/courses" style={s.breadLink}>Головна</Link>
                    {' / '}Політика конфіденційності
                </p>

                <h1 style={s.h1}>Політика конфіденційності</h1>
                <p style={s.updated}>Остання редакція: 1 червня 2026 р.</p>

                <div style={s.body}>

                    <Section title="1. Які дані ми збираємо">
                        При реєстрації та використанні платформи ми збираємо: ім'я та
                        адресу електронної пошти; дані про активність (переглянуті курси,
                        прогрес навчання); платіжну інформацію (обробляється захищеним
                        платіжним провайдером, ми не зберігаємо дані карток); технічні дані
                        (IP-адреса, тип браузера, cookie).
                    </Section>

                    <Section title="2. Як ми використовуємо дані">
                        Зібрані дані використовуються для: надання доступу до платформи та
                        персоналізації навчання; обробки платежів та видачі сертифікатів;
                        надсилання важливих сповіщень про акаунт; покращення функціональності
                        платформи на основі аналітики.
                    </Section>

                    <Section title="3. Передача даних третім особам">
                        Ми не продаємо та не передаємо ваші персональні дані третім особам,
                        за винятком: платіжних провайдерів (LiqPay) для обробки транзакцій;
                        хмарних сервісів зберігання файлів, які використовуються виключно
                        для роботи платформи; випадків, передбачених законодавством України.
                    </Section>

                    <Section title="4. Cookies">
                        Ми використовуємо файли cookie для підтримки сесії авторизації та
                        збору анонімної аналітики. Ви можете відключити cookie в налаштуваннях
                        браузера, однак це може вплинути на роботу платформи.
                    </Section>

                    <Section title="5. Зберігання даних">
                        Ваші дані зберігаються на захищених серверах на території ЄС
                        відповідно до вимог GDPR. Ми зберігаємо дані акаунту протягом
                        усього часу його активності та 2 роки після видалення.
                    </Section>

                    <Section title="6. Ваші права">
                        Відповідно до GDPR та законодавства України ви маєте право:
                        отримати копію своїх даних; виправити неточні дані; видалити свій
                        акаунт і пов'язані дані; відкликати згоду на обробку даних.
                        Для реалізації цих прав зверніться до{' '}
                        <a href="mailto:elearn@gmail.com" style={s.a}>elearn@gmail.com</a>.
                    </Section>

                    <Section title="7. Безпека">
                        Ми застосовуємо галузеві стандарти безпеки: шифрування HTTPS,
                        хешування паролів (bcrypt), захист від CSRF та обмеження частоти
                        запитів. Попри це, жодна система не є абсолютно захищеною — у разі
                        підозри на компрометацію акаунту негайно зв'яжіться з нами.
                    </Section>

                    <Section title="8. Зміни до цієї Політики">
                        Ми можемо оновлювати цю Політику. Про суттєві зміни ви отримаєте
                        сповіщення на email. Актуальна версія завжди доступна на цій
                        сторінці.
                    </Section>

                    <Section title="9. Контакти">
                        З питань конфіденційності звертайтесь:{' '}
                        <a href="mailto:elearn@gmail.com" style={s.a}>elearn@gmail.com</a>
                    </Section>

                </div>

                <div style={s.footer}>
                    <Link to="/terms" style={s.footerLink}>Умови користування →</Link>
                </div>
            </div>
        </div>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div style={{ marginBottom: 32 }}>
            <h2 style={ss.h2}>{title}</h2>
            <p style={ss.p}>{children}</p>
        </div>
    );
}

const ss: Record<string, React.CSSProperties> = {
    h2: { fontSize: '1rem', fontWeight: 600, color: 'var(--text)', marginBottom: 10, letterSpacing: '-0.01em' },
    p:  { fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.8 },
};

const s: Record<string, React.CSSProperties> = {
    page:  { minHeight: '100vh', background: 'var(--bg)', paddingBottom: 80 },
    inner: { maxWidth: 720, margin: '0 auto' },

    breadcrumb: { fontSize: '0.8rem', color: 'var(--text-tertiary)', marginBottom: 32 },
    breadLink:  { color: 'var(--text-tertiary)', textDecoration: 'none' },

    h1:      { fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.04em', color: 'var(--text)', marginBottom: 8 },
    updated: { fontSize: '0.8rem', color: 'var(--text-tertiary)', marginBottom: 48 },

    body: {},

    a: { color: 'var(--text)', textDecoration: 'underline', textUnderlineOffset: 3 },

    footer:     { borderTop: '1px solid var(--border)', paddingTop: 24, marginTop: 16 },
    footerLink: { fontSize: '0.875rem', color: 'var(--text-secondary)', textDecoration: 'none' },
};