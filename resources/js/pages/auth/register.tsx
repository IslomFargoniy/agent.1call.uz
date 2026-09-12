import { Form, Head } from '@inertiajs/react';
import {
    ArrowRight,
    CheckCircle2,
    Headphones,
    Mail,
    ShieldCheck,
    Smartphone,
    Sparkles,
    User as UserIcon,
    UserPlus,
    Zap,
} from 'lucide-react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { login } from '@/routes';
import { store } from '@/routes/register';

type Props = {
    passwordRules: string;
};

export default function Register({ passwordRules }: Props) {
    return (
        <>
            <Head title="Ro‘yxatdan o‘tish" />

            <div className="border-border/80 bg-card/95 shadow-primary/5 overflow-hidden rounded-3xl border shadow-2xl backdrop-blur-xl">
                {/* Decorative subtle top gradient bar */}
                <div className="via-primary h-1.5 w-full bg-gradient-to-r from-emerald-500 to-blue-600" />

                <div className="grid grid-cols-1 md:grid-cols-2">
                    {/* LEFT COLUMN: Boshqa usullar (Google orqali tezkor ro'yxatdan o'tish & Afzalliklar) */}
                    <div className="bg-muted/20 flex flex-col justify-between p-6 sm:p-8 lg:p-10">
                        <div>
                            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                <Sparkles className="h-3.5 w-3.5" />
                                <span>Tezkor ro‘yxatdan o‘tish</span>
                            </div>

                            <h1 className="text-foreground text-xl font-bold tracking-tight sm:text-2xl">
                                Bir bosishda hisob ochish
                            </h1>
                            <p className="text-muted-foreground mt-1.5 text-xs leading-relaxed sm:text-sm">
                                Formani qo‘lda to‘ldirish shart emas — Google
                                orqali 5 soniyada hisob oching
                            </p>

                            {/* Google Quick Register Button */}
                            <div className="mt-6">
                                <a
                                    href="/auth/google"
                                    className="group border-border bg-background hover:border-primary/50 hover:bg-accent/40 relative flex cursor-pointer items-center justify-between rounded-2xl border p-3.5 text-sm font-medium transition-all duration-200 hover:shadow-md sm:p-4"
                                >
                                    <div className="flex items-center gap-3.5">
                                        <div className="border-border/60 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-white shadow-xs">
                                            <svg
                                                className="h-5 w-5"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    fill="#4285F4"
                                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                                />
                                                <path
                                                    fill="#34A853"
                                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                                />
                                                <path
                                                    fill="#FBBC05"
                                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                                                />
                                                <path
                                                    fill="#EA4335"
                                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                                                />
                                            </svg>
                                        </div>
                                        <div className="flex flex-col text-left">
                                            <span className="text-foreground font-semibold">
                                                Google hisobi bilan
                                            </span>
                                            <span className="text-muted-foreground text-xs">
                                                Maʼlumotlar avtomatik
                                                to‘ldiriladi
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="hidden rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 sm:inline-flex dark:text-emerald-400">
                                            Tezkor
                                        </span>
                                        <ArrowRight className="text-muted-foreground group-hover:text-primary h-4 w-4 transition-transform group-hover:translate-x-1" />
                                    </div>
                                </a>
                            </div>
                        </div>

                        {/* Platform Advantages / Benefits list */}
                        <div className="border-border/50 bg-background/70 mt-8 rounded-2xl border p-4 backdrop-blur-xs sm:p-5">
                            <h3 className="text-muted-foreground mb-3 flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase">
                                <Zap className="text-primary h-3.5 w-3.5" />
                                <span>
                                    Agent1Call platformasi imkoniyatlari
                                </span>
                            </h3>

                            <div className="space-y-2.5 text-xs">
                                <div className="flex items-start gap-2.5">
                                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                                    <div>
                                        <span className="text-foreground font-semibold">
                                            14 kunlik bepul sinov:{' '}
                                        </span>
                                        <span className="text-muted-foreground">
                                            Barcha imkoniyatlar (barcha
                                            qurilmalar, cheksiz yozuv) bepul.
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-start gap-2.5">
                                    <Headphones className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                                    <div>
                                        <span className="text-foreground font-semibold">
                                            2 tomonlama audio:{' '}
                                        </span>
                                        <span className="text-muted-foreground">
                                            Mijoz va operator ovozini 100% tiniq
                                            formatda saqlash.
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-start gap-2.5">
                                    <Zap className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                                    <div>
                                        <span className="text-foreground font-semibold">
                                            CRM integratsiya:{' '}
                                        </span>
                                        <span className="text-muted-foreground">
                                            AmoCRM va MoySklad bilan lahzali
                                            avtomatik sinxronizatsiya.
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-start gap-2.5">
                                    <Smartphone className="mt-0.5 h-4 w-4 shrink-0 text-purple-500" />
                                    <div>
                                        <span className="text-foreground font-semibold">
                                            Ko‘p qurilmali:{' '}
                                        </span>
                                        <span className="text-muted-foreground">
                                            Barcha xodimlar va SIM kartalarni
                                            bitta joydan boshqarish.
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Forma to'ldirish (An'anaviy ro'yxatdan o'tish) */}
                    <div className="border-border/60 relative flex flex-col justify-between border-t p-6 sm:p-8 md:border-t-0 md:border-l lg:p-10">
                        {/* Middle "YOKI" badge on desktop vertical divider */}
                        <div className="absolute top-1/2 -left-3.5 z-10 hidden -translate-y-1/2 md:flex">
                            <span className="border-border bg-card text-muted-foreground flex h-7 w-7 items-center justify-center rounded-full border text-[10px] font-bold shadow-xs">
                                YOKI
                            </span>
                        </div>

                        {/* Mobile "YOKI" divider */}
                        <div className="my-3 flex items-center justify-center md:hidden">
                            <div className="flex w-full items-center gap-3">
                                <div className="bg-border h-px flex-1" />
                                <span className="text-muted-foreground px-2 text-xs font-bold uppercase">
                                    Yoki maʼlumotlarni kiritish
                                </span>
                                <div className="bg-border h-px flex-1" />
                            </div>
                        </div>

                        <div>
                            <div className="border-border bg-muted/50 text-foreground mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold">
                                <UserPlus className="text-primary h-3.5 w-3.5" />
                                <span>Forma to‘ldirish</span>
                            </div>

                            <h2 className="text-foreground text-xl font-bold tracking-tight sm:text-2xl">
                                Yangi hisob ochish
                            </h2>
                            <p className="text-muted-foreground mt-1.5 text-xs sm:text-sm">
                                Kompaniyangiz uchun yangi profil maʼlumotlarini
                                to‘ldiring
                            </p>

                            <Form
                                {...store.form()}
                                resetOnSuccess={[
                                    'password',
                                    'password_confirmation',
                                ]}
                                disableWhileProcessing
                                className="mt-6 flex flex-col gap-4"
                            >
                                {({ processing, errors }) => (
                                    <>
                                        <div className="space-y-3.5">
                                            {/* Name field */}
                                            <div className="grid gap-1.5">
                                                <Label
                                                    htmlFor="name"
                                                    className="text-xs font-semibold"
                                                >
                                                    To‘liq ismingiz
                                                </Label>
                                                <div className="relative">
                                                    <UserIcon className="text-muted-foreground absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2" />
                                                    <Input
                                                        id="name"
                                                        type="text"
                                                        required
                                                        autoFocus
                                                        tabIndex={1}
                                                        autoComplete="name"
                                                        name="name"
                                                        placeholder="Ism Familiya"
                                                        className="h-10 rounded-xl pl-10 sm:h-11"
                                                    />
                                                </div>
                                                <InputError
                                                    message={errors.name}
                                                />
                                            </div>

                                            {/* Email field */}
                                            <div className="grid gap-1.5">
                                                <Label
                                                    htmlFor="email"
                                                    className="text-xs font-semibold"
                                                >
                                                    Email manzil
                                                </Label>
                                                <div className="relative">
                                                    <Mail className="text-muted-foreground absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2" />
                                                    <Input
                                                        id="email"
                                                        type="email"
                                                        required
                                                        tabIndex={2}
                                                        autoComplete="email"
                                                        name="email"
                                                        placeholder="email@example.com"
                                                        className="h-10 rounded-xl pl-10 sm:h-11"
                                                    />
                                                </div>
                                                <InputError
                                                    message={errors.email}
                                                />
                                            </div>

                                            {/* Password field */}
                                            <div className="grid gap-1.5">
                                                <Label
                                                    htmlFor="password"
                                                    className="text-xs font-semibold"
                                                >
                                                    Parol
                                                </Label>
                                                <PasswordInput
                                                    id="password"
                                                    required
                                                    tabIndex={3}
                                                    autoComplete="new-password"
                                                    name="password"
                                                    placeholder="Kamida 8 ta belgi"
                                                    passwordrules={
                                                        passwordRules
                                                    }
                                                    className="h-10 rounded-xl sm:h-11"
                                                />
                                                <InputError
                                                    message={errors.password}
                                                />
                                            </div>

                                            {/* Password Confirmation field */}
                                            <div className="grid gap-1.5">
                                                <Label
                                                    htmlFor="password_confirmation"
                                                    className="text-xs font-semibold"
                                                >
                                                    Parolni tasdiqlang
                                                </Label>
                                                <PasswordInput
                                                    id="password_confirmation"
                                                    required
                                                    tabIndex={4}
                                                    autoComplete="new-password"
                                                    name="password_confirmation"
                                                    placeholder="Parolni qayta kiriting"
                                                    passwordrules={
                                                        passwordRules
                                                    }
                                                    className="h-10 rounded-xl sm:h-11"
                                                />
                                                <InputError
                                                    message={
                                                        errors.password_confirmation
                                                    }
                                                />
                                            </div>

                                            {/* Submit Button */}
                                            <Button
                                                type="submit"
                                                className="mt-2 h-11 w-full cursor-pointer gap-2 rounded-xl font-semibold shadow-sm"
                                                tabIndex={5}
                                                disabled={processing}
                                                data-test="register-user-button"
                                            >
                                                {processing ? (
                                                    <Spinner className="h-4 w-4" />
                                                ) : (
                                                    <ArrowRight className="h-4 w-4" />
                                                )}
                                                Hisob yaratish
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </Form>
                        </div>

                        {/* Bottom link: Tizimga kirish */}
                        <div className="border-border/50 text-muted-foreground mt-6 border-t pt-6 text-center text-xs sm:text-sm">
                            Profilingiz bormi?{' '}
                            <TextLink
                                href={login()}
                                tabIndex={6}
                                className="text-primary font-semibold hover:underline"
                            >
                                Tizimga kirish
                            </TextLink>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

Register.layout = {
    title: 'Ro‘yxatdan o‘tish',
    description:
        'Agent1Call tizimidan foydalanish uchun maʼlumotlaringizni kiriting',
};
