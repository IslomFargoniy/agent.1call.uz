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
    SidebarGroup,
    SidebarGroupLabel,
} from '@/components/ui/sidebar';
import type { NavItem } from '@/types';

export function AppSidebar() {
    const { auth } = usePage<{ auth: { user: { role: string; name: string } | null; tenant?: { name: string } | null } }>().props;
    const role = auth?.user?.role || 'operator';
    const isSuperAdmin = role === 'superadmin';
    const isAdmin = role === 'admin' || isSuperAdmin;

    const mainNavItems: NavItem[] = [
        {
            title: 'Bosh sahifa',
            href: '/dashboard',
            icon: LayoutGrid,
        },
        {
            title: 'Qo\'ng\'iroqlar jurnali',
            href: '/calls',
            icon: PhoneCall,
        },
    ];

    const adminNavItems: NavItem[] = [
        {
            title: 'Telefonlar',
            href: '/devices',
            icon: Smartphone,
        },
        {
            title: 'amoCRM & MoySklad',
            href: '/integrations',
            icon: Share2,
        },
        {
            title: 'Ish grafigi & Maxfiylik',
            href: '/settings/work-schedule',
            icon: Clock,
        },
        {
            title: 'To\'lovlar & Obuna',
            href: '/billing',
            icon: CreditCard,
        },
    ];

    const superadminNavItems: NavItem[] = [
        {
            title: 'Kompaniyalar (Tenants)',
            href: '/admin/tenants',
            icon: Building2,
        },
        {
            title: 'Barcha xodimlar',
            href: '/admin/users',
            icon: Users,
        },
        {
            title: 'Tariflar boshqaruvi',
            href: '/admin/tariffs',
            icon: Coins,
        },
        {
            title: 'To\'lov tizimlari',
            href: '/admin/payment-methods',
            icon: CreditCard,
        },
        {
            title: 'Karta cheklari',
            href: '/admin/invoices',
            icon: Receipt,
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
                <NavMain items={mainNavItems} />

                {isAdmin && (
                    <SidebarGroup>
                        <SidebarGroupLabel>Kompaniya Boshqaruvi</SidebarGroupLabel>
                        <NavMain items={adminNavItems} />
                    </SidebarGroup>
                )}

                {isSuperAdmin && (
                    <SidebarGroup>
                        <SidebarGroupLabel>Superadmin Paneli</SidebarGroupLabel>
                        <NavMain items={superadminNavItems} />
                    </SidebarGroup>
                )}
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
