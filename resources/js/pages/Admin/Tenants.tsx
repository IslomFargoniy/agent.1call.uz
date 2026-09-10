import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import {
    Building2,
    Edit3,
    Search,
    CheckCircle2,
    XCircle,
    Smartphone,
    PhoneCall,
    Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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

interface TenantsProps {
    tenants: {
        data: TenantItem[];
        current_page: number;
        last_page: number;
        total: number;
    };
    filters: { search?: string };
}

export default function AdminTenants({ tenants, filters }: TenantsProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [editingTenant, setEditingTenant] = useState<TenantItem | null>(null);

    const { data, setData, put, processing } = useForm({
        name: '',
        allowed_devices_count: 2,
        audio_retention_days: 30,
        subscription_expires_at: '',
        trial_ends_at: '',
        is_active: true,
    });

    const openEdit = (tenant: TenantItem) => {
        setEditingTenant(tenant);
        setData({
            name: tenant.name,
            allowed_devices_count: tenant.allowed_devices_count,
            audio_retention_days: tenant.audio_retention_days,
            subscription_expires_at: tenant.subscription_expires_at ? tenant.subscription_expires_at.slice(0, 10) : '',
            trial_ends_at: tenant.trial_ends_at ? tenant.trial_ends_at.slice(0, 10) : '',
            is_active: tenant.is_active,
        });
    };

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTenant) return;
        put(`/admin/tenants/${editingTenant.id}`, {
            onSuccess: () => setEditingTenant(null),
        });
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/admin/tenants', { search: search || undefined });
    };

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            <Head title="Superadmin — Kompaniyalar" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Kompaniyalar (Tenants) Boshqaruvi</h2>
                    <p className="text-sm text-muted-foreground">
                        Platformadagi barcha mijoz tashkilotlar va ularning obuna parametrlari
                    </p>
                </div>

                <form onSubmit={handleSearch} className="flex gap-2">
                    <Input
                        placeholder="Kompaniya qidirish..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="h-9 w-64 text-xs"
                    />
                    <Button type="submit" size="sm" className="h-9">
                        <Search className="h-3.5 w-3.5" />
                    </Button>
                </form>
            </div>

            {/* Table */}
            <div className="bg-card rounded-xl border border-border shadow-xs overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-muted/50 border-b border-border text-muted-foreground text-xs uppercase font-medium">
                        <tr>
                            <th className="py-3 px-4">Kompaniya</th>
                            <th className="py-3 px-4">Statistika</th>
                            <th className="py-3 px-4">Limit / Arxiv</th>
                            <th className="py-3 px-4">Obuna muddati</th>
                            <th className="py-3 px-4">Holati</th>
                            <th className="py-3 px-4 text-right">Amal</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {tenants.data.map((tenant) => (
                            <tr key={tenant.id} className="hover:bg-muted/30 transition-colors">
                                <td className="py-3.5 px-4">
                                    <div className="font-bold">{tenant.name}</div>
                                    <div className="text-xs text-muted-foreground font-mono">{tenant.uuid}</div>
                                </td>
                                <td className="py-3.5 px-4 text-xs text-muted-foreground">
                                    <div className="flex items-center gap-3">
                                        <span title="Xodimlar" className="flex items-center gap-1">
                                            <Users className="h-3.5 w-3.5" /> {tenant.users_count}
                                        </span>
                                        <span title="Telefonlar" className="flex items-center gap-1">
                                            <Smartphone className="h-3.5 w-3.5" /> {tenant.devices_count}
                                        </span>
                                        <span title="Qo'ng'iroqlar" className="flex items-center gap-1">
                                            <PhoneCall className="h-3.5 w-3.5" /> {tenant.calls_count}
                                        </span>
                                    </div>
                                </td>
                                <td className="py-3.5 px-4 text-xs">
                                    <span className="font-semibold">{tenant.allowed_devices_count} ta telefon</span>
                                    <span className="block text-muted-foreground">{tenant.audio_retention_days} kun arxiv</span>
                                </td>
                                <td className="py-3.5 px-4 text-xs font-mono">
                                    {tenant.subscription_expires_at ? (
                                        <span className="text-emerald-600 font-semibold">
                                            {new Date(tenant.subscription_expires_at).toLocaleDateString('uz-UZ')}
                                        </span>
                                    ) : tenant.trial_ends_at ? (
                                        <span className="text-amber-600">
                                            Sinov: {new Date(tenant.trial_ends_at).toLocaleDateString('uz-UZ')}
                                        </span>
                                    ) : (
                                        'Muddatsiz'
                                    )}
                                </td>
                                <td className="py-3.5 px-4">
                                    {tenant.is_active ? (
                                        <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded-full font-semibold">
                                            <CheckCircle2 className="h-3 w-3" /> Faol
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 text-xs bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 px-2 py-0.5 rounded-full font-semibold">
                                            <XCircle className="h-3 w-3" /> To'xtatilgan
                                        </span>
                                    )}
                                </td>
                                <td className="py-3.5 px-4 text-right">
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(tenant)}>
                                        <Edit3 className="h-4 w-4" />
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Edit Modal */}
            {editingTenant && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <form onSubmit={handleUpdate} className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4">
                        <h3 className="text-lg font-bold">Kompaniya parametrlarini tahrirlash</h3>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold">Nomi</label>
                            <Input
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold">Ruxsat etilgan telefonlar</label>
                                <Input
                                    type="number"
                                    min={1}
                                    value={data.allowed_devices_count}
                                    onChange={(e) => setData('allowed_devices_count', Number(e.target.value))}
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold">Arxiv muddati (kun)</label>
                                <Input
                                    type="number"
                                    value={data.audio_retention_days}
                                    onChange={(e) => setData('audio_retention_days', Number(e.target.value))}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold">Obuna tugash sanasi</label>
                            <Input
                                type="date"
                                value={data.subscription_expires_at}
                                onChange={(e) => setData('subscription_expires_at', e.target.value)}
                            />
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                            <input
                                type="checkbox"
                                id="tenantActive"
                                checked={data.is_active}
                                onChange={(e) => setData('is_active', e.target.checked)}
                                className="rounded text-primary h-4 w-4"
                            />
                            <label htmlFor="tenantActive" className="text-xs font-medium">
                                Kompaniya faol (Xizmat yoqilgan)
                            </label>
                        </div>

                        <div className="flex gap-2 pt-2">
                            <Button type="button" variant="outline" className="flex-1" onClick={() => setEditingTenant(null)}>
                                Bekor qilish
                            </Button>
                            <Button type="submit" className="flex-1" disabled={processing}>
                                Saqlash
                            </Button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
