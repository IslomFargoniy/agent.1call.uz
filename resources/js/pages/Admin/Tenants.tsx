import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Head, useForm, router } from '@inertiajs/react';
import {
    Building2,
    Edit3,
    Search,
    CheckCircle2,
    XCircle,
    Smartphone,
    PhoneCall,
    Filter,
    ArrowRight,
    KeyRound,
    UserPlus,
    Clock,
    Mail,
    Phone,
    Trash2,
    LogIn,
    Shield,
    Sparkles,
    AlertCircle,
    Copy,
    Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PaginationNav, PaginationLink } from '@/components/ui/pagination-nav';
import { formatDate } from '@/lib/datetime';

interface OwnerUser {
    id: number;
    tenant_id: number;
    name: string;
    email: string;
    phone_number?: string;
    role: string;
    is_active: boolean;
    created_at: string;
}

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
    devices_count: number;
    calls_count: number;
    users?: OwnerUser[];
    created_at?: string;
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

interface CustomersProps {
    tenants: PaginatedData<TenantItem>;
    filters: {
        search?: string;
        status?: string;
        per_page?: number | string;
    };
}

export default function Tenants({
    tenants,
    filters,
}: CustomersProps) {
    const { t } = useTranslation();

    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [perPage, setPerPage] = useState<string>(String(filters.per_page || 10));

    // Modals
    const [editingTenant, setEditingTenant] = useState<TenantItem | null>(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [deletingTenant, setDeletingTenant] = useState<TenantItem | null>(null);
    const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

    // Edit form
    const editForm = useForm({
        name: '',
        allowed_devices_count: 3,
        audio_retention_days: 30,
        subscription_expires_at: '',
        trial_ends_at: '',
        is_active: true,
        owner_name: '',
        owner_email: '',
        owner_phone: '',
        new_password: '',
    });

    // Create form
    const createForm = useForm({
        name: '',
        owner_name: '',
        owner_email: '',
        owner_phone: '',
        password: '',
        allowed_devices_count: 3,
        audio_retention_days: 30,
        trial_days: 14,
        is_active: true,
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/admin/tenants', {
            search: search || undefined,
            status: statusFilter !== 'all' ? statusFilter : undefined,
            per_page: perPage,
        }, { preserveState: true });
    };

    const handleStatusChange = (status: string) => {
        setStatusFilter(status);
        router.get('/admin/tenants', {
            search: search || undefined,
            status: status !== 'all' ? status : undefined,
            per_page: perPage,
        }, { preserveState: true });
    };

    const handlePerPageChange = (val: string) => {
        setPerPage(val);
        router.get('/admin/tenants', {
            search: search || undefined,
            status: statusFilter !== 'all' ? statusFilter : undefined,
            per_page: val,
        }, { preserveState: true });
    };

    const openEditModal = (tenant: TenantItem) => {
        setEditingTenant(tenant);
        const owner = tenant.users?.[0];
        editForm.setData({
            name: tenant.name,
            allowed_devices_count: tenant.allowed_devices_count,
            audio_retention_days: tenant.audio_retention_days,
            subscription_expires_at: tenant.subscription_expires_at ? tenant.subscription_expires_at.substring(0, 10) : '',
            trial_ends_at: tenant.trial_ends_at ? tenant.trial_ends_at.substring(0, 10) : '',
            is_active: tenant.is_active,
            owner_name: owner?.name || '',
            owner_email: owner?.email || '',
            owner_phone: owner?.phone_number || '',
            new_password: '',
        });
    };

    const handleUpdateCustomer = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTenant) return;
        editForm.put(`/admin/tenants/${editingTenant.id}`, {
            onSuccess: () => setEditingTenant(null),
        });
    };

    const handleCreateCustomer = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post('/admin/tenants', {
            onSuccess: () => {
                setIsCreateOpen(false);
                createForm.reset();
            },
        });
    };

    const handleDeleteCustomer = () => {
        if (!deletingTenant) return;
        router.delete(`/admin/tenants/${deletingTenant.id}`, {
            onSuccess: () => setDeletingTenant(null),
        });
    };

    const handleSelectTenant = (tenantId: number) => {
        router.post('/api/superadmin/select-tenant', { tenant_id: tenantId });
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedEmail(text);
        setTimeout(() => setCopiedEmail(null), 2000);
    };

    return (
        <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
            <Head title="Mijozlar (Kompaniyalar)" />

            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
                <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-2">
                        <Building2 className="h-3.5 w-3.5" />
                        <span>Mijozlar boshqaruvi</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                        Mijozlar (Kompaniyalar)
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Tizimdagi barcha biznes mijozlar, obuna muddatlari, ulangan telefonlar va kontakt ma'lumotlari
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        type="button"
                        onClick={() => setIsCreateOpen(true)}
                        className="rounded-xl gap-2 font-medium shadow-sm hover:shadow"
                    >
                        <UserPlus className="h-4 w-4" />
                        <span>Yangi mijoz qo‘shish</span>
                    </Button>
                </div>
            </div>

            {/* Filters Bar: Search & Status Pills & Per Page */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center bg-card/60 border border-border/80 p-3.5 sm:p-4 rounded-2xl backdrop-blur-xs">
                {/* Search Form */}
                <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Kompaniya, egasi, email yoki telefon bo‘yicha qidirish..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 h-10 rounded-xl bg-background border-border/70"
                        />
                    </div>
                    <Button type="submit" variant="secondary" className="h-10 rounded-xl px-4">
                        <Filter className="h-4 w-4 sm:mr-1.5" />
                        <span className="hidden sm:inline">Qidirish</span>
                    </Button>
                </form>

                {/* Status Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                    {[
                        { id: 'all', label: 'Barchasi' },
                        { id: 'active', label: 'Faol obuna' },
                        { id: 'trial', label: '14 kunlik Trial' },
                        { id: 'expired', label: 'Tugagan' },
                        { id: 'inactive', label: 'Nofaol' },
                    ].map((st) => (
                        <button
                            key={st.id}
                            type="button"
                            onClick={() => handleStatusChange(st.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                                statusFilter === st.id
                                    ? 'bg-primary text-primary-foreground shadow-xs'
                                    : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
                            }`}
                        >
                            {st.label}
                        </button>
                    ))}
                </div>

                {/* Per page selector */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
                    <span>Ko‘rsatish:</span>
                    <select
                        value={perPage}
                        onChange={(e) => handlePerPageChange(e.target.value)}
                        className="bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                        <option value="10">10 ta</option>
                        <option value="30">30 ta</option>
                        <option value="50">50 ta</option>
                        <option value="all">Barchasi</option>
                    </select>
                </div>
            </div>

            {/* Customers Table */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-muted/50 border-b border-border text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                            <tr>
                                <th className="px-4 py-3.5 w-12 text-center">#</th>
                                <th className="px-4 py-3.5">Mijoz & Kompaniya</th>
                                <th className="px-4 py-3.5">Kontaktlar (Egasi)</th>
                                <th className="px-4 py-3.5">Obuna & Holat</th>
                                <th className="px-4 py-3.5">Telefonlar & Audio</th>
                                <th className="px-4 py-3.5 text-center">Faollik</th>
                                <th className="px-4 py-3.5 text-right">Amallar</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                            {tenants.data.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                                        <Building2 className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
                                        <p className="font-medium">Birorta ham mijoz topilmadi</p>
                                        <p className="text-xs text-muted-foreground/70 mt-1">
                                            Qidiruv filtrlarini o‘zgartirib ko‘ring yoki yangi mijoz qo‘shing
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                tenants.data.map((tItem, index) => {
                                    const rowNumber = ((tenants.current_page - 1) * (typeof tenants.per_page === 'number' ? tenants.per_page : 10)) + index + 1;
                                    const owner = tItem.users?.[0];

                                    // Subscription status calculation
                                    const now = new Date();
                                    const subDate = tItem.subscription_expires_at ? new Date(tItem.subscription_expires_at) : null;
                                    const trialDate = tItem.trial_ends_at ? new Date(tItem.trial_ends_at) : null;

                                    const isSubActive = subDate && subDate > now;
                                    const isTrialActive = !isSubActive && trialDate && trialDate > now;
                                    const isExpired = (!isSubActive && !isTrialActive);

                                    return (
                                        <tr key={tItem.id} className="hover:bg-accent/30 transition-colors group">
                                            {/* Row # */}
                                            <td className="px-4 py-4 text-center font-mono text-xs text-muted-foreground/80">
                                                {rowNumber}
                                            </td>

                                            {/* Company & Owner Info */}
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20 flex items-center justify-center font-bold text-primary text-sm shadow-2xs">
                                                        {tItem.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                                                            {tItem.name}
                                                        </span>
                                                        <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                                                            <span>Egasi: <strong className="text-foreground/90 font-medium">{owner?.name || 'Biriktirilmagan'}</strong></span>
                                                            <span className="text-border">•</span>
                                                            <span className="font-mono text-[11px] text-muted-foreground/70">@{tItem.slug}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Contacts */}
                                            <td className="px-4 py-4 text-xs">
                                                <div className="flex flex-col gap-1">
                                                    {(owner?.email || tItem.slug) && (
                                                        <div className="flex items-center gap-1.5 text-muted-foreground">
                                                            <Mail className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
                                                            <span className="text-foreground/90 font-medium truncate max-w-[170px]">
                                                                {owner?.email || `${tItem.slug}@1call.uz`}
                                                            </span>
                                                            {owner?.email && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => copyToClipboard(owner.email)}
                                                                    className="text-muted-foreground/50 hover:text-foreground transition-colors p-0.5"
                                                                    title="Emailni nusxalash"
                                                                >
                                                                    {copiedEmail === owner.email ? (
                                                                        <Check className="h-3 w-3 text-emerald-500" />
                                                                    ) : (
                                                                        <Copy className="h-3 w-3" />
                                                                    )}
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                                        <Phone className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
                                                        <span>{owner?.phone_number || 'Telefon kiritilmagan'}</span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Subscription & Status */}
                                            <td className="px-4 py-4">
                                                <div className="flex flex-col gap-1 items-start">
                                                    {!tItem.is_active ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-500/10 text-zinc-500 border border-zinc-500/20">
                                                            <XCircle className="h-3 w-3" />
                                                            Nofaol / Bloklangan
                                                        </span>
                                                    ) : isSubActive ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                                            <CheckCircle2 className="h-3 w-3" />
                                                            Faol obuna
                                                        </span>
                                                    ) : isTrialActive ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                                            <Sparkles className="h-3 w-3" />
                                                            14 kunlik Trial
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                                            <AlertCircle className="h-3 w-3" />
                                                            Muddati tugagan
                                                        </span>
                                                    )}

                                                    <span className="text-[11px] text-muted-foreground mt-0.5">
                                                        {isSubActive && subDate && `Muddat: ${formatDate(tItem.subscription_expires_at!)} gacha`}
                                                        {isTrialActive && trialDate && `Trial: ${formatDate(tItem.trial_ends_at!)} gacha`}
                                                        {isExpired && (subDate ? `Tugadi: ${formatDate(tItem.subscription_expires_at!)}` : (trialDate ? `Trial tugadi: ${formatDate(tItem.trial_ends_at!)}` : 'Obuna yo‘q'))}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Devices & Audio */}
                                            <td className="px-4 py-4 text-xs">
                                                <div className="flex flex-col gap-1.5">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="flex items-center gap-1.5 font-medium text-foreground">
                                                            <Smartphone className="h-3.5 w-3.5 text-primary" />
                                                            {tItem.devices_count} / {tItem.allowed_devices_count} ta telefon
                                                        </span>
                                                    </div>

                                                    {/* Progress bar */}
                                                    <div className="w-28 h-1.5 rounded-full bg-muted overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all ${
                                                                tItem.devices_count >= tItem.allowed_devices_count
                                                                    ? 'bg-amber-500'
                                                                    : 'bg-primary'
                                                            }`}
                                                            style={{
                                                                width: `${Math.min(100, Math.round((tItem.devices_count / Math.max(1, tItem.allowed_devices_count)) * 100))}%`,
                                                            }}
                                                        />
                                                    </div>

                                                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                                        <Clock className="h-3 w-3 text-muted-foreground/60" />
                                                        Audio arxiv: {tItem.audio_retention_days} kun
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Activity (Calls & Created) */}
                                            <td className="px-4 py-4 text-center text-xs">
                                                <div className="inline-flex flex-col items-center">
                                                    <span className="font-bold text-foreground flex items-center gap-1 text-sm">
                                                        <PhoneCall className="h-3.5 w-3.5 text-emerald-500" />
                                                        {tItem.calls_count.toLocaleString()}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground mt-0.5">
                                                        jami qo‘ng‘iroq
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-4 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {/* Switch to this tenant */}
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleSelectTenant(tItem.id)}
                                                        className="h-8 px-2.5 rounded-lg text-xs gap-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                                        title="Kompaniya nomidan kirish"
                                                    >
                                                        <LogIn className="h-3.5 w-3.5" />
                                                        <span className="hidden lg:inline">Kirish</span>
                                                    </Button>

                                                    {/* Edit Customer */}
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => openEditModal(tItem)}
                                                        className="h-8 px-2.5 rounded-lg text-xs gap-1.5 border-border hover:border-primary/50 hover:bg-accent"
                                                    >
                                                        <Edit3 className="h-3.5 w-3.5 text-primary" />
                                                        <span>Tahrirlash</span>
                                                    </Button>

                                                    {/* Delete Customer */}
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => setDeletingTenant(tItem)}
                                                        className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10"
                                                        title="Mijozni o‘chirish"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {tenants.links && tenants.links.length > 3 && (
                    <div className="p-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
                        <div>
                            Jami <strong>{tenants.total}</strong> ta mijozdan {tenants.from || 0}-{tenants.to || 0} ko‘rsatilmoqda
                        </div>
                        <PaginationNav links={tenants.links} />
                    </div>
                )}
            </div>

            {/* EDIT CUSTOMER MODAL */}
            {editingTenant && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-150">
                    <div className="bg-card border border-border w-full max-w-2xl rounded-2xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-border pb-4">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                                    <Building2 className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-foreground">
                                        Mijozni tahrirlash: {editingTenant.name}
                                    </h3>
                                    <p className="text-xs text-muted-foreground">
                                        Kompaniya parametrlari va egasining login ma'lumotlarini o‘zgartirish
                                    </p>
                                </div>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingTenant(null)}
                                className="h-8 w-8 p-0 rounded-lg"
                            >
                                <XCircle className="h-5 w-5 text-muted-foreground" />
                            </Button>
                        </div>

                        <form onSubmit={handleUpdateCustomer} className="space-y-4 text-sm">
                            {/* Company Section */}
                            <div className="rounded-xl border border-border/70 p-4 bg-muted/20 space-y-3">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                    <Building2 className="h-3.5 w-3.5 text-primary" />
                                    <span>Kompaniya Ma'lumotlari</span>
                                </h4>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-foreground">Kompaniya nomi</label>
                                        <Input
                                            value={editForm.data.name}
                                            onChange={(e) => editForm.setData('name', e.target.value)}
                                            required
                                            className="h-9 rounded-lg"
                                        />
                                        {editForm.errors.name && (
                                            <span className="text-xs text-rose-500">{editForm.errors.name}</span>
                                        )}
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-foreground">Kompaniya Holati</label>
                                        <select
                                            value={editForm.data.is_active ? '1' : '0'}
                                            onChange={(e) => editForm.setData('is_active', e.target.value === '1')}
                                            className="w-full h-9 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                        >
                                            <option value="1">Faol (Active)</option>
                                            <option value="0">Nofaol / Bloklangan (Inactive)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-foreground">
                                            Ruxsat berilgan telefonlar (Limit)
                                        </label>
                                        <Input
                                            type="number"
                                            min="1"
                                            max="500"
                                            value={editForm.data.allowed_devices_count}
                                            onChange={(e) => editForm.setData('allowed_devices_count', Number(e.target.value))}
                                            required
                                            className="h-9 rounded-lg"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-foreground">
                                            Audio saqlash muddati
                                        </label>
                                        <select
                                            value={editForm.data.audio_retention_days}
                                            onChange={(e) => editForm.setData('audio_retention_days', Number(e.target.value))}
                                            className="w-full h-9 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                        >
                                            <option value="30">30 kun (Standart)</option>
                                            <option value="60">60 kun (2 oy)</option>
                                            <option value="90">90 kun (3 oy)</option>
                                            <option value="180">180 kun (6 oy)</option>
                                            <option value="365">365 kun (1 yil)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-foreground">
                                            14 kunlik Trial tugash sanasi
                                        </label>
                                        <Input
                                            type="date"
                                            value={editForm.data.trial_ends_at}
                                            onChange={(e) => editForm.setData('trial_ends_at', e.target.value)}
                                            className="h-9 rounded-lg"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-foreground">
                                            Pullik Obuna tugash sanasi
                                        </label>
                                        <Input
                                            type="date"
                                            value={editForm.data.subscription_expires_at}
                                            onChange={(e) => editForm.setData('subscription_expires_at', e.target.value)}
                                            className="h-9 rounded-lg"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Owner Account Section */}
                            <div className="rounded-xl border border-border/70 p-4 bg-muted/20 space-y-3">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                    <Shield className="h-3.5 w-3.5 text-blue-500" />
                                    <span>Mijoz Egasining Login Ma'lumotlari</span>
                                </h4>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-foreground">Egasining to‘liq ismi</label>
                                        <Input
                                            value={editForm.data.owner_name}
                                            onChange={(e) => editForm.setData('owner_name', e.target.value)}
                                            placeholder="Ism Familiya"
                                            className="h-9 rounded-lg"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-foreground">Email (Login)</label>
                                        <Input
                                            type="email"
                                            value={editForm.data.owner_email}
                                            onChange={(e) => editForm.setData('owner_email', e.target.value)}
                                            placeholder="email@example.com"
                                            className="h-9 rounded-lg"
                                        />
                                        {editForm.errors.owner_email && (
                                            <span className="text-xs text-rose-500">{editForm.errors.owner_email}</span>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-foreground">Telefon raqami</label>
                                        <Input
                                            value={editForm.data.owner_phone}
                                            onChange={(e) => editForm.setData('owner_phone', e.target.value)}
                                            placeholder="+998 90 123 45 67"
                                            className="h-9 rounded-lg"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-foreground flex items-center gap-1">
                                            <KeyRound className="h-3 w-3 text-amber-500" />
                                            <span>Yangi parol qo‘yish</span>
                                        </label>
                                        <Input
                                            type="text"
                                            placeholder="O‘zgartirmaslik uchun bo‘sh qoldiring"
                                            value={editForm.data.new_password}
                                            onChange={(e) => editForm.setData('new_password', e.target.value)}
                                            className="h-9 rounded-lg"
                                        />
                                        {editForm.errors.new_password && (
                                            <span className="text-xs text-rose-500">{editForm.errors.new_password}</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t border-border">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setEditingTenant(null)}
                                    className="rounded-xl h-10"
                                >
                                    Bekor qilish
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={editForm.processing}
                                    className="rounded-xl h-10 font-medium"
                                >
                                    {editForm.processing ? 'Saqlanmoqda...' : 'O‘zgarishlarni saqlash'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* CREATE NEW CUSTOMER MODAL */}
            {isCreateOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-150">
                    <div className="bg-card border border-border w-full max-w-xl rounded-2xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-border pb-4">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                    <UserPlus className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-foreground">
                                        Yangi mijoz qo‘shish
                                    </h3>
                                    <p className="text-xs text-muted-foreground">
                                        Kompaniya va uning egasi uchun yagona tizim hisobini ochish
                                    </p>
                                </div>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsCreateOpen(false)}
                                className="h-8 w-8 p-0 rounded-lg"
                            >
                                <XCircle className="h-5 w-5 text-muted-foreground" />
                            </Button>
                        </div>

                        <form onSubmit={handleCreateCustomer} className="space-y-4 text-sm">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-foreground">Kompaniya yoki Biznes nomi</label>
                                <Input
                                    value={createForm.data.name}
                                    onChange={(e) => createForm.setData('name', e.target.value)}
                                    placeholder="Masalan: Smart Group MChJ"
                                    required
                                    className="h-10 rounded-xl"
                                />
                                {createForm.errors.name && (
                                    <span className="text-xs text-rose-500">{createForm.errors.name}</span>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-foreground">Egasining to‘liq ismi</label>
                                    <Input
                                        value={createForm.data.owner_name}
                                        onChange={(e) => createForm.setData('owner_name', e.target.value)}
                                        placeholder="Ism Familiya"
                                        required
                                        className="h-10 rounded-xl"
                                    />
                                    {createForm.errors.owner_name && (
                                        <span className="text-xs text-rose-500">{createForm.errors.owner_name}</span>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-foreground">Email (Login)</label>
                                    <Input
                                        type="email"
                                        value={createForm.data.owner_email}
                                        onChange={(e) => createForm.setData('owner_email', e.target.value)}
                                        placeholder="mijoz@example.com"
                                        required
                                        className="h-10 rounded-xl"
                                    />
                                    {createForm.errors.owner_email && (
                                        <span className="text-xs text-rose-500">{createForm.errors.owner_email}</span>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-foreground">Telefon raqami</label>
                                    <Input
                                        value={createForm.data.owner_phone}
                                        onChange={(e) => createForm.setData('owner_phone', e.target.value)}
                                        placeholder="+998 90 123 45 67"
                                        className="h-10 rounded-xl"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                                        <KeyRound className="h-3 w-3 text-amber-500" />
                                        <span>Boshlang‘ich parol</span>
                                    </label>
                                    <Input
                                        type="text"
                                        value={createForm.data.password}
                                        onChange={(e) => createForm.setData('password', e.target.value)}
                                        placeholder="Kamida 8 ta belgi"
                                        required
                                        className="h-10 rounded-xl"
                                    />
                                    {createForm.errors.password && (
                                        <span className="text-xs text-rose-500">{createForm.errors.password}</span>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-foreground">Telefonlar limiti</label>
                                    <Input
                                        type="number"
                                        min="1"
                                        max="500"
                                        value={createForm.data.allowed_devices_count}
                                        onChange={(e) => createForm.setData('allowed_devices_count', Number(e.target.value))}
                                        required
                                        className="h-10 rounded-xl"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-foreground">Audio saqlash</label>
                                    <select
                                        value={createForm.data.audio_retention_days}
                                        onChange={(e) => createForm.setData('audio_retention_days', Number(e.target.value))}
                                        className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                                    >
                                        <option value="30">30 kun</option>
                                        <option value="60">60 kun</option>
                                        <option value="90">90 kun</option>
                                        <option value="180">180 kun</option>
                                        <option value="365">365 kun</option>
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-foreground">Bepul Trial (kun)</label>
                                    <Input
                                        type="number"
                                        min="0"
                                        max="365"
                                        value={createForm.data.trial_days}
                                        onChange={(e) => createForm.setData('trial_days', Number(e.target.value))}
                                        className="h-10 rounded-xl"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-border">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsCreateOpen(false)}
                                    className="rounded-xl h-10"
                                >
                                    Bekor qilish
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={createForm.processing}
                                    className="rounded-xl h-10 font-medium"
                                >
                                    {createForm.processing ? 'Qo‘shilmoqda...' : 'Mijozni ro‘yxatdan o‘tkazish'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* DELETE CONFIRMATION MODAL */}
            {deletingTenant && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-150">
                    <div className="bg-card border border-border w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
                        <div className="flex items-center gap-3 text-rose-500">
                            <div className="h-10 w-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                                <Trash2 className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-foreground">
                                    Mijozni o‘chirishni tasdiqlaysizmi?
                                </h3>
                                <p className="text-xs text-rose-500 font-medium">
                                    {deletingTenant.name}
                                </p>
                            </div>
                        </div>

                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Ushbu mijoz o‘chirilganda, unga tegishli barcha telefonlar, qo‘ng‘iroqlar va foydalanuvchi hisoblari butunlay o‘chiriladi. Ushbu amalni ortga qaytarib bo‘lmaydi.
                        </p>

                        <div className="flex justify-end gap-2 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setDeletingTenant(null)}
                                className="rounded-xl h-9"
                            >
                                Bekor qilish
                            </Button>
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={handleDeleteCustomer}
                                className="rounded-xl h-9"
                            >
                                Ha, o‘chirilsin
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
