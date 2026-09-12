import { Form, Head } from '@inertiajs/react';
import {
    ArrowRight,
    Headphones,
    Mail,
    ShieldCheck,
    Smartphone,
    Sparkles,
} from 'lucide-react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';
import PasskeyVerify from '@/components/passkey-verify';

type Props = {
    status?: string;
    canResetPassword: boolean;
};

export default function Login({ status, canResetPassword }: Props) {
    return (
        <>
            <Head title="Tizimga kirish" />

            <div className="border-border/80 bg-card/95 shadow-primary/5 overflow-hidden rounded-3xl border shadow-2xl backdrop-blur-xl">
                {/* Decorative subtle top gradient bar */}
                <div className="via-primary h-1.5 w-full bg-gradient-to-r from-blue-600 to-indigo-500" />

                <div className="grid grid-cols-1 md:grid-cols-2">
                    {/* LEFT COLUMN: Boshqa usullar (Google, Passkey, Tezkor kirish) */}
                    <div className="bg-muted/20 flex flex-col justify-between p-6 sm:p-8 lg:p-10">
                        <div>
                            <div className="border-primary/25 bg-primary/10 text-primary mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold">
                                <Sparkles className="h-3.5 w-3.5" />
                                <span>Tezkor &amp; Parolsiz kirish</span>
                            </div>

                            <h1 className="text-foreground text-xl font-bold tracking-tight sm:text-2xl">
                                Boshqa login usullari
                            </h1>
                            <p className="text-muted-foreground mt-1.5 text-xs leading-relaxed sm:text-sm">
                                Parolni eslab qolmasdan, bir lahzada xavfsiz
                                tizimga kiring
                            </p>

                            {/* Alternative Login Actions */}
                            <div className="mt-6 space-y-3.5">
                                {/* Google Button */}
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
                                                Google hisobi orqali
                                            </span>
                                            <span className="text-muted-foreground text-xs">
                                                Bir bosishda lahzali kirish
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="hidden rounded-md bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-600 sm:inline-flex dark:text-blue-400">
                                            Tavsiya
                                        </span>
                                        <ArrowRight className="text-muted-foreground group-hover:text-primary h-4 w-4 transition-transform group-hover:translate-x-1" />
                                    </div>
                                </a>

                                {/* Passkey Button (Card variant) */}
                                <PasskeyVerify
                                    variant="card"
                                    showSeparator={false}
                                    label="Passkey (Biometriya)"
                                />
                            </div>
                        </div>

                        {/* Security & Feature Trust Box */}
                        <div className="border-border/50 bg-background/70 mt-8 rounded-2xl border p-4 backdrop-blur-xs">
                            <div className="flex items-start gap-3">
                                <div className="shrink-0 rounded-xl bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400">
                                    <ShieldCheck className="h-5 w-5" />
                                </div>
                                <div className="space-y-1 text-xs">
                                    <p className="text-foreground font-semibold">
                                        256-bit xavfsiz shifrlash
                                    </p>
                                    <p className="text-muted-foreground leading-relaxed">
                                        Barcha sessiyalar va qo‘ng‘iroqlar
                                        maʼlumotlari himoyalangan. Tizimga
                                        kirish to‘liq maxfiy.
                                    </p>
                                </div>
                            </div>
                            <div className="border-border/40 text-muted-foreground mt-3.5 grid grid-cols-2 gap-2 border-t pt-3 text-[11px]">
                                <div className="flex items-center gap-1.5">
                                    <Smartphone className="text-primary h-3.5 w-3.5" />
                                    <span>Android &amp; Samsung</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Headphones className="text-primary h-3.5 w-3.5" />
                                    <span>2 tomonlama audio</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Forma to'ldirish (Email + Parol) */}
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
                                    Yoki elektron pochta bilan
                                </span>
                                <div className="bg-border h-px flex-1" />
                            </div>
                        </div>

                        <div>
                            <div className="border-border bg-muted/50 text-foreground mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold">
                                <Mail className="text-primary h-3.5 w-3.5" />
                                <span>Elektron pochta</span>
                            </div>

                            <h2 className="text-foreground text-xl font-bold tracking-tight sm:text-2xl">
                                Forma orqali kirish
                            </h2>
                            <p className="text-muted-foreground mt-1.5 text-xs sm:text-sm">
                                Email va parolingizni kiritib tizimga kiring
                            </p>

                            {status && (
                                <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-center text-sm font-medium text-emerald-600 dark:text-emerald-400">
                                    {status}
                                </div>
                            )}

                            <Form
                                {...store.form()}
                                resetOnSuccess={['password']}
                                className="mt-6 flex flex-col gap-4"
                            >
                                {({ processing, errors }) => (
                                    <>
                                        <div className="space-y-4">
                                            {/* Email field */}
                                            <div className="grid gap-2">
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
                                                        name="email"
                                                        required
                                                        autoFocus
                                                        tabIndex={1}
                                                        autoComplete="email"
                                                        placeholder="pochta@kompaniya.uz"
                                                        className="h-11 rounded-xl pl-10"
                                                    />
                                                </div>
                                                <InputError
                                                    message={errors.email}
                                                />
                                            </div>

                                            {/* Password field */}
                                            <div className="grid gap-2">
                                                <div className="flex items-center justify-between">
                                                    <Label
                                                        htmlFor="password"
                                                        className="text-xs font-semibold"
                                                    >
                                                        Parol
                                                    </Label>
                                                    {canResetPassword && (
                                                        <TextLink
                                                            href={request()}
                                                            className="text-primary text-xs font-medium hover:underline"
                                                            tabIndex={5}
                                                        >
                                                            Parolni
                                                            unutdingizmi?
                                                        </TextLink>
                                                    )}
                                                </div>
                                                <PasswordInput
                                                    id="password"
                                                    name="password"
                                                    required
                                                    tabIndex={2}
                                                    autoComplete="current-password"
                                                    placeholder="Parolingizni kiriting"
                                                    className="h-11 rounded-xl"
                                                />
                                                <InputError
                                                    message={errors.password}
                                                />
                                            </div>

                                            {/* Remember me */}
                                            <div className="flex items-center space-x-2.5 pt-1">
                                                <Checkbox
                                                    id="remember"
                                                    name="remember"
                                                    tabIndex={3}
                                                    className="rounded-md"
                                                />
                                                <Label
                                                    htmlFor="remember"
                                                    className="text-muted-foreground cursor-pointer text-xs font-normal select-none"
                                                >
                                                    Meni eslab qol (30 kun)
                                                </Label>
                                            </div>

                                            {/* Submit Button */}
                                            <Button
                                                type="submit"
                                                className="mt-2 h-11 w-full cursor-pointer gap-2 rounded-xl font-semibold shadow-sm"
                                                tabIndex={4}
                                                disabled={processing}
                                                data-test="login-button"
                                            >
                                                {processing ? (
                                                    <Spinner className="h-4 w-4" />
                                                ) : (
                                                    <ArrowRight className="h-4 w-4" />
                                                )}
                                                Tizimga kirish
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </Form>
                        </div>

                        {/* Bottom link: Ro'yxatdan o'tish */}
                        <div className="border-border/50 text-muted-foreground mt-8 border-t pt-6 text-center text-xs sm:text-sm">
                            Profilingiz yo‘qmi?{' '}
                            <TextLink
                                href={register()}
                                tabIndex={6}
                                className="text-primary font-semibold hover:underline"
                            >
                                Ro‘yxatdan o‘tish
                            </TextLink>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

Login.layout = {
    title: 'Tizimga kirish',
    description: 'Boshqaruv paneliga kirish uchun maʼlumotlaringizni kiriting',
};
