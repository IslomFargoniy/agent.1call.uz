import { useTranslation } from 'react-i18next';
import { Link, usePage } from '@inertiajs/react';
import {
    Building2,
    Clock,
    Coins,
    CreditCard,
    LayoutGrid,
    PhoneCall,
    Receipt,
    Share2,
    Smartphone,
    Users,
    Send,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import type { NavItem } from '@/types';

export function AppSidebar() {
    const { t } = useTranslation();
    const { auth } = usePage<{ auth: { user: { role: string; name: string } | null; tenant?: { name: string } | null } }>().props;
    const role = auth?.user?.role || 'operator';
    const isSuperAdmin = role === 'superadmin';
    const isAdmin = role === 'admin' || isSuperAdmin;

    const mainNavItems: NavItem[] = [
        {
            title: t('sidebar.dashboard', 'Bosh sahifa'),
            href: '/dashboard',
            icon: LayoutGrid,
        },
        {
            title: t('sidebar.calls', 'Qo\'ng\'iroqlar jurnali'),
            href: '/calls',
            icon: PhoneCall,
        },
    ];

    const adminNavItems: NavItem[] = [
        {
            title: t('sidebar.devices', 'Telefonlar'),
            href: '/devices',
            icon: Smartphone,
        },
        {
            title: t('sidebar.integrations', 'amoCRM & MoySklad'),
            href: '/integrations',
            icon: Share2,
        },
        {
            title: t('sidebar.workSchedule', 'Ish grafigi & Maxfiylik'),
            href: '/settings/work-schedule',
            icon: Clock,
        },
        {
            title: t('sidebar.billing', 'To\'lovlar & Obuna'),
            href: '/billing',
            icon: CreditCard,
        },
    ];

    const superadminNavItems: NavItem[] = [
        {
            title: t('sidebar.tenantsAndUsers', 'Kompaniyalar va Xodimlar'),
            href: '/admin/tenants',
            icon: Building2,
        },
        {
            title: t('sidebar.tariffs', 'Tariflar & Valyuta kursi'),
            href: '/admin/tariffs',
            icon: Coins,
        },
        {
            title: t('sidebar.paymentMethods', 'To\'lov tizimlari'),
            href: '/admin/payment-methods',
            icon: CreditCard,
        },
        {
            title: t('sidebar.invoices', 'Karta cheklari'),
            href: '/admin/invoices',
            icon: Receipt,
        },
        {
            title: t('sidebar.telegramBot', 'Telegram Bot'),
            href: '/admin/telegram-bot',
            icon: Send,
        },
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} label={t('sidebar.platform', 'Platforma')} />

                {isAdmin && (
                    <NavMain items={adminNavItems} label={t('sidebar.companyManagement', 'Kompaniya Boshqaruvi')} />
                )}

                {isSuperAdmin && (
                    <NavMain items={superadminNavItems} label={t('sidebar.superadminPanel', 'Superadmin Paneli')} />
                )}
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
