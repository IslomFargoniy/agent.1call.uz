import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link, usePage } from '@inertiajs/react';
import { Home, Phone, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MobileBottomNav() {
    const { t } = useTranslation();
    const { url } = usePage();

    const isHomeActive = url === '/dashboard' || url === '/';
    const isCallsActive = url.startsWith('/calls');
    const isProfileActive = url.startsWith('/settings');

    const navItems = [
        {
            name: t('nav.home', 'Asosiy'),
            href: '/dashboard',
            icon: Home,
            isActive: isHomeActive,
        },
        {
            name: t('nav.calls', "Qo'ng'iroqlar"),
            href: '/calls',
            icon: Phone,
            isActive: isCallsActive,
        },
        {
            name: t('nav.profile', 'Profil'),
            href: '/settings/profile',
            icon: User,
            isActive: isProfileActive,
        },
    ];

    return (
        <nav
            aria-label="Mobile Bottom Navigation"
            className="fixed inset-x-0 bottom-0 z-40 border-t border-black/[0.08] bg-white/80 pt-1.5 pb-[max(env(safe-area-inset-bottom),8px)] shadow-[0_-1px_3px_rgba(0,0,0,0.03)] backdrop-blur-2xl transition-all duration-200 md:hidden dark:border-white/[0.12] dark:bg-[#121214]/85 dark:shadow-[0_-1px_3px_rgba(0,0,0,0.3)]"
        >
            <div className="mx-auto grid h-[49px] max-w-md grid-cols-3 items-center px-4">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            prefetch={true}
                            className={cn(
                                'group flex h-full flex-col items-center justify-center text-center transition-all duration-150 ease-out select-none focus-visible:outline-none active:scale-90',
                                item.isActive
                                    ? 'text-[#007AFF] dark:text-[#0A84FF]'
                                    : 'hover:text-foreground text-[#8E8E93] dark:text-[#98989D]',
                            )}
                        >
                            <div className="relative flex h-6 w-6 items-center justify-center">
                                <Icon
                                    className={cn(
                                        'h-[22px] w-[22px] transition-all duration-200',
                                        item.isActive
                                            ? 'fill-[#007AFF]/15 stroke-[2.2px] text-[#007AFF] dark:fill-[#0A84FF]/25 dark:text-[#0A84FF]'
                                            : 'fill-transparent stroke-[1.75px]',
                                    )}
                                />
                            </div>
                            <span
                                className={cn(
                                    'mt-1 text-[10px] leading-none tracking-tight transition-colors duration-200',
                                    item.isActive
                                        ? 'font-semibold text-[#007AFF] dark:text-[#0A84FF]'
                                        : 'font-normal text-[#8E8E93] dark:text-[#98989D]',
                                )}
                            >
                                {item.name}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
