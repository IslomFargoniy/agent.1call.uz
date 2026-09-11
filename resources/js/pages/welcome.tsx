import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/language-switcher';
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
    const { auth } = usePage<{ auth: { user: { name: string; role: string } | null } }>().props;

    const [currency, setCurrency] = useState<'UZS' | 'USD'>('UZS');
    const [openFaq, setOpenFaq] = useState<number | null>(0);

    const toggleFaq = (idx: number) => {
        setOpenFaq(openFaq === idx ? null : idx);
    };

    const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        'name': '1Call Agent',
        'operatingSystem': 'Android, Web',
        'applicationCategory': 'BusinessApplication, Telephony',
        'offers': {
            '@type': 'Offer',
            'price': '39000',
            'priceCurrency': 'UZS',
        },
        'description': 'Smart korporativ telefoniya va qo‘ng‘iroqlarni monitoring qilish tizimi. amoCRM va MoySklad integratsiyalari, Android native agent va yuqori sifatli audio yozish.',
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50 font-sans selection:bg-blue-600 selection:text-white">
            <Head>
                <title>1Call Agent — Smart Korporativ Telefoniya va CRM Integratsiyasi</title>
                <meta
                    name="description"
                    content="Korporativ qo‘ng‘iroqlarni real-vaqtda boshqarish, AAC formatda ovoz yozish, amoCRM va MoySklad integratsiyalari hamda 14 kunlik bepul sinov davri."
                />
                <meta name="keywords" content="telefoniya, amocrm integratsiya, moysklad telefoniya, qo'ng'iroqlarni yozib olish, call tracking o'zbekiston, korporativ telefon, 1call" />
                <meta property="og:title" content="1Call Agent — Smart Korporativ Telefoniya Platformasi" />
                <meta property="og:description" content="Android telefonlaridagi korporativ qo‘ng‘iroqlarni markaziy boshqaring. amoCRM, MoySklad va qulay to‘lovlar." />
                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://agent.1call.uz" />
                <script type="application/ld+json">
                    {JSON.stringify(structuredData)}
                </script>
            </Head>

            {/* Navigation Header */}
            <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/80 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 transition-colors">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3 group">
                        <img
                            src="/images/1call_logo.png"
                            alt="1Call Logo"
                            className="h-11 w-11 rounded-xl object-contain shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform"
                        />
                        <div className="flex flex-col">
                            <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white">
                                1Call <span className="text-blue-600">Agent</span>
                            </span>
                            <span className="text-[10px] font-semibold tracking-widest uppercase text-slate-500 dark:text-slate-400">
                                Corporate Telephony
                            </span>
                        </div>
                    </Link>

                    <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-300">
                        <a href="#features" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{t('welcome.features', 'Imkoniyatlar')}</a>
                        <a href="#integrations" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{t('welcome.integrations', 'Integratsiyalar')}</a>
                        <a href="#pricing" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{t('welcome.pricing', 'Tariflar')}</a>
                        <a href="#how-it-works" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{t('welcome.howItWorks', 'Qanday ishlaydi?')}</a>
                        <a href="#faq" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{t('welcome.faq', 'FAQ')}</a>
                    </nav>

                    <div className="flex items-center gap-3">
                        <LanguageSwitcher />
                        {auth.user ? (
                            <Link href="/dashboard">
                                <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-xs">
                                    {t('welcome.dashboard', 'Boshqaruv Paneli')}
                                </Button>
                            </Link>
                        ) : (
                            <>
                                <Link href="/login" className="hidden sm:inline-block text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2">
                                    {t('welcome.login', 'Kirish')}
                                </Link>
                                <Link href="/register">
                                    <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl px-5 shadow-md shadow-blue-500/20 flex items-center gap-2">
                                        <span>{t('welcome.register', '14 kun bepul')}</span>
                                        <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 overflow-hidden">
                <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 dark:bg-blue-500/15 rounded-full blur-3xl" />
                    <div className="absolute top-1/3 right-10 w-96 h-96 bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-3xl" />
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-blue-200 dark:border-blue-900/60 bg-blue-50/60 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs sm:text-sm font-semibold shadow-xs">
                        <Sparkles className="h-4 w-4 text-blue-600" />
                        <span>O‘zbekistonda 1-raqamli Smart Korporativ Telefoniya Platformasi</span>
                    </div>

                    {/* Main H1 */}
                    <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-5xl mx-auto leading-[1.15]">
                        Kompaniyangiz savdo va xizmat sifatini <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500">1Call Agent</span> bilan yangi bosqichga olib chiqing
                    </h1>

                    {/* Description */}
                    <p className="max-w-3xl mx-auto text-lg sm:text-xl text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                        Barcha xodimlar telefonlarini markaziy boshqaring. Qo‘ng‘iroqlarni yuqori sifatli va yengil <strong>AAC</strong> formatda avtomatik yozib olish, real-vaqtda popup bildirishnomalar, <strong>amoCRM</strong> va <strong>MoySklad</strong> integratsiyalari hamda qulay to‘lov tizimlari.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                        <Link href="/register" className="w-full sm:w-auto">
                            <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-base bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-3">
                                <span>14 kunlik bepul sinovni boshlash</span>
                                <ArrowRight className="h-5 w-5" />
                            </Button>
                        </Link>

                        <a href="/auth/google" className="w-full sm:w-auto">
                            <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-7 text-base rounded-2xl border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold shadow-xs flex items-center justify-center gap-3">
                                <GoogleGLogo className="h-5 w-5" />
                                <span>Google orqali kirish</span>
                            </Button>
                        </a>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Karta talab qilinmaydi • 3 ta telefongacha bepul • 5 daqiqada ishga tushadi
                    </p>

                    {/* Interactive Live Simulation Card */}
                    <div className="pt-8 max-w-5xl mx-auto">
                        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-2xl p-6 sm:p-8 text-left space-y-6">
                            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
                                <div className="flex items-center gap-3">
                                    <span className="flex h-3.5 w-3.5 relative">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
                                    </span>
                                    <span className="font-bold text-sm tracking-wide uppercase text-slate-800 dark:text-slate-200">
                                        Jonli Monitoring • Jonli Qo‘ng‘iroqlar Doskasi
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
                                    <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900">
                                        Laravel Reverb WebSockets
                                    </span>
                                    <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900">
                                        AAC 16kHz • 24kbps
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0 shadow-xs">
                                        <Radio className="h-6 w-6 animate-pulse" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wider">Kiruvchi Qo‘ng‘iroq</div>
                                        <div className="text-base font-bold text-slate-900 dark:text-white truncate">+998 90 123 45 67</div>
                                        <div className="text-xs text-slate-500 truncate">SIM 1 (Korporativ) • 00:42</div>
                                    </div>
                                </div>

                                <div className="p-4 rounded-2xl bg-sky-50/50 dark:bg-sky-950/20 border border-sky-200/60 dark:border-sky-900/40 flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-xl bg-[#167FFB]/15 flex items-center justify-center flex-shrink-0 shadow-xs">
                                        <AmoCrmIcon className="h-7 w-7" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="text-xs font-semibold text-[#167FFB] uppercase tracking-wider">amoCRM Sinxron</div>
                                        <div className="text-base font-bold text-slate-900 dark:text-white truncate">Jasur Aliyev (Lead)</div>
                                        <div className="text-xs text-slate-500 truncate">Mijoz kartasi ochildi</div>
                                    </div>
                                </div>

                                <div className="p-4 rounded-2xl bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200/60 dark:border-orange-900/40 flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-xl bg-[#F46738]/15 flex items-center justify-center flex-shrink-0 shadow-xs">
                                        <MoySkladIcon className="h-7 w-7" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="text-xs font-semibold text-[#F46738] uppercase tracking-wider">MoySklad Remap</div>
                                        <div className="text-base font-bold text-slate-900 dark:text-white truncate">Kontragent Topildi</div>
                                        <div className="text-xs text-slate-500 truncate">Vaqt korreksiyasi: UTC+5</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Integrations & Payment Brands Showcase */}
            <section id="integrations" className="py-16 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-10">
                    <div>
                        <h2 className="text-sm font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
                            Ishonchli CRM va To‘lov Tizimlari
                        </h2>
                        <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                            Biznesingiz har kuni foydalanadigan tizimlar bilan uzviy integratsiya
                        </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 sm:gap-6 items-center justify-center">
                        <div className="h-20 px-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 flex items-center justify-center shadow-xs hover:border-blue-500/50 hover:scale-105 transition-all">
                            <AmoCrmLogo className="h-8" />
                        </div>
                        <div className="h-20 px-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 flex items-center justify-center shadow-xs hover:border-orange-500/50 hover:scale-105 transition-all">
                            <MoySkladLogo className="h-8" />
                        </div>
                        <div className="h-20 px-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 flex items-center justify-center shadow-xs hover:border-blue-400/50 hover:scale-105 transition-all">
                            <ClickLogo className="h-8" />
                        </div>
                        <div className="h-20 px-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 flex items-center justify-center shadow-xs hover:border-teal-400/50 hover:scale-105 transition-all">
                            <PaymeLogo className="h-8" />
                        </div>
                        <div className="h-20 px-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 flex items-center justify-center shadow-xs hover:border-yellow-400/50 hover:scale-105 transition-all col-span-2 md:col-span-1">
                            <LemonSqueezyLogo className="h-8" />
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-4 pt-4 text-xs font-semibold text-slate-500">
                        <span className="mr-2">O‘zbekiston va Xalqaro to‘lovlar:</span>
                        <UzcardLogo />
                        <HumoLogo />
                        <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md font-bold">VISA</span>
                        <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md font-bold">MASTERCARD</span>
                        <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md">P2P Bank Karta</span>
                    </div>
                </div>
            </section>

            {/* Core Features Grid */}
            <section id="features" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
                <div className="text-center space-y-4 max-w-3xl mx-auto">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
                        Mukammal Arxitektura
                    </h2>
                    <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
                        Nima uchun eng yetakchi kompaniyalar 1Call Agentni tanlaydi?
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300 text-base sm:text-lg">
                        Oddiy qo‘ng‘iroq yozuvchi ilovalardan farqli ravishda, 1Call Agent — yaxlit korporativ ekotizimdir.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {/* Feature 1 */}
                    <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 hover:shadow-xl hover:border-blue-500/30 transition-all">
                        <div className="h-12 w-12 rounded-2xl bg-blue-600/10 text-blue-600 flex items-center justify-center font-bold">
                            <Smartphone className="h-6 w-6" />
                        </div>
                        <h4 className="text-xl font-bold text-slate-900 dark:text-white">Android 10 - 15 Native Agent</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                            Google AccessibilityService texnologiyasi orqali eng yangi Android versiyalarida ham qo‘ng‘iroqlarni barqaror yozib oladi. <code>BootCompletedReceiver</code> telefon o‘chib yonganda ham avtomatik davom ettiradi.
                        </p>
                    </div>

                    {/* Feature 2 */}
                    <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 hover:shadow-xl hover:border-emerald-500/30 transition-all">
                        <div className="h-12 w-12 rounded-2xl bg-emerald-600/10 text-emerald-600 flex items-center justify-center font-bold">
                            <Zap className="h-6 w-6" />
                        </div>
                        <h4 className="text-xl font-bold text-slate-900 dark:text-white">Yengil Audio (AAC / Opus .m4a)</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                            16 kHz mono siqish orqali 1 daqiqalik suhbat atigi ~180-200 KB hajm egallaydi. Xotira va mobil internet tejaladi, audio fayllar soniyalar ichida serverga yuklanadi.
                        </p>
                    </div>

                    {/* Feature 3 */}
                    <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 hover:shadow-xl hover:border-purple-500/30 transition-all">
                        <div className="h-12 w-12 rounded-2xl bg-purple-600/10 text-purple-600 flex items-center justify-center font-bold">
                            <ShieldCheck className="h-6 w-6" />
                        </div>
                        <h4 className="text-xl font-bold text-slate-900 dark:text-white">Dual-SIM & Shaxsiy Maxfiylik</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                            Operator sozlamalardan faqat korporativ SIM kartani tanlaydi. Shaxsiy SIM qo‘ng‘iroqlari, ish vaqtidan tashqari suhbatlar hamda qora ro‘yxatdagi raqamlar aslo yozilmaydi.
                        </p>
                    </div>

                    {/* Feature 4 */}
                    <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 hover:shadow-xl hover:border-blue-500/30 transition-all">
                        <div className="h-12 w-12 rounded-2xl bg-indigo-600/10 text-indigo-600 flex items-center justify-center font-bold">
                            <Radio className="h-6 w-6" />
                        </div>
                        <h4 className="text-xl font-bold text-slate-900 dark:text-white">Real-Vaqtda WebSockets (Reverb)</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                            Telefon jiringlagan zahoti brauzeringizda mijoz kartasi qalqib chiqadi. Suhbat tugaganda esa audio darhol jurnallarda paydo bo‘ladi. Sahifani yangilashga hojat yo‘q.
                        </p>
                    </div>

                    {/* Feature 5 */}
                    <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 hover:shadow-xl hover:border-amber-500/30 transition-all">
                        <div className="h-12 w-12 rounded-2xl bg-amber-600/10 text-amber-600 flex items-center justify-center font-bold">
                            <Layers className="h-6 w-6" />
                        </div>
                        <h4 className="text-xl font-bold text-slate-900 dark:text-white">amoCRM & MoySklad Integratsiyasi</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                            O‘zbekiston raqamlarini 5 xil formatda izlash, avtomatik yangi lead/kontakt ochish, javobsiz qo‘ng‘iroqlarda avto-vazifa (Task) yaratish va HMAC SHA-256 xavfsiz audio pleyer.
                        </p>
                    </div>

                    {/* Feature 6 */}
                    <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 hover:shadow-xl hover:border-red-500/30 transition-all">
                        <div className="h-12 w-12 rounded-2xl bg-red-600/10 text-red-600 flex items-center justify-center font-bold">
                            <Lock className="h-6 w-6" />
                        </div>
                        <h4 className="text-xl font-bold text-slate-900 dark:text-white">PostgreSQL 16 RLS & Partitsiya</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                            Baza darajasidagi Row-Level Security har bir kompaniya ma’lumotlarini to‘liq himoyalaydi. Oylik diapazonli partitsiya esa millionlab qo‘ng‘iroqlarda ham lahzali tezlikni beradi.
                        </p>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section id="how-it-works" className="py-20 bg-slate-100/70 dark:bg-slate-900/60 border-y border-slate-200 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
                    <div className="text-center space-y-4 max-w-2xl mx-auto">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
                            Oson va Tezkor
                        </h2>
                        <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
                            3 ta oddiy qadamda ishga tushiring
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 relative">
                            <span className="text-5xl font-black text-blue-600/20">01</span>
                            <h4 className="text-xl font-bold">Ro‘yxatdan o‘ting</h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                1Call saytida Google yoki email orqali hisob yarating. Sizga darhol 14 kunlik bepul sinov davri faollashadi.
                            </p>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 relative">
                            <span className="text-5xl font-black text-blue-600/20">02</span>
                            <h4 className="text-xl font-bold">Ilovani o‘rnating</h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Operatoringiz telefoniga 1Call Agent ilovasini yuklang va QR-kodni skanerlab 5 soniyada tizimga ulang.
                            </p>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 relative">
                            <span className="text-5xl font-black text-blue-600/20">03</span>
                            <h4 className="text-xl font-bold">Nazoratni boshlang</h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Kompyuter ekranida barcha kiruvchi va chiquvchi qo‘ng‘iroqlarni real-vaqtda kuzatib, audiolarni tinglang.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
                <div className="text-center space-y-4 max-w-3xl mx-auto">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
                        Shaffof Narxlar
                    </h2>
                    <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
                        Har bir biznes uchun moslashuvchan tariflar
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300">
                        Har bir ulangan telefon uchun to‘lov. Yashirin to‘lovlarsiz, 14 kun bepul sinov.
                    </p>

                    {/* Currency Toggle */}
                    <div className="inline-flex items-center p-1.5 rounded-2xl bg-slate-200/80 dark:bg-slate-800 border border-slate-300 dark:border-slate-700">
                        <button
                            onClick={() => setCurrency('UZS')}
                            className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                                currency === 'UZS' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-sm' : 'text-slate-600 dark:text-slate-400'
                            }`}
                        >
                            UZS (So‘m)
                        </button>
                        <button
                            onClick={() => setCurrency('USD')}
                            className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                                currency === 'USD' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-sm' : 'text-slate-600 dark:text-slate-400'
                            }`}
                        >
                            USD ($)
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
                    {/* Plan 1: Start */}
                    <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-8 hover:border-slate-400 transition-colors">
                        <div className="space-y-4">
                            <h4 className="text-2xl font-bold">Start</h4>
                            <p className="text-xs text-slate-500">Kichik savdo va xizmat guruhlari uchun (1-3 telefon)</p>
                            <div className="pt-2">
                                <span className="text-4xl font-black">
                                    {currency === 'UZS' ? '49,000 so‘m' : '$4.00'}
                                </span>
                                <span className="text-xs text-slate-500 font-medium"> / telefon / oy</span>
                            </div>
                            <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-300 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <li className="flex items-center gap-2.5"><CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" /> 1 dan 3 tagacha telefon</li>
                                <li className="flex items-center gap-2.5"><CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" /> 30 kun bepul audio saqlash</li>
                                <li className="flex items-center gap-2.5"><CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" /> amoCRM & MoySklad</li>
                                <li className="flex items-center gap-2.5"><CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" /> Real-time WebSockets</li>
                            </ul>
                        </div>
                        <Link href="/register" className="w-full">
                            <Button variant="outline" className="w-full h-12 rounded-xl font-bold">
                                Boshlash
                            </Button>
                        </Link>
                    </div>

                    {/* Plan 2: Pro (Popular) */}
                    <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border-2 border-blue-600 shadow-xl flex flex-col justify-between space-y-8 relative">
                        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-blue-600 text-white text-xs font-bold uppercase tracking-wider shadow-md">
                            Eng Ommabop
                        </div>
                        <div className="space-y-4">
                            <h4 className="text-2xl font-bold">Pro</h4>
                            <p className="text-xs text-slate-500">O‘rta biznes va professional sotuv bo‘limlari uchun (4-10 telefon)</p>
                            <div className="pt-2">
                                <span className="text-4xl font-black text-blue-600">
                                    {currency === 'UZS' ? '39,000 so‘m' : '$3.20'}
                                </span>
                                <span className="text-xs text-slate-500 font-medium"> / telefon / oy</span>
                            </div>
                            <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-300 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <li className="flex items-center gap-2.5"><CheckCircle2 className="h-4 w-4 text-blue-600 flex-shrink-0" /> 4 dan 10 tagacha telefon</li>
                                <li className="flex items-center gap-2.5"><CheckCircle2 className="h-4 w-4 text-blue-600 flex-shrink-0" /> 30 kun bepul audio saqlash</li>
                                <li className="flex items-center gap-2.5"><CheckCircle2 className="h-4 w-4 text-blue-600 flex-shrink-0" /> Pro-rata (co-terming) hisob-kitob</li>
                                <li className="flex items-center gap-2.5"><CheckCircle2 className="h-4 w-4 text-blue-600 flex-shrink-0" /> amoCRM & MoySklad to‘liq integratsiya</li>
                                <li className="flex items-center gap-2.5"><CheckCircle2 className="h-4 w-4 text-blue-600 flex-shrink-0" /> Telegram bildirishnomalar</li>
                            </ul>
                        </div>
                        <Link href="/register" className="w-full">
                            <Button className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-500/20">
                                Sinovni boshlash (14 kun)
                            </Button>
                        </Link>
                    </div>

                    {/* Plan 3: Enterprise */}
                    <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-8 hover:border-slate-400 transition-colors">
                        <div className="space-y-4">
                            <h4 className="text-2xl font-bold">Enterprise</h4>
                            <p className="text-xs text-slate-500">Katta aloqa markazlari va korporatsiyalar uchun (11+ telefon)</p>
                            <div className="pt-2">
                                <span className="text-4xl font-black">
                                    {currency === 'UZS' ? '29,000 so‘m' : '$2.50'}
                                </span>
                                <span className="text-xs text-slate-500 font-medium"> / telefon / oy</span>
                            </div>
                            <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-300 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <li className="flex items-center gap-2.5"><CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" /> 11 va undan ortiq telefonlar</li>
                                <li className="flex items-center gap-2.5"><CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" /> 12 oyga 20% gacha hajm chegirmasi</li>
                                <li className="flex items-center gap-2.5"><CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" /> 365 kungacha arxiv uzaytirish</li>
                                <li className="flex items-center gap-2.5"><CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" /> Shaxsiy menejer va SLA qo‘llab-quvvatlash</li>
                            </ul>
                        </div>
                        <Link href="/register" className="w-full">
                            <Button variant="outline" className="w-full h-12 rounded-xl font-bold">
                                Boshlash
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="p-6 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-center max-w-3xl mx-auto space-y-2">
                    <h5 className="font-bold text-blue-900 dark:text-blue-200">Katta muddatli chegirmalar:</h5>
                    <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300">
                        3 oylik to‘lovda — <strong>5%</strong>, 6 oylik to‘lovda — <strong>10%</strong>, 12 oylik to‘lovda — <strong>20% chegirma</strong> taqdim etiladi.
                    </p>
                </div>
            </section>

            {/* FAQ Section */}
            <section id="faq" className="py-20 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
                    <div className="text-center space-y-3">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
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
                                a: 'Ha, albatta. 1Call Agent Android tizimidagi eng zamonaviy AccessibilityService API dan foydalanadi. Bu Android 10 dan to eng so‘nggi Android 15 gacha bo‘lgan barcha smartfonlarda ikki tomonlama ovoz yozishni to‘liq ta’minlaydi.',
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
                                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 overflow-hidden"
                            >
                                <button
                                    onClick={() => toggleFaq(idx)}
                                    className="w-full p-6 text-left flex items-center justify-between gap-4 font-bold text-base sm:text-lg"
                                >
                                    <span>{item.q}</span>
                                    <ChevronDown
                                        className={`h-5 w-5 text-slate-500 transition-transform ${openFaq === idx ? 'rotate-180 text-blue-600' : ''}`}
                                    />
                                </button>
                                {openFaq === idx && (
                                    <div className="px-6 pb-6 text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-200/50 dark:border-slate-800/50 pt-4">
                                        {item.a}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Bottom CTA Banner */}
            <section className="py-20 bg-gradient-to-br from-blue-600 via-indigo-700 to-blue-800 text-white text-center">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
                    <h3 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
                        Qo‘ng‘iroqlaringizni bugunoq nazoratga oling
                    </h3>
                    <p className="text-lg text-blue-100 max-w-2xl mx-auto">
                        14 kunlik bepul sinovni boshlang. Operatorlaringiz suhbatini tinglang va savdo konversiyasini oshiring.
                    </p>
                    <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link href="/register">
                            <Button size="lg" className="h-14 px-9 bg-white text-blue-700 hover:bg-slate-100 font-bold rounded-2xl shadow-xl">
                                Bepul Sinovni Boshlash
                            </Button>
                        </Link>
                        <a href="/auth/google">
                            <Button size="lg" variant="outline" className="h-14 px-8 bg-transparent border-white/40 text-white hover:bg-white/10 font-bold rounded-2xl">
                                Google bilan kirish
                            </Button>
                        </a>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 bg-slate-900 text-slate-400 border-t border-slate-800 text-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <img
                            src="/images/1call_logo.png"
                            alt="1Call Logo"
                            className="h-8 w-8 rounded-lg object-contain"
                        />
                        <span className="font-bold text-white text-base">1Call Agent</span>
                        <span className="text-xs">© {new Date().getFullYear()} {t('welcome.copyright', 'Barcha huquqlar himoyalangan.')}</span>
                    </div>

                    <div className="flex items-center gap-6 text-xs">
                        <a href="https://t.me/onecall_support" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
                            {t('welcome.telegramSupport', 'Telegram Qo\'llab-quvvatlash')}
                        </a>
                        <Link href="/login" className="hover:text-white transition-colors">
                            Kirish
                        </Link>
                        <Link href="/register" className="hover:text-white transition-colors">
                            Ro‘yxatdan o‘tish
                        </Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
