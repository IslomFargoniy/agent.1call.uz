import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/language-switcher';
import { ThemeSwitcher } from '@/components/theme-switcher';
import React, { useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    PhoneCall,
    Smartphone,
    ShieldCheck,
    Zap,
    Radio,
    HardDrive,
    Lock,
    CheckCircle2,
    ChevronDown,
    ArrowRight,
    Headphones,
    Flame,
    Building,
    Calendar,
    Layers,
    Sparkles,
} from 'lucide-react';
import {
    AmoCrmLogo,
    MoySkladLogo,
    AmoCrmIcon,
    MoySkladIcon,
    ClickLogo,
    PaymeLogo,
    LemonSqueezyLogo,
    UzcardLogo,
    HumoLogo,
    GoogleGLogo,
} from '@/components/brand-logos';
import { Button } from '@/components/ui/button';

export default function Welcome() {
    const { t } = useTranslation();
    const { auth } = usePage<{
        auth: { user: { name: string; role: string } | null };
    }>().props;

    const [currency, setCurrency] = useState<'UZS' | 'USD'>('UZS');
    const [openFaq, setOpenFaq] = useState<number | null>(0);

    const toggleFaq = (idx: number) => {
        setOpenFaq(openFaq === idx ? null : idx);
    };

    const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'Agent1Call',
        operatingSystem: 'Android, Web',
        applicationCategory: 'BusinessApplication, Telephony',
        offers: {
            '@type': 'Offer',
            price: '39000',
            priceCurrency: 'UZS',
        },
        description:
            'Smart korporativ telefoniya va qo‘ng‘iroqlarni monitoring qilish tizimi. amoCRM va MoySklad integratsiyalari, Android native agent va yuqori sifatli audio yozish.',
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-600 selection:text-white dark:bg-slate-950 dark:text-slate-50">
            <Head>
                <title>
                    Agent1Call — Smart Korporativ Telefoniya va CRM
                    Integratsiyasi
                </title>
                <meta
                    name="description"
                    content="Korporativ qo‘ng‘iroqlarni real-vaqtda boshqarish, AAC formatda ovoz yozish, amoCRM va MoySklad integratsiyalari hamda 14 kunlik bepul sinov davri."
                />
                <meta
                    name="keywords"
                    content="telefoniya, amocrm integratsiya, moysklad telefoniya, qo'ng'iroqlarni yozib olish, call tracking o'zbekiston, korporativ telefon, 1call"
                />
                <meta
                    property="og:title"
                    content="Agent1Call — Smart Korporativ Telefoniya Platformasi"
                />
                <meta
                    property="og:description"
                    content="Android telefonlaridagi korporativ qo‘ng‘iroqlarni markaziy boshqaring. amoCRM, MoySklad va qulay to‘lovlar."
                />
                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://agent.1call.uz" />
                <script type="application/ld+json">
                    {JSON.stringify(structuredData)}
                </script>
            </Head>

            {/* Navigation Header */}
            <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md transition-colors dark:border-slate-800 dark:bg-slate-950/80">
                <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    <Link href="/" className="group flex items-center gap-3">
                        <img
                            src="/images/1call_logo.png"
                            alt="Agent1Call Logo"
                            className="h-11 w-11 rounded-xl object-contain shadow-md shadow-blue-500/20 transition-transform group-hover:scale-105"
                        />
                        <div className="flex flex-col">
                            <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                                Agent
                                <span className="text-blue-600">1Call</span>
                            </span>
                            <span className="text-[10px] font-semibold tracking-widest text-slate-500 uppercase dark:text-slate-400">
                                Corporate Telephony
                            </span>
                        </div>
                    </Link>

                    <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex dark:text-slate-300">
                        <a
                            href="#features"
                            className="transition-colors hover:text-blue-600 dark:hover:text-blue-400"
                        >
                            {t('welcome.features', 'Imkoniyatlar')}
                        </a>
                        <a
                            href="#integrations"
                            className="transition-colors hover:text-blue-600 dark:hover:text-blue-400"
                        >
                            {t('welcome.integrations', 'Integratsiyalar')}
                        </a>
                        <a
                            href="#pricing"
                            className="transition-colors hover:text-blue-600 dark:hover:text-blue-400"
                        >
                            {t('welcome.pricing', 'Tariflar')}
                        </a>
                        <a
                            href="#how-it-works"
                            className="transition-colors hover:text-blue-600 dark:hover:text-blue-400"
                        >
                            {t('welcome.howItWorks', 'Qanday ishlaydi?')}
                        </a>
                        <a
                            href="#faq"
                            className="transition-colors hover:text-blue-600 dark:hover:text-blue-400"
                        >
                            {t('welcome.faq', 'FAQ')}
                        </a>
                    </nav>

                    <div className="flex items-center gap-3">
                        <LanguageSwitcher />
                        <ThemeSwitcher />
                        {auth.user ? (
                            <Link href="/dashboard">
                                <Button className="rounded-xl bg-blue-600 font-semibold text-white shadow-xs hover:bg-blue-700">
                                    {t('welcome.dashboard', 'Boshqaruv Paneli')}
                                </Button>
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href="/login"
                                    className="hidden px-3 py-2 text-sm font-semibold text-slate-700 hover:text-blue-600 sm:inline-block dark:text-slate-200 dark:hover:text-blue-400"
                                >
                                    {t('welcome.login', 'Kirish')}
                                </Link>
                                <Link href="/register">
                                    <Button className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700">
                                        <span>
                                            {t(
                                                'welcome.register',
                                                '14 kun bepul',
                                            )}
                                        </span>
                                        <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-32">
                <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                    <div className="absolute top-1/4 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/10 blur-3xl dark:bg-blue-500/15" />
                    <div className="absolute top-1/3 right-10 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl dark:bg-emerald-500/15" />
                </div>

                <div className="mx-auto max-w-7xl space-y-8 px-4 text-center sm:px-6 lg:px-8">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/60 px-4 py-2 text-xs font-semibold text-blue-700 shadow-xs sm:text-sm dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300">
                        <Sparkles className="h-4 w-4 text-blue-600" />
                        <span>
                            O‘zbekistonda 1-raqamli Smart Korporativ Telefoniya
                            Platformasi
                        </span>
                    </div>

                    {/* Main H1 */}
                    <h1 className="mx-auto max-w-5xl text-4xl leading-[1.15] font-extrabold tracking-tight text-slate-900 sm:text-6xl lg:text-7xl dark:text-white">
                        Kompaniyangiz savdo va xizmat sifatini{' '}
                        <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 bg-clip-text text-transparent">
                            Agent1Call
                        </span>{' '}
                        bilan yangi bosqichga olib chiqing
                    </h1>

                    {/* Description */}
                    <p className="mx-auto max-w-3xl text-lg leading-relaxed font-normal text-slate-600 sm:text-xl dark:text-slate-300">
                        Barcha xodimlar telefonlarini markaziy boshqaring.
                        Qo‘ng‘iroqlarni yuqori sifatli va yengil{' '}
                        <strong>AAC</strong> formatda avtomatik yozib olish,
                        real-vaqtda popup bildirishnomalar,{' '}
                        <strong>amoCRM</strong> va <strong>MoySklad</strong>{' '}
                        integratsiyalari hamda qulay to‘lov tizimlari.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col items-center justify-center gap-4 pt-4 sm:flex-row">
                        <Link href="/register" className="w-full sm:w-auto">
                            <Button
                                size="lg"
                                className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-blue-600 px-8 text-base font-bold text-white shadow-lg shadow-blue-500/25 hover:bg-blue-700 sm:w-auto"
                            >
                                <span>14 kunlik bepul sinovni boshlash</span>
                                <ArrowRight className="h-5 w-5" />
                            </Button>
                        </Link>

                        <a href="/auth/google" className="w-full sm:w-auto">
                            <Button
                                size="lg"
                                variant="outline"
                                className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl border-slate-300 bg-white px-7 text-base font-semibold shadow-xs hover:bg-slate-100 sm:w-auto dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
                            >
                                <GoogleGLogo className="h-5 w-5" />
                                <span>Google orqali kirish</span>
                            </Button>
                        </a>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Karta talab qilinmaydi • 3 ta telefongacha bepul • 5
                        daqiqada ishga tushadi
                    </p>

                    {/* Interactive Live Simulation Card */}
                    <div className="mx-auto max-w-5xl pt-8">
                        <div className="space-y-6 rounded-3xl border border-slate-200/80 bg-white/80 p-6 text-left shadow-2xl backdrop-blur-xl sm:p-8 dark:border-slate-800/80 dark:bg-slate-900/80">
                            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800">
                                <div className="flex items-center gap-3">
                                    <span className="relative flex h-3.5 w-3.5">
                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-emerald-500"></span>
                                    </span>
                                    <span className="text-sm font-bold tracking-wide text-slate-800 uppercase dark:text-slate-200">
                                        Jonli Monitoring • Jonli Qo‘ng‘iroqlar
                                        Doskasi
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
                                    <span className="rounded-md border border-blue-200/60 bg-blue-50 px-2.5 py-1 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300">
                                        Laravel Reverb WebSockets
                                    </span>
                                    <span className="rounded-md border border-emerald-200/60 bg-emerald-50 px-2.5 py-1 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
                                        AAC 16kHz • 24kbps
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                <div className="flex items-center gap-4 rounded-2xl border border-blue-200/60 bg-blue-50/50 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
                                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-blue-600 font-bold text-white shadow-xs">
                                        <Radio className="h-6 w-6 animate-pulse" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="text-xs font-semibold tracking-wider text-blue-700 uppercase dark:text-blue-400">
                                            Kiruvchi Qo‘ng‘iroq
                                        </div>
                                        <div className="truncate text-base font-bold text-slate-900 dark:text-white">
                                            +998 90 123 45 67
                                        </div>
                                        <div className="truncate text-xs text-slate-500">
                                            SIM 1 (Korporativ) • 00:42
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 rounded-2xl border border-sky-200/60 bg-sky-50/50 p-4 dark:border-sky-900/40 dark:bg-sky-950/20">
                                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[#167FFB]/15 shadow-xs">
                                        <AmoCrmIcon className="h-7 w-7" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="text-xs font-semibold tracking-wider text-[#167FFB] uppercase">
                                            amoCRM Sinxron
                                        </div>
                                        <div className="truncate text-base font-bold text-slate-900 dark:text-white">
                                            Jasur Aliyev (Lead)
                                        </div>
                                        <div className="truncate text-xs text-slate-500">
                                            Mijoz kartasi ochildi
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 rounded-2xl border border-orange-200/60 bg-orange-50/50 p-4 dark:border-orange-900/40 dark:bg-orange-950/20">
                                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[#F46738]/15 shadow-xs">
                                        <MoySkladIcon className="h-7 w-7" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="text-xs font-semibold tracking-wider text-[#F46738] uppercase">
                                            MoySklad Remap
                                        </div>
                                        <div className="truncate text-base font-bold text-slate-900 dark:text-white">
                                            Kontragent Topildi
                                        </div>
                                        <div className="truncate text-xs text-slate-500">
                                            Vaqt korreksiyasi: UTC+5
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Integrations & Payment Brands Showcase */}
            <section
                id="integrations"
                className="border-y border-slate-200 bg-white py-16 dark:border-slate-800 dark:bg-slate-900"
            >
                <div className="mx-auto max-w-7xl space-y-10 px-4 text-center sm:px-6 lg:px-8">
                    <div>
                        <h2 className="text-sm font-bold tracking-widest text-blue-600 uppercase dark:text-blue-400">
                            Ishonchli CRM va To‘lov Tizimlari
                        </h2>
                        <p className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl dark:text-white">
                            Biznesingiz har kuni foydalanadigan tizimlar bilan
                            uzviy integratsiya
                        </p>
                    </div>

                    <div className="grid grid-cols-2 items-center justify-center gap-4 sm:gap-6 md:grid-cols-5">
                        <div className="flex h-20 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50/70 px-4 shadow-xs transition-all hover:scale-105 hover:border-blue-500/50 dark:border-slate-800 dark:bg-slate-950/60">
                            <AmoCrmLogo className="h-8" />
                        </div>
                        <div className="flex h-20 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50/70 px-4 shadow-xs transition-all hover:scale-105 hover:border-orange-500/50 dark:border-slate-800 dark:bg-slate-950/60">
                            <MoySkladLogo className="h-8" />
                        </div>
                        <div className="flex h-20 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50/70 px-4 shadow-xs transition-all hover:scale-105 hover:border-blue-400/50 dark:border-slate-800 dark:bg-slate-950/60">
                            <ClickLogo className="h-8" />
                        </div>
                        <div className="flex h-20 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50/70 px-4 shadow-xs transition-all hover:scale-105 hover:border-teal-400/50 dark:border-slate-800 dark:bg-slate-950/60">
                            <PaymeLogo className="h-8" />
                        </div>
                        <div className="col-span-2 flex h-20 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50/70 px-4 shadow-xs transition-all hover:scale-105 hover:border-yellow-400/50 md:col-span-1 dark:border-slate-800 dark:bg-slate-950/60">
                            <LemonSqueezyLogo className="h-8" />
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-4 pt-4 text-xs font-semibold text-slate-500">
                        <span className="mr-2">
                            O‘zbekiston va Xalqaro to‘lovlar:
                        </span>
                        <UzcardLogo />
                        <HumoLogo />
                        <span className="rounded-md bg-slate-100 px-3 py-1 font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            VISA
                        </span>
                        <span className="rounded-md bg-slate-100 px-3 py-1 font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            MASTERCARD
                        </span>
                        <span className="rounded-md bg-slate-100 px-3 py-1 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            P2P Bank Karta
                        </span>
                    </div>
                </div>
            </section>

            {/* Core Features Grid */}
            <section
                id="features"
                className="mx-auto max-w-7xl space-y-16 px-4 py-24 sm:px-6 lg:px-8"
            >
                <div className="mx-auto max-w-3xl space-y-4 text-center">
                    <h2 className="text-sm font-bold tracking-widest text-blue-600 uppercase dark:text-blue-400">
                        Mukammal Arxitektura
                    </h2>
                    <h3 className="text-3xl font-extrabold text-slate-900 sm:text-4xl dark:text-white">
                        Nima uchun eng yetakchi kompaniyalar Agent1Callni
                        tanlaydi?
                    </h3>
                    <p className="text-base text-slate-600 sm:text-lg dark:text-slate-300">
                        Oddiy qo‘ng‘iroq yozuvchi ilovalardan farqli ravishda,
                        Agent1Call — yaxlit korporativ ekotizimdir.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {/* Feature 1 */}
                    <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:border-blue-500/30 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600/10 font-bold text-blue-600">
                            <Smartphone className="h-6 w-6" />
                        </div>
                        <h4 className="text-xl font-bold text-slate-900 dark:text-white">
                            Android 10 - 15 Native Agent
                        </h4>
                        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                            Google AccessibilityService texnologiyasi orqali eng
                            yangi Android versiyalarida ham qo‘ng‘iroqlarni
                            barqaror yozib oladi.{' '}
                            <code>BootCompletedReceiver</code> telefon o‘chib
                            yonganda ham avtomatik davom ettiradi.
                        </p>
                    </div>

                    {/* Feature 2 */}
                    <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:border-emerald-500/30 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600/10 font-bold text-emerald-600">
                            <Zap className="h-6 w-6" />
                        </div>
                        <h4 className="text-xl font-bold text-slate-900 dark:text-white">
                            Yengil Audio (AAC / Opus .m4a)
                        </h4>
                        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                            16 kHz mono siqish orqali 1 daqiqalik suhbat atigi
                            ~180-200 KB hajm egallaydi. Xotira va mobil internet
                            tejaladi, audio fayllar soniyalar ichida serverga
                            yuklanadi.
                        </p>
                    </div>

                    {/* Feature 3 */}
                    <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:border-purple-500/30 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-600/10 font-bold text-purple-600">
                            <ShieldCheck className="h-6 w-6" />
                        </div>
                        <h4 className="text-xl font-bold text-slate-900 dark:text-white">
                            Dual-SIM & Shaxsiy Maxfiylik
                        </h4>
                        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                            Operator sozlamalardan faqat korporativ SIM kartani
                            tanlaydi. Shaxsiy SIM qo‘ng‘iroqlari, ish vaqtidan
                            tashqari suhbatlar hamda qora ro‘yxatdagi raqamlar
                            aslo yozilmaydi.
                        </p>
                    </div>

                    {/* Feature 4 */}
                    <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:border-blue-500/30 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600/10 font-bold text-indigo-600">
                            <Radio className="h-6 w-6" />
                        </div>
                        <h4 className="text-xl font-bold text-slate-900 dark:text-white">
                            Real-Vaqtda WebSockets (Reverb)
                        </h4>
                        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                            Telefon jiringlagan zahoti brauzeringizda mijoz
                            kartasi qalqib chiqadi. Suhbat tugaganda esa audio
                            darhol jurnallarda paydo bo‘ladi. Sahifani
                            yangilashga hojat yo‘q.
                        </p>
                    </div>

                    {/* Feature 5 */}
                    <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:border-amber-500/30 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-600/10 font-bold text-amber-600">
                            <Layers className="h-6 w-6" />
                        </div>
                        <h4 className="text-xl font-bold text-slate-900 dark:text-white">
                            amoCRM & MoySklad Integratsiyasi
                        </h4>
                        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                            O‘zbekiston raqamlarini 5 xil formatda izlash,
                            avtomatik yangi lead/kontakt ochish, javobsiz
                            qo‘ng‘iroqlarda avto-vazifa (Task) yaratish va HMAC
                            SHA-256 xavfsiz audio pleyer.
                        </p>
                    </div>

                    {/* Feature 6 */}
                    <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:border-red-500/30 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-600/10 font-bold text-red-600">
                            <Lock className="h-6 w-6" />
                        </div>
                        <h4 className="text-xl font-bold text-slate-900 dark:text-white">
                            PostgreSQL 16 RLS & Partitsiya
                        </h4>
                        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                            Baza darajasidagi Row-Level Security har bir
                            kompaniya ma’lumotlarini to‘liq himoyalaydi. Oylik
                            diapazonli partitsiya esa millionlab qo‘ng‘iroqlarda
                            ham lahzali tezlikni beradi.
                        </p>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section
                id="how-it-works"
                className="border-y border-slate-200 bg-slate-100/70 py-20 dark:border-slate-800 dark:bg-slate-900/60"
            >
                <div className="mx-auto max-w-7xl space-y-16 px-4 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl space-y-4 text-center">
                        <h2 className="text-sm font-bold tracking-widest text-blue-600 uppercase dark:text-blue-400">
                            Oson va Tezkor
                        </h2>
                        <h3 className="text-3xl font-extrabold text-slate-900 sm:text-4xl dark:text-white">
                            3 ta oddiy qadamda ishga tushiring
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                        <div className="relative space-y-4 rounded-3xl border border-slate-200 bg-white p-8 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                            <span className="text-5xl font-black text-blue-600/20">
                                01
                            </span>
                            <h4 className="text-xl font-bold">
                                Ro‘yxatdan o‘ting
                            </h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Agent1Call saytida Google yoki email orqali
                                hisob yarating. Sizga darhol 14 kunlik bepul
                                sinov davri faollashadi.
                            </p>
                        </div>

                        <div className="relative space-y-4 rounded-3xl border border-slate-200 bg-white p-8 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                            <span className="text-5xl font-black text-blue-600/20">
                                02
                            </span>
                            <h4 className="text-xl font-bold">
                                Ilovani o‘rnating
                            </h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Operatoringiz telefoniga Agent1Call ilovasini
                                yuklang va QR-kodni skanerlab 5 soniyada tizimga
                                ulang.
                            </p>
                        </div>

                        <div className="relative space-y-4 rounded-3xl border border-slate-200 bg-white p-8 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                            <span className="text-5xl font-black text-blue-600/20">
                                03
                            </span>
                            <h4 className="text-xl font-bold">
                                Nazoratni boshlang
                            </h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Kompyuter ekranida barcha kiruvchi va chiquvchi
                                qo‘ng‘iroqlarni real-vaqtda kuzatib, audiolarni
                                tinglang.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section
                id="pricing"
                className="mx-auto max-w-7xl space-y-16 px-4 py-24 sm:px-6 lg:px-8"
            >
                <div className="mx-auto max-w-3xl space-y-4 text-center">
                    <h2 className="text-sm font-bold tracking-widest text-blue-600 uppercase dark:text-blue-400">
                        Shaffof Narxlar
                    </h2>
                    <h3 className="text-3xl font-extrabold text-slate-900 sm:text-4xl dark:text-white">
                        Har bir biznes uchun moslashuvchan tariflar
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300">
                        Har bir ulangan telefon uchun to‘lov. Yashirin
                        to‘lovlarsiz, 14 kun bepul sinov.
                    </p>

                    {/* Currency Toggle */}
                    <div className="inline-flex items-center rounded-2xl border border-slate-300 bg-slate-200/80 p-1.5 dark:border-slate-700 dark:bg-slate-800">
                        <button
                            onClick={() => setCurrency('UZS')}
                            className={`rounded-xl px-5 py-2 text-xs font-bold transition-all sm:text-sm ${
                                currency === 'UZS'
                                    ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-900'
                                    : 'text-slate-600 dark:text-slate-400'
                            }`}
                        >
                            UZS (So‘m)
                        </button>
                        <button
                            onClick={() => setCurrency('USD')}
                            className={`rounded-xl px-5 py-2 text-xs font-bold transition-all sm:text-sm ${
                                currency === 'USD'
                                    ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-900'
                                    : 'text-slate-600 dark:text-slate-400'
                            }`}
                        >
                            USD ($)
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-3">
                    {/* Plan 1: Start */}
                    <div className="flex flex-col justify-between space-y-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition-colors hover:border-slate-400 dark:border-slate-800 dark:bg-slate-900">
                        <div className="space-y-4">
                            <h4 className="text-2xl font-bold">Start</h4>
                            <p className="text-xs text-slate-500">
                                Kichik savdo va xizmat guruhlari uchun (1-3
                                telefon)
                            </p>
                            <div className="pt-2">
                                <span className="text-4xl font-black">
                                    {currency === 'UZS'
                                        ? '49,000 so‘m'
                                        : '$4.00'}
                                </span>
                                <span className="text-xs font-medium text-slate-500">
                                    {' '}
                                    / telefon / oy
                                </span>
                            </div>
                            <ul className="space-y-3 border-t border-slate-100 pt-4 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300">
                                <li className="flex items-center gap-2.5">
                                    <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-500" />{' '}
                                    1 dan 3 tagacha telefon
                                </li>
                                <li className="flex items-center gap-2.5">
                                    <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-500" />{' '}
                                    30 kun bepul audio saqlash
                                </li>
                                <li className="flex items-center gap-2.5">
                                    <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-500" />{' '}
                                    amoCRM & MoySklad
                                </li>
                                <li className="flex items-center gap-2.5">
                                    <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-500" />{' '}
                                    Real-time WebSockets
                                </li>
                            </ul>
                        </div>
                        <Link href="/register" className="w-full">
                            <Button
                                variant="outline"
                                className="h-12 w-full rounded-xl font-bold"
                            >
                                Boshlash
                            </Button>
                        </Link>
                    </div>

                    {/* Plan 2: Pro (Popular) */}
                    <div className="relative flex flex-col justify-between space-y-8 rounded-3xl border-2 border-blue-600 bg-white p-8 shadow-xl dark:bg-slate-900">
                        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-4 py-1 text-xs font-bold tracking-wider text-white uppercase shadow-md">
                            Eng Ommabop
                        </div>
                        <div className="space-y-4">
                            <h4 className="text-2xl font-bold">Pro</h4>
                            <p className="text-xs text-slate-500">
                                O‘rta biznes va professional sotuv bo‘limlari
                                uchun (4-10 telefon)
                            </p>
                            <div className="pt-2">
                                <span className="text-4xl font-black text-blue-600">
                                    {currency === 'UZS'
                                        ? '39,000 so‘m'
                                        : '$3.20'}
                                </span>
                                <span className="text-xs font-medium text-slate-500">
                                    {' '}
                                    / telefon / oy
                                </span>
                            </div>
                            <ul className="space-y-3 border-t border-slate-100 pt-4 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300">
                                <li className="flex items-center gap-2.5">
                                    <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-blue-600" />{' '}
                                    4 dan 10 tagacha telefon
                                </li>
                                <li className="flex items-center gap-2.5">
                                    <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-blue-600" />{' '}
                                    30 kun bepul audio saqlash
                                </li>
                                <li className="flex items-center gap-2.5">
                                    <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-blue-600" />{' '}
                                    Pro-rata (co-terming) hisob-kitob
                                </li>
                                <li className="flex items-center gap-2.5">
                                    <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-blue-600" />{' '}
                                    amoCRM & MoySklad to‘liq integratsiya
                                </li>
                                <li className="flex items-center gap-2.5">
                                    <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-blue-600" />{' '}
                                    Telegram bildirishnomalar
                                </li>
                            </ul>
                        </div>
                        <Link href="/register" className="w-full">
                            <Button className="h-12 w-full rounded-xl bg-blue-600 font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700">
                                Sinovni boshlash (14 kun)
                            </Button>
                        </Link>
                    </div>

                    {/* Plan 3: Enterprise */}
                    <div className="flex flex-col justify-between space-y-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition-colors hover:border-slate-400 dark:border-slate-800 dark:bg-slate-900">
                        <div className="space-y-4">
                            <h4 className="text-2xl font-bold">Enterprise</h4>
                            <p className="text-xs text-slate-500">
                                Katta aloqa markazlari va korporatsiyalar uchun
                                (11+ telefon)
                            </p>
                            <div className="pt-2">
                                <span className="text-4xl font-black">
                                    {currency === 'UZS'
                                        ? '29,000 so‘m'
                                        : '$2.50'}
                                </span>
                                <span className="text-xs font-medium text-slate-500">
                                    {' '}
                                    / telefon / oy
                                </span>
                            </div>
                            <ul className="space-y-3 border-t border-slate-100 pt-4 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300">
                                <li className="flex items-center gap-2.5">
                                    <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-500" />{' '}
                                    11 va undan ortiq telefonlar
                                </li>
                                <li className="flex items-center gap-2.5">
                                    <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-500" />{' '}
                                    12 oyga 20% gacha hajm chegirmasi
                                </li>
                                <li className="flex items-center gap-2.5">
                                    <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-500" />{' '}
                                    365 kungacha arxiv uzaytirish
                                </li>
                                <li className="flex items-center gap-2.5">
                                    <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-500" />{' '}
                                    Shaxsiy menejer va SLA qo‘llab-quvvatlash
                                </li>
                            </ul>
                        </div>
                        <Link href="/register" className="w-full">
                            <Button
                                variant="outline"
                                className="h-12 w-full rounded-xl font-bold"
                            >
                                Boshlash
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="mx-auto max-w-3xl space-y-2 rounded-2xl border border-blue-200 bg-blue-50 p-6 text-center dark:border-blue-900 dark:bg-blue-950/40">
                    <h5 className="font-bold text-blue-900 dark:text-blue-200">
                        Katta muddatli chegirmalar:
                    </h5>
                    <p className="text-xs text-blue-700 sm:text-sm dark:text-blue-300">
                        3 oylik to‘lovda — <strong>5%</strong>, 6 oylik to‘lovda
                        — <strong>10%</strong>, 12 oylik to‘lovda —{' '}
                        <strong>20% chegirma</strong> taqdim etiladi.
                    </p>
                </div>
            </section>

            {/* FAQ Section */}
            <section
                id="faq"
                className="border-t border-slate-200 bg-white py-20 dark:border-slate-800 dark:bg-slate-900"
            >
                <div className="mx-auto max-w-4xl space-y-12 px-4 sm:px-6 lg:px-8">
                    <div className="space-y-3 text-center">
                        <h2 className="text-sm font-bold tracking-widest text-blue-600 uppercase dark:text-blue-400">
                            Savollarga Javoblar
                        </h2>
                        <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white">
                            Ko‘p beriladigan savollar
                        </h3>
                    </div>

                    <div className="space-y-4">
                        {[
                            {
                                q: 'Android 14 va 15 versiyalarida qo‘ng‘iroqlar ovozi yoziladimi?',
                                a: 'Ha, albatta. Agent1Call Android tizimidagi eng zamonaviy AccessibilityService API dan foydalanadi. Bu Android 10 dan to eng so‘nggi Android 15 gacha bo‘lgan barcha smartfonlarda ikki tomonlama ovoz yozishni to‘liq ta’minlaydi.',
                            },
                            {
                                q: 'Agar internet o‘chib qolsa, audio yozuvlar yo‘qoladimi?',
                                a: 'Aslo yo‘q. Ilovada SQLite/Room bazasida oflayn navbat (Local Queue) mavjud. Internet uzilgan vaqtda barcha suhbatlar telefon xotirasida xavfsiz saqlanadi va aloqa paydo bo‘lishi bilan avtomatik serverga yuklanadi.',
                            },
                            {
                                q: 'Xodimning shaxsiy SIM-karta qo‘ng‘iroqlari ham yoziladimi?',
                                a: 'Yo‘q. Ilovada Dual-SIM filtrlash mexanizmi bor. Sozlamalardan faqat korporativ SIM slot tanlanadi. Shaxsiy SIM-kartadan qilingan barcha qo‘ng‘iroqlar avtomatik e’tiborsiz qoldiriladi va yozilmaydi.',
                            },
                            {
                                q: 'Qanday to‘lov usullari mavjud?',
                                a: 'Click, Payme, bank kartalari orqali to‘g‘ridan-to‘g‘ri P2P to‘lov hamda xalqaro Visa/Mastercard egalari uchun Lemon Squeezy orqali to‘lash imkoniyati mavjud.',
                            },
                            {
                                q: '14 kunlik bepul sinov davrida cheklov bormi?',
                                a: 'Sinov davrida tizimning barcha imkoniyatlari — real-time web-socketlar, amoCRM va MoySklad integratsiyalari to‘liq ochiq bo‘ladi. Siz 3 tagacha telefonni ulab sinab ko‘rishingiz mumkin.',
                            },
                        ].map((item, idx) => (
                            <div
                                key={idx}
                                className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950/40"
                            >
                                <button
                                    onClick={() => toggleFaq(idx)}
                                    className="flex w-full items-center justify-between gap-4 p-6 text-left text-base font-bold sm:text-lg"
                                >
                                    <span>{item.q}</span>
                                    <ChevronDown
                                        className={`h-5 w-5 text-slate-500 transition-transform ${openFaq === idx ? 'rotate-180 text-blue-600' : ''}`}
                                    />
                                </button>
                                {openFaq === idx && (
                                    <div className="border-t border-slate-200/50 px-6 pt-4 pb-6 text-sm leading-relaxed text-slate-600 dark:border-slate-800/50 dark:text-slate-300">
                                        {item.a}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Bottom CTA Banner */}
            <section className="bg-gradient-to-br from-blue-600 via-indigo-700 to-blue-800 py-20 text-center text-white">
                <div className="mx-auto max-w-4xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <h3 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
                        Qo‘ng‘iroqlaringizni bugunoq nazoratga oling
                    </h3>
                    <p className="mx-auto max-w-2xl text-lg text-blue-100">
                        14 kunlik bepul sinovni boshlang. Operatorlaringiz
                        suhbatini tinglang va savdo konversiyasini oshiring.
                    </p>
                    <div className="flex flex-col items-center justify-center gap-4 pt-4 sm:flex-row">
                        <Link href="/register">
                            <Button
                                size="lg"
                                className="h-14 rounded-2xl bg-white px-9 font-bold text-blue-700 shadow-xl hover:bg-slate-100"
                            >
                                Bepul Sinovni Boshlash
                            </Button>
                        </Link>
                        <a href="/auth/google">
                            <Button
                                size="lg"
                                variant="outline"
                                className="h-14 rounded-2xl border-white/40 bg-transparent px-8 font-bold text-white hover:bg-white/10"
                            >
                                Google bilan kirish
                            </Button>
                        </a>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-slate-800 bg-slate-900 py-12 text-sm text-slate-400">
                <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 sm:flex-row sm:px-6 lg:px-8">
                    <div className="flex items-center gap-3">
                        <img
                            src="/images/1call_logo.png"
                            alt="Agent1Call Logo"
                            className="h-8 w-8 rounded-lg object-contain"
                        />
                        <span className="text-base font-bold text-white">
                            Agent1Call
                        </span>
                        <span className="text-xs">
                            © {new Date().getFullYear()}{' '}
                            {t(
                                'welcome.copyright',
                                'Barcha huquqlar himoyalangan.',
                            )}
                        </span>
                    </div>

                    <div className="flex items-center gap-6 text-xs">
                        <a
                            href="https://t.me/onecall_support"
                            target="_blank"
                            rel="noreferrer"
                            className="transition-colors hover:text-white"
                        >
                            {t(
                                'welcome.telegramSupport',
                                "Telegram Qo'llab-quvvatlash",
                            )}
                        </a>
                        <Link
                            href="/login"
                            className="transition-colors hover:text-white"
                        >
                            Kirish
                        </Link>
                        <Link
                            href="/register"
                            className="transition-colors hover:text-white"
                        >
                            Ro‘yxatdan o‘tish
                        </Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
