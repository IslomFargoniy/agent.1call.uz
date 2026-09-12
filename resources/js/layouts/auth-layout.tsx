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
    const isWideAuth =
        component === 'auth/login' || component === 'auth/register';

    if (isWideAuth) {
        return (
            <div className="from-background via-muted/20 to-background selection:bg-primary/10 selection:text-primary relative flex min-h-svh flex-col justify-between bg-gradient-to-b">
                {/* Background ambient lighting effects */}
                <div className="pointer-events-none fixed inset-0 overflow-hidden">
                    <div className="from-primary/15 absolute -top-40 left-1/2 h-[400px] w-[1000px] -translate-x-1/2 bg-gradient-to-tr via-blue-500/10 to-transparent opacity-60 blur-3xl dark:opacity-40" />
                    <div className="bg-primary/5 absolute right-0 -bottom-40 h-[500px] w-[500px] rounded-full blur-3xl" />
                </div>

                {/* Top Header Bar */}
                <header className="border-border/40 bg-background/50 relative z-20 flex items-center justify-between border-b px-6 py-4 backdrop-blur-md sm:px-10">
                    <Link
                        href={home()}
                        className="group flex items-center gap-3"
                    >
                        <div className="bg-primary/10 text-primary group-hover:bg-primary/20 flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200 group-hover:scale-105">
                            <AppLogoIcon className="text-primary h-6 w-6 fill-current" />
                        </div>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <span className="text-foreground text-base leading-tight font-bold tracking-tight sm:text-lg">
                                    Agent1Call
                                </span>
                                <span className="bg-primary/10 text-primary hidden rounded-full px-2 py-0.5 text-[10px] font-semibold sm:inline-flex">
                                    v1.0
                                </span>
                            </div>
                            <span className="text-muted-foreground text-[11px] font-medium">
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
                <footer className="text-muted-foreground border-border/30 relative z-20 border-t py-4 text-center text-xs">
                    © {new Date().getFullYear()} Agent1Call.uz — Barcha huquqlar
                    himoyalangan.
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
