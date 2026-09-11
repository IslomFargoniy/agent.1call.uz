import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Head, useForm, router } from '@inertiajs/react';
import {
    Users,
    Edit3,
    Search,
    Shield,
    CheckCircle2,
    XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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

interface UsersProps {
    users: {
        data: UserItem[];
        current_page: number;
        last_page: number;
        total: number;
    };
    tenants: { id: number; name: string }[];
    filters: { search?: string; role?: string };
}

export default function AdminUsers({ users, tenants, filters }: UsersProps) {
    const { t } = useTranslation();
    const [search, setSearch] = useState(filters.search || '');
    const [roleFilter, setRoleFilter] = useState(filters.role || '');
    const [editingUser, setEditingUser] = useState<UserItem | null>(null);

    const { data, setData, put, processing } = useForm({
        role: 'operator',
        tenant_id: '',
        is_active: true,
        password: '',
    });

    const openEdit = (user: UserItem) => {
        setEditingUser(user);
        setData({
            role: user.role,
            tenant_id: user.tenant_id ? String(user.tenant_id) : '',
            is_active: user.is_active,
            password: '',
        });
    };

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;
        put(`/admin/users/${editingUser.id}`, {
            onSuccess: () => setEditingUser(null),
        });
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/admin/users', { search: search || undefined, role: roleFilter || undefined });
    };

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            <Head title={t("admin.usersHead", "Superadmin — Foydalanuvchilar")} />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">{t("admin.usersTitle", "Foydalanuvchilar Boshqaruvi")}</h2>
                    <p className="text-sm text-muted-foreground">
                        Barcha kompaniyalar rahbarlari, xodimlari va tizim administratorlari
                    </p>
                </div>

                <form onSubmit={handleSearch} className="flex gap-2">
                    <Input
                        placeholder="Ism yoki email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="h-9 w-52 text-xs"
                    />
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="h-9 rounded-md border border-input bg-transparent px-3 text-xs"
                    >
                        <option value="">{t("admin.allRoles", "Barcha rollar")}</option>
                        <option value="superadmin">Superadmin</option>
                        <option value="admin">Admin</option>
                        <option value="operator">Operator</option>
                    </select>
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
                            <th className="py-3 px-4">{t("admin.user", "Foydalanuvchi")}</th>
                            <th className="py-3 px-4">{t("admin.role", "Rol")}</th>
                            <th className="py-3 px-4">{t("admin.company", "Kompaniya")}</th>
                            <th className="py-3 px-4">{t("admin.phone", "Telefon")}</th>
                            <th className="py-3 px-4">{t("admin.status", "Holati")}</th>
                            <th className="py-3 px-4 text-right">{t("admin.actions", "Amal")}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {users.data.map((u) => (
                            <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                                <td className="py-3.5 px-4">
                                    <div className="font-bold">{u.name}</div>
                                    <div className="text-xs text-muted-foreground">{u.email}</div>
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
                                    {u.tenant?.name || <span className="text-muted-foreground italic">Global / Superadmin</span>}
                                </td>
                                <td className="py-3.5 px-4 text-xs font-mono">
                                    {u.phone_number || '—'}
                                </td>
                                <td className="py-3.5 px-4">
                                    {u.is_active ? (
                                        <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                                            <CheckCircle2 className="h-3.5 w-3.5" /> {t("admin.active", "Faol")}
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 text-xs text-red-600 font-medium">
                                            <XCircle className="h-3.5 w-3.5" /> {t("admin.blocked", "Bloklangan")}
                                        </span>
                                    )}
                                </td>
                                <td className="py-3.5 px-4 text-right">
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(u)}>
                                        <Edit3 className="h-4 w-4" />
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Edit Modal */}
            {editingUser && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <form onSubmit={handleUpdate} className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4">
                        <h3 className="text-lg font-bold">{t("admin.editUserTitle", "Foydalanuvchini tahrirlash")}: {editingUser.name}</h3>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold">{t("admin.systemRole", "Tizim roli")}</label>
                            <select
                                value={data.role}
                                onChange={(e) => setData('role', e.target.value)}
                                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-xs"
                            >
                                <option value="operator">{t("admin.roleOperator", "Operator (Faqat o'z qo'ng'iroqlari)")}</option>
                                <option value="admin">{t("admin.roleAdmin", "Admin (Kompaniya rahbari)")}</option>
                                <option value="superadmin">{t("admin.roleSuperadmin", "Superadmin (Platforma egasi)")}</option>
                            </select>
                        </div>

                        {data.role !== 'superadmin' && (
                            <div className="space-y-1">
                                <label className="text-xs font-semibold">{t("admin.assignedCompany", "Biriktirilgan Kompaniya")}</label>
                                <select
                                    value={data.tenant_id}
                                    onChange={(e) => setData('tenant_id', e.target.value)}
                                    className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-xs"
                                >
                                    <option value="">{t("admin.selectPlaceholder", "Tanlang...")}</option>
                                    {tenants.map((t) => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="space-y-1">
                            <label className="text-xs font-semibold">{t("admin.newPasswordOptional", "Yangi parol (ixtiyoriy)")}</label>
                            <Input
                                type="password"
                                placeholder={t("admin.passwordPlaceholder", "Parolni o'zgartirish uchun kiriting...")}
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                            />
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                            <input
                                type="checkbox"
                                id="userActive"
                                checked={data.is_active}
                                onChange={(e) => setData('is_active', e.target.checked)}
                                className="rounded text-primary h-4 w-4"
                            />
                            <label htmlFor="userActive" className="text-xs font-medium">
                                {t("admin.userActive", "Foydalanuvchi faol")}
                            </label>
                        </div>

                        <div className="flex gap-2 pt-2">
                            <Button type="button" variant="outline" className="flex-1" onClick={() => setEditingUser(null)}>
                                {t("admin.cancel", "Bekor qilish")}
                            </Button>
                            <Button type="submit" className="flex-1" disabled={processing}>
                                {t("admin.save", "Saqlash")}
                            </Button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
