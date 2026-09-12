import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Head, useForm, router } from '@inertiajs/react';
import {
    Building2,
    Users,
    Edit3,
    Search,
    CheckCircle2,
    XCircle,
    Smartphone,
    PhoneCall,
    Filter,
    ArrowRight,
    KeyRound,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PaginationNav, PaginationLink } from '@/components/ui/pagination-nav';
import { formatDate } from '@/lib/datetime';

interface TenantItem {
    id: number;
    uuid: string;
    name: string;
    slug: string;
    allowed_devices_count: number;
    audio_retention_days: number;
    subscription_expires_at?: string;
    trial_ends_at?: string;
    is_active: boolean;
    users_count: number;
    devices_count: number;
    calls_count: number;
}

interface UserItem {
    id: number;
    name: string;
    email: string;
    role: string;
    phone_number?: string;
    is_active: boolean;
    tenant_id?: number;
    tenant?: { id: number; name: string };
    created_at: string;
}

interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
    from: number | null;
    to: number | null;
    per_page: number;
    links: PaginationLink[];
}

interface UnifiedProps {
    activeTab?: 'tenants' | 'users';
    tenants: PaginatedData<TenantItem>;
    users?: PaginatedData<UserItem>;
    allTenants?: { id: number; name: string }[];
    filters: {
        search?: string;
        role?: string;
        tenant_id?: string;
        tab?: string;
        per_page?: string | number;
    };
}

