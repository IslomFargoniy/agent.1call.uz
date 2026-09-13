import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link, usePage } from '@inertiajs/react';
import { LayoutGrid, PhoneCall, User } from 'lucide-react';
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
            icon: LayoutGrid,
            isActive: isHomeActive,
        },
        {
            name: t('nav.calls', "Qo'ng'iroqlar"),
            href: '/calls',
            icon: PhoneCall,
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
            aria-label="Mobile Navigation"
            className="fixed inset-x-0 bottom-0 z-50 block md:hidden bg-white/80 dark:bg-[#161618]/85 backdrop-blur-2xl backdrop-saturate-150 border-t border-black/[0.08] dark:border-white/[0.12] pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-1px_3px_rgba(0,0,0,0.03)] dark:shadow-[0_-1px_3px_rgba(0,0,0,0.3)] transition-all select-none"
        >
            <div className="mx-auto grid h-[49px] max-w-md grid-cols-3 items-stretch px-2">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            prefetch={true}
                            className={cn(
                                'group flex flex-col items-center justify-center py-1 transition-transform duration-150 ease-out active:scale-90 focus-visible:outline-none',
                                item.isActive
                                    ? 'text-[#007AFF] dark:text-[#0A84FF]'
                                    : 'text-[#8E8E93] dark:text-[#98989D]',
                            )}
                        >
                            <div className="relative flex h-[24px] w-[24px] items-center justify-center">
                                <Icon
                                    className={cn(
                                        'h-[22px] w-[22px] transition-transform duration-200 group-active:scale-95',
                                        item.isActive
                                            ? 'stroke-[2.2px] fill-[#007AFF]/15 dark:fill-[#0A84FF]/25'
                                            : 'stroke-[1.75px] fill-transparent',
                                    )}
                                />
                            </div>
                            <span
                                className={cn(
                                    'mt-[2px] text-[10px] leading-tight tracking-tight font-medium transition-colors',
                                    item.isActive
                                        ? 'text-[#007AFF] dark:text-[#0A84FF] font-semibold'
                                        : 'text-[#8E8E93] dark:text-[#98989D]',
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
