import React from 'react';
import { Link } from 'react-router-dom';

export function TermsPage() {
    return (
        <div style={s.page}>
            <div style={s.inner}>
                <p style={s.breadcrumb}>
                    <Link to="/courses" style={s.breadLink}>Головна</Link>
                    {' / '}Умови використання
                </p>

                <h1 style={s.h1}>Terms &amp; Conditions</h1>
                <p style={s.updated}>Остання редакція: 1 січня 2025 р.</p>

                <div style={s.body}>

                    <Section title="1. Загальні положення">
                        Використовуючи платформу ELearn, ви погоджуєтесь з цими Умовами
                        використання. Якщо ви не погоджуєтесь із будь-яким з пунктів — будь
                        ласка, припиніть користування платформою.
                    </Section>

                    <Section title="2. Реєстрація та акаунт">
                        Для доступу до більшості функцій платформи потрібна реєстрація.
                        Ви зобов'язані надати достовірну інформацію та зберігати
                        конфіденційність своїх облікових даних. Ви несете відповідальність
                        за всі дії, що здійснюються під вашим акаунтом.
                    </Section>

                    <Section title="3. Умови придбання курсів">
                        Після оплати ви отримуєте персональний доступ до курсу. Матеріали
                        курсу захищені авторським правом і не можуть бути відтворені,
                        поширені або передані третім особам без письмового дозволу автора.
                    </Section>

                    <Section title="4. Повернення коштів">
                        Повернення коштів можливе протягом 14 днів з моменту придбання за
                        умови, що ви переглянули менше 30% матеріалів курсу. Запити на
                        повернення надсилайте на{' '}
                        <a href="mailto:support@elearn.ua" style={s.a}>support@elearn.ua</a>.
                    </Section>

                    <Section title="5. Поведінка користувача">
                        Забороняється: публікувати образливий, незаконний або спам-контент;
                        намагатися отримати несанкціонований доступ до систем платформи;
                        використовувати платформу для комерційного розповсюдження матеріалів
                        без дозволу.
                    </Section>

                    <Section title="6. Інтелектуальна власність">
                        Весь контент платформи (тексти, відео, логотипи, дизайн) є
                        власністю ELearn або відповідних авторів і захищений законодавством
                        про авторське право.
                    </Section>

                    <Section title="7. Обмеження відповідальності">
                        Платформа надається «як є». ELearn не несе відповідальності за
                        будь-які прямі чи непрямі збитки, що виникли внаслідок використання
                        або неможливості використання платформи.
                    </Section>

                    <Section title="8. Зміни умов">
                        Ми залишаємо за собою право змінювати ці Умови. Про суттєві зміни
                        ми повідомлятимемо через електронну пошту або сповіщення в акаунті.
                        Продовження використання платформи після змін означає прийняття
                        нових умов.
                    </Section>

                    <Section title="9. Контакти">
                        З питань щодо цих Умов звертайтесь:{' '}
                        <a href="mailto:legal@elearn.ua" style={s.a}>legal@elearn.ua</a>
                    </Section>

                </div>

                <div style={s.footer}>
                    <Link to="/privacy" style={s.footerLink}>Privacy Policy →</Link>
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
    h2: { fontSize: '1rem', fontWeight: 600, color: '#0a0a0a', marginBottom: 10, letterSpacing: '-0.01em' },
    p:  { fontSize: '0.9rem', color: '#3a3a3a', lineHeight: 1.8 },
};

const s: Record<string, React.CSSProperties> = {
    page:  { minHeight: '100vh', background: '#fafafa', paddingBottom: 80 },
    inner: { maxWidth: 720, margin: '0 auto', padding: '48px 32px 0' },

    breadcrumb: { fontSize: '0.8rem', color: '#9a9a9a', marginBottom: 32 },
    breadLink:  { color: '#9a9a9a', textDecoration: 'none' },

    h1:      { fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.04em', color: '#0a0a0a', marginBottom: 8 },
    updated: { fontSize: '0.8rem', color: '#b0b0b0', marginBottom: 48 },

    body: {},

    a: { color: '#0a0a0a', textDecoration: 'underline', textUnderlineOffset: 3 },

    footer:     { borderTop: '1px solid #ebebeb', paddingTop: 24, marginTop: 16 },
    footerLink: { fontSize: '0.875rem', color: '#5a5a5a', textDecoration: 'none' },
};