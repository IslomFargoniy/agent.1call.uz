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
import { PaginationNav, PaginationLink } from '@/components/ui/pagination-nav';

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
        from: number | null;
        to: number | null;
        per_page: number;
        links: PaginationLink[];
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
        role: 'admin',
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
        router.get('/admin/users', {
            search: search || undefined,
            role: roleFilter || undefined,
        });
    };

    return (
        <div className="mx-auto max-w-7xl space-y-6 p-6">
            <Head
                title={t('admin.usersHead', 'Superadmin — Foydalanuvchilar')}
            />

            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">
                        {t('admin.usersTitle', 'Foydalanuvchilar Boshqaruvi')}
                    </h2>
                    <p className="text-muted-foreground text-sm">
                        Barcha kompaniyalar rahbarlari, xodimlari va tizim
                        administratorlari
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
                        className="border-input h-9 rounded-md border bg-transparent px-3 text-xs"
                    >
                        <option value="">
                            {t('admin.allRoles', 'Barcha rollar')}
                        </option>
                        <option value="superadmin">Superadmin</option>
                        <option value="admin">Admin</option>
                    </select>
                    <Button type="submit" size="sm" className="h-9">
                        <Search className="h-3.5 w-3.5" />
                    </Button>
                </form>
            </div>

            {/* Table */}
            <div className="bg-card border-border overflow-hidden rounded-xl border shadow-xs">
                <table className="w-full text-left text-sm">
                    <thead className="bg-muted/50 border-border text-muted-foreground border-b text-xs font-medium uppercase">
                        <tr>
                            <th className="w-12 px-4 py-3 text-center">№</th>
                            <th className="px-4 py-3">
                                {t('admin.user', 'Foydalanuvchi')}
                            </th>
                            <th className="px-4 py-3">
                                {t('admin.role', 'Rol')}
                            </th>
                            <th className="px-4 py-3">
                                {t('admin.company', 'Kompaniya')}
                            </th>
                            <th className="px-4 py-3">
                                {t('admin.phone', 'Telefon')}
                            </th>
                            <th className="px-4 py-3">
                                {t('admin.status', 'Holati')}
                            </th>
                            <th className="px-4 py-3 text-right">
                                {t('admin.actions', 'Amal')}
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-border divide-y">
                        {users.data.map((u, idx) => (
                            <tr
                                key={u.id}
                                className="hover:bg-muted/30 transition-colors"
                            >
                                <td className="text-muted-foreground px-4 py-3.5 text-center font-mono text-xs">
                                    {(users.current_page - 1) *
                                        (users.per_page || 10) +
                                        idx +
                                        1}
                                </td>
                                <td className="px-4 py-3.5">
                                    <div className="font-bold">{u.name}</div>
                                    <div className="text-muted-foreground text-xs">
                                        {u.email}
                                    </div>
                                </td>
                                <td className="px-4 py-3.5">
                                    <span
                                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                            u.role === 'superadmin'
                                                ? 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                                                : u.role === 'admin'
                                                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                                                  : 'bg-secondary text-secondary-foreground'
                                        }`}
                                    >
                                        {u.role}
                                    </span>
                                </td>
                                <td className="px-4 py-3.5 text-xs">
                                    {u.tenant?.name || (
                                        <span className="text-muted-foreground italic">
                                            Global / Superadmin
                                        </span>
                                    )}
                                </td>
                                <td className="px-4 py-3.5 font-mono text-xs">
                                    {u.phone_number || '—'}
                                </td>
                                <td className="px-4 py-3.5">
                                    {u.is_active ? (
                                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                                            <CheckCircle2 className="h-3.5 w-3.5" />{' '}
                                            {t('admin.active', 'Faol')}
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600">
                                            <XCircle className="h-3.5 w-3.5" />{' '}
                                            {t('admin.blocked', 'Bloklangan')}
                                        </span>
                                    )}
                                </td>
                                <td className="px-4 py-3.5 text-right">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => openEdit(u)}
                                    >
                                        <Edit3 className="h-4 w-4" />
                                    </Button>
                                </td>
                            </tr>
                        ))}
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

            {/* Edit Modal */}
            {editingUser && (
                <div className="bg-background/80 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
                    <form
                        onSubmit={handleUpdate}
                        className="bg-card border-border w-full max-w-md space-y-4 rounded-2xl border p-6 shadow-xl"
                    >
                        <h3 className="text-lg font-bold">
                            {t(
                                'admin.editUserTitle',
                                'Foydalanuvchini tahrirlash',
                            )}
                            : {editingUser.name}
                        </h3>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold">
                                {t('admin.systemRole', 'Tizim roli')}
                            </label>
                            <select
                                value={data.role}
                                onChange={(e) =>
                                    setData('role', e.target.value)
                                }
                                className="border-input h-9 w-full rounded-md border bg-transparent px-3 text-xs"
                            >
                                <option value="admin">
                                    {t(
                                        'admin.roleAdmin',
                                        'Admin (Kompaniya rahbari)',
                                    )}
                                </option>
                                <option value="superadmin">
                                    {t(
                                        'admin.roleSuperadmin',
                                        'Superadmin (Platforma egasi)',
                                    )}
                                </option>
                            </select>
                        </div>

                        {data.role !== 'superadmin' && (
                            <div className="space-y-1">
                                <label className="text-xs font-semibold">
                                    {t(
                                        'admin.assignedCompany',
                                        'Biriktirilgan Kompaniya',
                                    )}
                                </label>
                                <select
                                    value={data.tenant_id}
                                    onChange={(e) =>
                                        setData('tenant_id', e.target.value)
                                    }
                                    className="border-input h-9 w-full rounded-md border bg-transparent px-3 text-xs"
                                >
                                    <option value="">
                                        {t(
                                            'admin.selectPlaceholder',
                                            'Tanlang...',
                                        )}
                                    </option>
                                    {tenants.map((t) => (
                                        <option key={t.id} value={t.id}>
                                            {t.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="space-y-1">
                            <label className="text-xs font-semibold">
                                {t(
                                    'admin.newPasswordOptional',
                                    'Yangi parol (ixtiyoriy)',
                                )}
                            </label>
                            <Input
                                type="password"
                                placeholder={t(
                                    'admin.passwordPlaceholder',
                                    "Parolni o'zgartirish uchun kiriting...",
                                )}
                                value={data.password}
                                onChange={(e) =>
                                    setData('password', e.target.value)
                                }
                            />
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                            <input
                                type="checkbox"
                                id="userActive"
                                checked={data.is_active}
                                onChange={(e) =>
                                    setData('is_active', e.target.checked)
                                }
                                className="text-primary h-4 w-4 rounded"
                            />
                            <label
                                htmlFor="userActive"
                                className="text-xs font-medium"
                            >
                                {t('admin.userActive', 'Foydalanuvchi faol')}
                            </label>
                        </div>

                        <div className="flex gap-2 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                className="flex-1"
                                onClick={() => setEditingUser(null)}
                            >
                                {t('admin.cancel', 'Bekor qilish')}
                            </Button>
                            <Button
                                type="submit"
                                className="flex-1"
                                disabled={processing}
                            >
                                {t('admin.save', 'Saqlash')}
                            </Button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
