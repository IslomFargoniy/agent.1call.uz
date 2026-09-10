import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import {
    Coins,
    Edit3,
    Plus,
    CheckCircle2,
    XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Tariff {
    id: number;
    name: string;
    code: string;
    base_price_monthly: number;
    price_usd_monthly: number;
    min_devices: number;
    default_retention_days: number;
    is_active: boolean;
}

interface TariffsProps {
    tariffs: Tariff[];
}

export default function AdminTariffs({ tariffs }: TariffsProps) {
    const [editingTariff, setEditingTariff] = useState<Tariff | null>(null);
    const [showModal, setShowModal] = useState(false);

    const { data, setData, post, processing, reset } = useForm({
        id: '',
        name: '',
        code: '',
        base_price_monthly: 50000,
        price_usd_monthly: 4.0,
        default_retention_days: 30,
        is_active: true,
    });

    const openCreate = () => {
        reset();
        setEditingTariff(null);
        setShowModal(true);
    };

    const openEdit = (tariff: Tariff) => {
        setEditingTariff(tariff);
        setData({
            id: String(tariff.id),
            name: tariff.name,
            code: tariff.code,
            base_price_monthly: tariff.base_price_monthly,
            price_usd_monthly: tariff.price_usd_monthly,
            default_retention_days: tariff.default_retention_days,
            is_active: tariff.is_active,
        });
        setShowModal(true);
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/tariffs', {
            onSuccess: () => {
                setShowModal(false);
                reset();
            },
        });
    };

    return (
        <div className="p-6 space-y-6 max-w-6xl mx-auto">
            <Head title="Superadmin — Tariflar" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Tariflar Boshqaruvi</h2>
                    <p className="text-sm text-muted-foreground">
                        Baza narxlari (UZS va USD) hamda muddat/hajm parametrlarini belgilash
                    </p>
                </div>

                <Button onClick={openCreate} size="sm" className="h-9">
                    <Plus className="h-4 w-4 mr-1.5" /> Yangi tarif qo'shish
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {tariffs.map((tariff) => (
                    <div key={tariff.id} className="bg-card p-6 rounded-2xl border border-border shadow-xs space-y-4 relative">
                        <div className="flex justify-between items-start">
                            <div>
                                <span className="font-bold text-lg block">{tariff.name}</span>
                                <span className="text-xs text-muted-foreground font-mono uppercase">{tariff.code}</span>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(tariff)}>
                                <Edit3 className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="border-t border-b border-border py-4 space-y-2">
                            <div className="flex justify-between items-baseline">
                                <span className="text-xs text-muted-foreground">Baza narx (1 telefon/oy):</span>
                                <span className="text-xl font-extrabold font-mono text-primary">
                                    {Number(tariff.base_price_monthly).toLocaleString('uz-UZ')} UZS
                                </span>
                            </div>
                            <div className="flex justify-between items-baseline text-xs text-muted-foreground">
                                <span>USD narxi (Lemon Squeezy):</span>
                                <span className="font-mono font-bold">${tariff.price_usd_monthly}</span>
                            </div>
                            <div className="flex justify-between items-baseline text-xs text-muted-foreground">
                                <span>Standart arxiv muddati:</span>
                                <span className="font-mono">{tariff.default_retention_days} kun</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Holati:</span>
                            {tariff.is_active ? (
                                <span className="text-emerald-600 font-semibold flex items-center gap-1">
                                    <CheckCircle2 className="h-3.5 w-3.5" /> Faol
                                </span>
                            ) : (
                                <span className="text-red-600 font-semibold flex items-center gap-1">
                                    <XCircle className="h-3.5 w-3.5" /> O'chirilgan
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <form onSubmit={handleSave} className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4">
                        <h3 className="text-lg font-bold">{editingTariff ? 'Tarifni tahrirlash' : 'Yangi tarif yaratish'}</h3>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold">Tarif nomi</label>
                            <Input
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder="Standart"
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold">Kod (Slug)</label>
                            <Input
                                value={data.code}
                                onChange={(e) => setData('code', e.target.value)}
                                placeholder="standard"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold">Narx UZS (so'm/oy)</label>
                                <Input
                                    type="number"
                                    value={data.base_price_monthly}
                                    onChange={(e) => setData('base_price_monthly', Number(e.target.value))}
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold">Narx USD ($/oy)</label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={data.price_usd_monthly}
                                    onChange={(e) => setData('price_usd_monthly', Number(e.target.value))}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold">Standart arxiv muddati (kun)</label>
                            <Input
                                type="number"
                                value={data.default_retention_days}
                                onChange={(e) => setData('default_retention_days', Number(e.target.value))}
                                required
                            />
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                            <input
                                type="checkbox"
                                id="tariffActive"
                                checked={data.is_active}
                                onChange={(e) => setData('is_active', e.target.checked)}
                                className="rounded text-primary h-4 w-4"
                            />
                            <label htmlFor="tariffActive" className="text-xs font-medium">
                                Tarif faol va tanlash uchun ochiq
                            </label>
                        </div>

                        <div className="flex gap-2 pt-2">
                            <Button type="button" variant="outline" className="flex-1" onClick={() => setShowModal(false)}>
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
