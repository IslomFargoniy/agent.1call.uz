import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import {
    CreditCard,
    Edit3,
    CheckCircle2,
    XCircle,
    Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PaymentMethodLogo } from '@/components/brand-logos';


interface PaymentMethodItem {
    id: number;
    code: string;
    name: string;
    is_active: boolean;
    settings?: any;
    instructions?: string;
    sort_order: number;
}

interface PaymentMethodsProps {
    methods: PaymentMethodItem[];
}

export default function AdminPaymentMethods({ methods }: PaymentMethodsProps) {
    const [editingMethod, setEditingMethod] = useState<PaymentMethodItem | null>(null);

    const { data, setData, put, processing } = useForm({
        is_active: true,
        settings: {} as any,
        instructions: '',
    });

    const openEdit = (method: PaymentMethodItem) => {
        setEditingMethod(method);
        setData({
            is_active: method.is_active,
            settings: method.settings || {},
            instructions: method.instructions || '',
        });
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingMethod) return;
        put(`/admin/payment-methods/${editingMethod.id}`, {
            onSuccess: () => setEditingMethod(null),
        });
    };

    return (
        <div className="p-6 space-y-6 max-w-6xl mx-auto">
            <Head title="Superadmin — To'lov Tizimlari" />

            <div>
                <h2 className="text-2xl font-bold tracking-tight">To'lov Tizimlari Sozlamalari</h2>
                <p className="text-sm text-muted-foreground">
                    Click, Payme, P2P Karta rekvizitlari va Lemon Squeezy integratsiya kalitlari
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {methods.map((method) => (
                    <div key={method.id} className="bg-card p-6 rounded-2xl border border-border shadow-xs space-y-4">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                                <PaymentMethodLogo code={method.code} className="h-7" />
                                <div>
                                    <span className="font-bold text-lg block">{method.name}</span>
                                    <span className="text-xs text-muted-foreground font-mono uppercase">{method.code}</span>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(method)}>
                                <Edit3 className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="text-xs text-muted-foreground bg-secondary/40 p-3.5 rounded-xl space-y-1 font-mono">
                            {method.code === 'card_transfer' ? (
                                <>
                                    <p>Karta: <b>{method.settings?.card_number || 'Kiritilmagan'}</b></p>
                                    <p>Egasi: <b>{method.settings?.card_holder || 'Kiritilmagan'}</b></p>
                                </>
                            ) : method.code === 'lemonsqueezy' ? (
                                <>
                                    <p>Store ID: <b>{method.settings?.store_id || 'Kiritilmagan'}</b></p>
                                    <p>Store Slug: <b>{method.settings?.store_slug || '1call'}</b></p>
                                </>
                            ) : (
                                <>
                                    <p>Merchant ID: <b>{method.settings?.merchant_id || 'Auto / Pay-uz'}</b></p>
                                </>
                            )}
                        </div>

                        <div className="flex items-center justify-between text-xs pt-2">
                            <span className="text-muted-foreground">Holati:</span>
                            {method.is_active ? (
                                <span className="text-emerald-600 font-semibold flex items-center gap-1">
                                    <CheckCircle2 className="h-3.5 w-3.5" /> Faol (To'lov qabul qilinadi)
                                </span>
                            ) : (
                                <span className="text-muted-foreground flex items-center gap-1">
                                    <XCircle className="h-3.5 w-3.5" /> O'chirilgan
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Edit Modal */}
            {editingMethod && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <form onSubmit={handleSave} className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4">
                        <h3 className="text-lg font-bold">To'lov tizimini sozlash: {editingMethod.name}</h3>

                        <div className="flex items-center gap-2 pb-2 border-b border-border">
                            <input
                                type="checkbox"
                                id="methodActive"
                                checked={data.is_active}
                                onChange={(e) => setData('is_active', e.target.checked)}
                                className="rounded text-primary h-4 w-4"
                            />
                            <label htmlFor="methodActive" className="text-xs font-semibold">
                                Ushbu to'lov usulini faollashtirish
                            </label>
                        </div>

                        {editingMethod.code === 'card_transfer' && (
                            <>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold">Karta raqami (P2P o'tkazmalar uchun):</label>
                                    <Input
                                        value={data.settings?.card_number || ''}
                                        onChange={(e) => setData('settings', { ...data.settings, card_number: e.target.value })}
                                        placeholder="8600 0000 0000 0000"
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold">Karta egasining ismi-sharifi:</label>
                                    <Input
                                        value={data.settings?.card_holder || ''}
                                        onChange={(e) => setData('settings', { ...data.settings, card_holder: e.target.value })}
                                        placeholder="FALONCHI PISTONCHIYEV"
                                        required
                                    />
                                </div>
                            </>
                        )}

                        {editingMethod.code === 'lemonsqueezy' && (
                            <>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold">Lemon Squeezy Store ID:</label>
                                    <Input
                                        value={data.settings?.store_id || ''}
                                        onChange={(e) => setData('settings', { ...data.settings, store_id: e.target.value })}
                                        placeholder="12345"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold">API Key:</label>
                                    <Input
                                        type="password"
                                        value={data.settings?.api_key || ''}
                                        onChange={(e) => setData('settings', { ...data.settings, api_key: e.target.value })}
                                        placeholder="eyJhbGciOiJKV1Qi..."
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold">Webhook Secret:</label>
                                    <Input
                                        type="password"
                                        value={data.settings?.webhook_secret || ''}
                                        onChange={(e) => setData('settings', { ...data.settings, webhook_secret: e.target.value })}
                                        placeholder="••••••••••••••••"
                                    />
                                </div>
                            </>
                        )}

                        <div className="space-y-1">
                            <label className="text-xs font-semibold">Mijoz uchun ko'rsatma (Instructions):</label>
                            <Input
                                value={data.instructions || ''}
                                onChange={(e) => setData('instructions', e.target.value)}
                                placeholder="To'lovdan so'ng chekni yuklang..."
                            />
                        </div>

                        <div className="flex gap-2 pt-2">
                            <Button type="button" variant="outline" className="flex-1" onClick={() => setEditingMethod(null)}>
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
