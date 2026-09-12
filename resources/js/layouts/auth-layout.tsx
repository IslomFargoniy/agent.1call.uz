import { LanguageSwitcher } from '@/components/language-switcher';
import { ThemeSwitcher } from '@/components/theme-switcher';
import AppLogoIcon from '@/components/app-logo-icon';
import AuthSimpleLayout from '@/layouts/auth/auth-simple-layout';
import { home } from '@/routes';
import { Link, usePage } from '@inertiajs/react';
import type React from 'react';

export default function AuthLayout({
    title = '',
    description = '',
    children,
}: {
    title?: string;
    description?: string;
    children: React.ReactNode;
}) {
    const { component } = usePage();
    const isWideAuth = component === 'auth/login' || component === 'auth/register';

    if (isWideAuth) {
        return (
            <div className="relative min-h-svh flex flex-col justify-between bg-gradient-to-b from-background via-muted/20 to-background selection:bg-primary/10 selection:text-primary">
                {/* Background ambient lighting effects */}
                <div className="pointer-events-none fixed inset-0 overflow-hidden">
                    <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-gradient-to-tr from-primary/15 via-blue-500/10 to-transparent blur-3xl opacity-60 dark:opacity-40" />
                    <div className="absolute -bottom-40 right-0 w-[500px] h-[500px] bg-primary/5 blur-3xl rounded-full" />
                </div>

                {/* Top Header Bar */}
                <header className="relative z-20 flex items-center justify-between px-6 py-4 sm:px-10 border-b border-border/40 backdrop-blur-md bg-background/50">
                    <Link href={home()} className="flex items-center gap-3 group">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all duration-200 group-hover:scale-105 group-hover:bg-primary/20">
                            <AppLogoIcon className="h-6 w-6 fill-current text-primary" />
                        </div>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <span className="text-base sm:text-lg font-bold tracking-tight text-foreground leading-tight">
                                    Agent1Call
                                </span>
                                <span className="hidden sm:inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                                    v1.0
                                </span>
                            </div>
                            <span className="text-[11px] font-medium text-muted-foreground">
                                Korporativ telefoniya va CRM integratsiyasi
                            </span>
                        </div>
                    </Link>

                    <div className="flex items-center gap-2.5">
                        <LanguageSwitcher />
                        <ThemeSwitcher />
                    </div>
                </header>

                {/* Main 2-Column Auth Card Container */}
                <main className="relative z-10 flex flex-1 items-center justify-center p-4 sm:p-6 md:p-8">
                    <div className="w-full max-w-4xl lg:max-w-5xl">
                        {children}
                    </div>
                </main>

                {/* Footer */}
                <footer className="relative z-20 py-4 text-center text-xs text-muted-foreground border-t border-border/30">
                    © {new Date().getFullYear()} Agent1Call.uz — Barcha huquqlar himoyalangan.
                </footer>
            </div>
        );
    }

    return (
        <AuthSimpleLayout title={title} description={description}>
            {children}
        </AuthSimpleLayout>
    );
}