export default function AdminTenantsAndUsers({
    activeTab: initialTab = 'tenants',
    tenants,
    users = {
        data: [],
        current_page: 1,
        last_page: 1,
        total: 0,
        from: null,
        to: null,
        per_page: 10,
        links: [],
    },
    allTenants = [],
    filters,
}: UnifiedProps) {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<'tenants' | 'users'>(filters.tab === 'users' ? 'users' : initialTab);

    // Search and filters state
    const [searchTenants, setSearchTenants] = useState(activeTab === 'tenants' ? (filters.search || '') : '');
    const [searchUsers, setSearchUsers] = useState(activeTab === 'users' ? (filters.search || '') : '');
    const [roleFilter, setRoleFilter] = useState(filters.role || '');
    const [tenantFilter, setTenantFilter] = useState(filters.tenant_id || '');

    // Modals
    const [editingTenant, setEditingTenant] = useState<TenantItem | null>(null);
    const [editingUser, setEditingUser] = useState<UserItem | null>(null);

    // Form for Tenant Edit
    const tenantForm = useForm({
        name: '',
        allowed_devices_count: 2,
        audio_retention_days: 30,
        subscription_expires_at: '',
        trial_ends_at: '',
        is_active: true,
    });

    // Form for User Edit
    const userForm = useForm({
        role: 'operator',
        tenant_id: '',
        is_active: true,
        password: '',
    });

    const switchTab = (tab: 'tenants' | 'users') => {
        setActiveTab(tab);
        router.get('/admin/tenants', {
            tab,
            per_page: filters.per_page || 10,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleTenantSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/admin/tenants', {
            tab: 'tenants',
            search: searchTenants,
            per_page: filters.per_page || 10,
        }, { preserveState: true });
    };

    const handleUserFilter = (newRole?: string, newTenantId?: string, newSearch?: string) => {
        const r = newRole !== undefined ? newRole : roleFilter;
        const tid = newTenantId !== undefined ? newTenantId : tenantFilter;
        const s = newSearch !== undefined ? newSearch : searchUsers;

        router.get('/admin/tenants', {
            tab: 'users',
            search: s || undefined,
            role: r || undefined,
            tenant_id: tid || undefined,
            per_page: filters.per_page || 10,
        }, { preserveState: true });
    };

    const viewTenantUsers = (tId: number) => {
        setActiveTab('users');
        setTenantFilter(String(tId));
        router.get('/admin/tenants', {
            tab: 'users',
            tenant_id: tId,
            per_page: filters.per_page || 10,
        }, { preserveState: true });
    };

    const openEditTenant = (tenant: TenantItem) => {
        setEditingTenant(tenant);
        tenantForm.setData({
            name: tenant.name,
            allowed_devices_count: tenant.allowed_devices_count,
            audio_retention_days: tenant.audio_retention_days,
            subscription_expires_at: tenant.subscription_expires_at ? tenant.subscription_expires_at.substring(0, 10) : '',
            trial_ends_at: tenant.trial_ends_at ? tenant.trial_ends_at.substring(0, 10) : '',
            is_active: tenant.is_active,
        });
    };

    const handleUpdateTenant = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTenant) return;
        tenantForm.put(`/admin/tenants/${editingTenant.id}`, {
            onSuccess: () => setEditingTenant(null),
        });
    };

    const openEditUser = (user: UserItem) => {
        setEditingUser(user);
        userForm.setData({
            role: user.role,
            tenant_id: user.tenant_id ? String(user.tenant_id) : '',
            is_active: user.is_active,
            password: '',
        });
    };

    const handleUpdateUser = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;
        userForm.put(`/admin/users/${editingUser.id}`, {
            onSuccess: () => setEditingUser(null),
        });
    };

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            <Head title={t('admin.tenantsAndUsers', 'Kompaniyalar va Xodimlar')} />

            {/* Header & Segmented Tab Controls */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-5">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">{t('admin.tenantsAndUsers', 'Kompaniyalar va Xodimlar')}</h2>
                    <p className="text-sm text-muted-foreground">
                        {t('admin.tenantsAndUsersDesc', 'Mijoz kompaniyalar (tenants) va ularga biriktirilgan barcha xodimlarni yagona markazdan boshqarish')}
                    </p>
                </div>

                {/* Tab Switcher */}
                <div className="inline-flex bg-muted/60 p-1 rounded-xl border border-border shrink-0">
                    <button
                        type="button"
                        onClick={() => switchTab('tenants')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            activeTab === 'tenants'
                                ? 'bg-background text-foreground shadow-xs'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <Building2 className="h-4 w-4 text-primary" />
                        <span>{t('admin.tenantsTitle', 'Kompaniyalar (Tenants)')}</span>
                        <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                            activeTab === 'tenants' ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
                        }`}>
                            {tenants.total}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => switchTab('users')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            activeTab === 'users'
                                ? 'bg-background text-foreground shadow-xs'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <Users className="h-4 w-4 text-primary" />
                        <span>{t('admin.allUsers', 'Barcha xodimlar')}</span>
                        <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                            activeTab === 'users' ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
                        }`}>
                            {users.total}
                        </span>
                    </button>
                </div>
            </div>

            {/* TAB 1: KOMPANIYALAR (TENANTS) */}
            {activeTab === 'tenants' && (
                <div className="space-y-4">
                    {/* Filters Bar */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                        <form onSubmit={handleTenantSearch} className="flex gap-2 w-full sm:max-w-sm">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    value={searchTenants}
                                    onChange={(e) => setSearchTenants(e.target.value)}
                                    placeholder={t('admin.searchTenantPlaceholder', 'Kompaniya nomi yoki slug...')}
                                    className="pl-9 h-9 text-xs"
                                />
                            </div>
                            <Button type="submit" size="sm" variant="secondary" className="h-9 px-3 text-xs">
                                {t('common.search', 'Qidirish')}
                            </Button>
                        </form>

                        <div className="text-xs text-muted-foreground">
                            {t('admin.totalTenants', 'Jami kompaniyalar')}: <b>{tenants.total} ta</b>
                        </div>
                    </div>

                    {/* Tenants Table */}
                    <div className="bg-card rounded-2xl border border-border shadow-xs overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-muted/50 border-b border-border text-muted-foreground text-xs uppercase font-medium">
                                <tr>
                                    <th className="py-3 px-4 w-12 text-center font-mono">№</th>
                                    <th className="py-3 px-4">{t('admin.companyName', 'Kompaniya')}</th>
                                    <th className="py-3 px-4">{t('admin.employeesCount', 'Xodimlar')}</th>
                                    <th className="py-3 px-4">{t('admin.devicesCount', 'Telefon & Qo\'ng\'iroqlar')}</th>
                                    <th className="py-3 px-4">{t('admin.quota', 'Tarif / Kvota')}</th>
                                    <th className="py-3 px-4">{t('admin.subscription', 'Obuna muddati')}</th>
                                    <th className="py-3 px-4">{t('admin.status', 'Holati')}</th>
                                    <th className="py-3 px-4 text-right">{t('admin.actions', 'Amal')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {tenants.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="py-8 text-center text-muted-foreground text-xs">
                                            {t('admin.noTenantsFound', 'Hech qanday kompaniya topilmadi.')}
                                        </td>
                                    </tr>
                                ) : (
                                    tenants.data.map((tenant, idx) => (
                                        <tr key={tenant.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="py-3.5 px-4 text-center font-mono text-xs text-muted-foreground">
                                                {((tenants.current_page - 1) * (tenants.per_page || 10)) + idx + 1}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <div className="font-bold text-foreground">{tenant.name}</div>
                                                <div className="text-xs text-muted-foreground font-mono">{tenant.slug}</div>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <button
                                                    type="button"
                                                    onClick={() => viewTenantUsers(tenant.id)}
                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer"
                                                    title={t('admin.viewTenantUsers', 'Ushbu kompaniyaning xodimlarini ko\'rish')}
                                                >
                                                    <Users className="h-3.5 w-3.5" />
                                                    <span>{tenant.users_count} ta xodim</span>
                                                    <ArrowRight className="h-3 w-3" />
                                                </button>
                                            </td>
                                            <td className="py-3.5 px-4 text-xs text-muted-foreground">
                                                <div className="flex items-center gap-3">
                                                    <span title={t('admin.connectedDevices', 'Ulangan telefonlar')} className="flex items-center gap-1 font-mono">
                                                        <Smartphone className="h-3.5 w-3.5 text-blue-500" /> {tenant.devices_count} ta
                                                    </span>
                                                    <span title={t('admin.callsLogged', 'Qo\'ng\'iroqlar')} className="flex items-center gap-1 font-mono">
                                                        <PhoneCall className="h-3.5 w-3.5 text-emerald-500" /> {tenant.calls_count}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-4 text-xs">
                                                <span className="font-semibold block">{tenant.allowed_devices_count} {t('admin.devicesUnit', 'ta telefon')}</span>
                                                <span className="text-muted-foreground font-mono text-[11px]">{tenant.audio_retention_days} {t('admin.archiveUnit', 'kun arxiv')}</span>
                                            </td>
                                            <td className="py-3.5 px-4 text-xs font-mono">
                                                {tenant.subscription_expires_at ? (
                                                    <span className="text-emerald-600 font-semibold">
                                                        {formatDate(tenant.subscription_expires_at)}
                                                    </span>
                                                ) : tenant.trial_ends_at ? (
                                                    <span className="text-amber-600">
                                                        {t('admin.trialPrefix', 'Sinov:')} {formatDate(tenant.trial_ends_at)}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground">{t('admin.unlimited', 'Muddatsiz')}</span>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                {tenant.is_active ? (
                                                    <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded-full font-semibold">
                                                        <CheckCircle2 className="h-3 w-3" /> {t('admin.active', 'Faol')}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-xs bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 px-2 py-0.5 rounded-full font-semibold">
                                                        <XCircle className="h-3 w-3" /> {t('admin.suspended', 'To\'xtatilgan')}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4 text-right">
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditTenant(tenant)}>
                                                    <Edit3 className="h-4 w-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>

                        {/* Pagination */}
                        <PaginationNav
                            links={tenants.links}
                            current_page={tenants.current_page}
                            last_page={tenants.last_page}
                            from={tenants.from}
                            to={tenants.to}
                            total={tenants.total}
                            per_page={tenants.per_page}
                        />
                    </div>
                </div>
            )}

            {/* TAB 2: BARCHA XODIMLAR (USERS) */}
            {activeTab === 'users' && (
                <div className="space-y-4">
                    {/* Filters Bar */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto flex-1">
                            {/* Search */}
                            <div className="relative flex-1 sm:max-w-xs">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    value={searchUsers}
                                    onChange={(e) => setSearchUsers(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleUserFilter(undefined, undefined, searchUsers);
                                        }
                                    }}
                                    placeholder={t('admin.searchUsersPlaceholder', 'Ism, email yoki telefon...')}
                                    className="pl-9 h-9 text-xs"
                                />
                            </div>

                            {/* Role Filter */}
                            <select
                                value={roleFilter}
                                onChange={(e) => {
                                    setRoleFilter(e.target.value);
                                    handleUserFilter(e.target.value, undefined, undefined);
                                }}
                                className="h-9 rounded-md border border-input bg-card px-3 text-xs"
                            >
                                <option value="">{t('admin.allRoles', 'Barcha rollar')}</option>
                                <option value="superadmin">Superadmin</option>
                                <option value="admin">Admin</option>
                                <option value="operator">Operator</option>
                            </select>

                            {/* Tenant Filter */}
                            <select
                                value={tenantFilter}
                                onChange={(e) => {
                                    setTenantFilter(e.target.value);
                                    handleUserFilter(undefined, e.target.value, undefined);
                                }}
                                className="h-9 rounded-md border border-input bg-card px-3 text-xs max-w-[200px]"
                            >
                                <option value="">{t('admin.allTenantsFilter', 'Barcha kompaniyalar')}</option>
                                {allTenants.map((item) => (
                                    <option key={item.id} value={item.id}>{item.name}</option>
                                ))}
                            </select>

                            {/* Clear Filter Button if active */}
                            {(roleFilter || tenantFilter || searchUsers) && (
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    className="h-9 text-xs"
                                    onClick={() => {
                                        setRoleFilter('');
                                        setTenantFilter('');
                                        setSearchUsers('');
                                        handleUserFilter('', '', '');
                                    }}
                                >
                                    {t('admin.resetFilter', 'Tozalash')}
                                </Button>
                            )}
                        </div>

                        <div className="text-xs text-muted-foreground">
                            {t('admin.totalUsers', 'Jami xodimlar')}: <b>{users.total} ta</b>
                        </div>
                    </div>

                    {/* Users Table */}
                    <div className="bg-card rounded-2xl border border-border shadow-xs overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-muted/50 border-b border-border text-muted-foreground text-xs uppercase font-medium">
                                <tr>
                                    <th className="py-3 px-4 w-12 text-center font-mono">№</th>
                                    <th className="py-3 px-4">{t('admin.user', 'Foydalanuvchi')}</th>
                                    <th className="py-3 px-4">{t('admin.role', 'Roli')}</th>
                                    <th className="py-3 px-4">{t('admin.company', 'Tegishli Kompaniya')}</th>
                                    <th className="py-3 px-4">{t('admin.phone', 'Telefon')}</th>
                                    <th className="py-3 px-4">{t('admin.status', 'Holati')}</th>
                                    <th className="py-3 px-4 text-right">{t('admin.actions', 'Amal')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {users.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-8 text-center text-muted-foreground text-xs">
                                            {t('admin.noUsersFound', 'Hech qanday xodim topilmadi.')}
                                        </td>
                                    </tr>
                                ) : (
                                    users.data.map((u, idx) => (
                                        <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="py-3.5 px-4 text-center font-mono text-xs text-muted-foreground">
                                                {((users.current_page - 1) * (users.per_page || 10)) + idx + 1}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <div className="font-bold text-foreground">{u.name}</div>
                                                <div className="text-xs text-muted-foreground font-mono">{u.email}</div>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                                                    u.role === 'superadmin' ? 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300' :
                                                    u.role === 'admin' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300' :
                                                    'bg-secondary text-secondary-foreground'
                                                }`}>
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 text-xs">
                                                {u.tenant?.name ? (
                                                    <span className="font-medium text-foreground">{u.tenant.name}</span>
                                                ) : (
                                                    <span className="text-muted-foreground italic">Global / Superadmin</span>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4 text-xs font-mono">
                                                {u.phone_number || '—'}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                {u.is_active ? (
                                                    <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                                                        <CheckCircle2 className="h-3.5 w-3.5" /> {t('admin.active', 'Faol')}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-xs text-red-600 font-medium">
                                                        <XCircle className="h-3.5 w-3.5" /> {t('admin.blocked', 'Bloklangan')}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4 text-right">
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditUser(u)}>
                                                    <Edit3 className="h-4 w-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>

                        {/* Pagination */}
                        <PaginationNav
                            links={users.links}
                            current_page={users.current_page}
                            last_page={users.last_page}
                            from={users.from}
                            to={users.to}
                            total={users.total}
                            per_page={users.per_page}
                        />
                    </div>
                </div>
            )}

            {/* EDIT TENANT MODAL */}
            {editingTenant && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <form onSubmit={handleUpdateTenant} className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4">
                        <h3 className="text-lg font-bold">{t('admin.editTenantTitle', 'Kompaniya parametrlarini tahrirlash')}</h3>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold">{t('admin.tenantName', 'Nomi')}</label>
                            <Input
                                value={tenantForm.data.name}
                                onChange={(e) => tenantForm.setData('name', e.target.value)}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold">{t('admin.allowedDevices', 'Ruxsat etilgan telefonlar')}</label>
                                <Input
                                    type="number"
                                    min={1}
                                    value={tenantForm.data.allowed_devices_count}
                                    onChange={(e) => tenantForm.setData('allowed_devices_count', Number(e.target.value))}
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold">{t('admin.archiveRetentionDays', 'Arxiv muddati (kun)')}</label>
                                <Input
                                    type="number"
                                    value={tenantForm.data.audio_retention_days}
                                    onChange={(e) => tenantForm.setData('audio_retention_days', Number(e.target.value))}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold">{t('admin.subscriptionExpiryDate', 'Obuna tugash sanasi')}</label>
                            <Input
                                type="date"
                                value={tenantForm.data.subscription_expires_at}
                                onChange={(e) => tenantForm.setData('subscription_expires_at', e.target.value)}
                            />
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                            <input
                                type="checkbox"
                                id="tenantActive"
                                checked={tenantForm.data.is_active}
                                onChange={(e) => tenantForm.setData('is_active', e.target.checked)}
                                className="rounded text-primary h-4 w-4"
                            />
                            <label htmlFor="tenantActive" className="text-xs font-medium">
                                {t('admin.tenantActiveLabel', 'Kompaniya faol (Xizmat yoqilgan)')}
                            </label>
                        </div>

                        <div className="flex gap-2 pt-2">
                            <Button type="button" variant="outline" className="flex-1" onClick={() => setEditingTenant(null)}>
                                {t('admin.cancel', 'Bekor qilish')}
                            </Button>
                            <Button type="submit" className="flex-1" disabled={tenantForm.processing}>
                                {t('admin.save', 'Saqlash')}
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            {/* EDIT USER MODAL */}
            {editingUser && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <form onSubmit={handleUpdateUser} className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4">
                        <h3 className="text-lg font-bold">{t('admin.editUserTitle', 'Foydalanuvchini tahrirlash')}: {editingUser.name}</h3>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold">{t('admin.systemRole', 'Tizim roli')}</label>
                            <select
                                value={userForm.data.role}
                                onChange={(e) => userForm.setData('role', e.target.value)}
                                className="h-9 w-full rounded-md border border-input bg-card px-3 text-xs"
                            >
                                <option value="operator">{t('admin.roleOperator', 'Operator (Faqat o\'z qo\'ng\'iroqlari)')}</option>
                                <option value="admin">{t('admin.roleAdmin', 'Admin (Kompaniya rahbari)')}</option>
                                <option value="superadmin">{t('admin.roleSuperadmin', 'Superadmin (Platforma egasi)')}</option>
                            </select>
                        </div>

                        {userForm.data.role !== 'superadmin' && (
                            <div className="space-y-1">
                                <label className="text-xs font-semibold">{t('admin.assignedCompany', 'Biriktirilgan Kompaniya')}</label>
                                <select
                                    value={userForm.data.tenant_id}
                                    onChange={(e) => userForm.setData('tenant_id', e.target.value)}
                                    className="h-9 w-full rounded-md border border-input bg-card px-3 text-xs"
                                >
                                    <option value="">{t('admin.selectPlaceholder', 'Tanlang...')}</option>
                                    {allTenants.map((tItem) => (
                                        <option key={tItem.id} value={tItem.id}>{tItem.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="space-y-1">
                            <label className="text-xs font-semibold">{t('admin.newPasswordOptional', 'Yangi parol (ixtiyoriy)')}</label>
                            <Input
                                type="password"
                                placeholder={t('admin.passwordPlaceholder', 'Parolni o\'zgartirish uchun kiriting...')}
                                value={userForm.data.password}
                                onChange={(e) => userForm.setData('password', e.target.value)}
                            />
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                            <input
                                type="checkbox"
                                id="userActive"
                                checked={userForm.data.is_active}
                                onChange={(e) => userForm.setData('is_active', e.target.checked)}
                                className="rounded text-primary h-4 w-4"
                            />
                            <label htmlFor="userActive" className="text-xs font-medium">
                                {t('admin.userActive', 'Foydalanuvchi faol')}
                            </label>
                        </div>

                        <div className="flex gap-2 pt-2">
                            <Button type="button" variant="outline" className="flex-1" onClick={() => setEditingUser(null)}>
                                {t('admin.cancel', 'Bekor qilish')}
                            </Button>
                            <Button type="submit" className="flex-1" disabled={userForm.processing}>
                                {t('admin.save', 'Saqlash')}
                            </Button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
