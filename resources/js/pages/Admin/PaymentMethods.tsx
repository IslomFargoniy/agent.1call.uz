import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Head, useForm, Link } from '@inertiajs/react';
import {
    Edit3,
    CheckCircle2,
    XCircle,
    Shield,
    ExternalLink,
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
    usdRate?: number;
}

export default function AdminPaymentMethods({
    methods,
    usdRate = 12850,
}: PaymentMethodsProps) {
    const { t } = useTranslation();
    const [editingMethod, setEditingMethod] =
        useState<PaymentMethodItem | null>(null);

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
        <div className="mx-auto max-w-6xl space-y-6 p-6">
            <Head
                title={t(
                    'admin.paymentMethods.title',
                    "Superadmin — To'lov Tizimlari",
                )}
            />

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">
                        {t(
                            'admin.paymentMethods.title',
                            "To'lov Tizimlari Sozlamalari",
                        )}
                    </h2>
                    <p className="text-muted-foreground text-sm">
                        Click, Payme, P2P Karta rekvizitlari va Lemon Squeezy
                        integratsiya kalitlari
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <a
                        href="/payment/dashboard"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20 inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-colors"
                    >
                        <Shield className="h-4 w-4" />
                        Pay-Uz Boshqaruv Paneli
                        <ExternalLink className="h-3 w-3" />
                    </a>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {methods.map((method) => (
                    <div
                        key={method.id}
                        className="bg-card border-border space-y-4 rounded-2xl border p-6 shadow-xs"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <PaymentMethodLogo
                                    code={method.code}
                                    className="h-7"
                                />
                                <div>
                                    <span className="block text-lg font-bold">
                                        {method.name}
                                    </span>
                                    <span className="text-muted-foreground font-mono text-xs uppercase">
                                        {method.code}
                                    </span>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => openEdit(method)}
                            >
                                <Edit3 className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="text-muted-foreground bg-secondary/40 space-y-1 rounded-xl p-3.5 font-mono text-xs">
                            {method.code === 'card_transfer' ? (
                                <>
                                    <p>
                                        Karta:{' '}
                                        <b>
                                            {method.settings?.card_number ||
                                                'Kiritilmagan'}
                                        </b>
                                    </p>
                                    <p>
                                        Egasi:{' '}
                                        <b>
                                            {method.settings?.card_holder ||
                                                'Kiritilmagan'}
                                        </b>
                                    </p>
                                </>
                            ) : method.code === 'click' ? (
                                <>
                                    <p>
                                        Service ID:{' '}
                                        <b>
                                            {method.settings?.service_id ||
                                                'Kiritilmagan'}
                                        </b>
                                    </p>
                                    <p>
                                        Merchant ID:{' '}
                                        <b>
                                            {method.settings?.merchant_id ||
                                                'Kiritilmagan'}
                                        </b>
                                    </p>
                                    <p className="text-[11px] opacity-75">
                                        Webhook: <code>/handle/click</code>
                                    </p>
                                </>
                            ) : method.code === 'payme' ? (
                                <>
                                    <p>
                                        Merchant ID:{' '}
                                        <b>
                                            {method.settings?.merchant_id ||
                                                'Kiritilmagan'}
                                        </b>
                                    </p>
                                    <p>
                                        Account Key:{' '}
                                        <b>
                                            {method.settings?.key || 'order_id'}
                                        </b>
                                    </p>
                                    <p className="text-[11px] opacity-75">
                                        Webhook: <code>/handle/payme</code>
                                    </p>
                                </>
                            ) : method.code === 'lemonsqueezy' ? (
                                <>
                                    <p>
                                        Store ID:{' '}
                                        <b>
                                            {method.settings?.store_id ||
                                                'Kiritilmagan'}
                                        </b>
                                    </p>
                                    <p>
                                        Variant ID:{' '}
                                        <b>
                                            {method.settings?.variant_id ||
                                                'Standart'}
                                        </b>
                                    </p>
                                    <div className="border-border/50 mt-1 flex flex-wrap items-center justify-between gap-2 border-t pt-2 text-xs">
                                        <span className="text-muted-foreground">
                                            Kurs:{' '}
                                            <b>
                                                1 USD ={' '}
                                                {Number(usdRate).toLocaleString(
                                                    'uz-UZ',
                                                )}{' '}
                                                UZS
                                            </b>
                                        </span>
                                        <Link
                                            href="/admin/tariffs"
                                            className="text-primary font-semibold hover:underline"
                                        >
                                            Valyuta kursini boshqarish →
                                        </Link>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <p>
                                        Merchant ID:{' '}
                                        <b>
                                            {method.settings?.merchant_id ||
                                                'Auto / Pay-uz'}
                                        </b>
                                    </p>
                                </>
                            )}
                        </div>

                        <div className="flex items-center justify-between pt-2 text-xs">
                            <span className="text-muted-foreground">
                                {t('admin.status', 'Holati')}:
                            </span>
                            {method.is_active ? (
                                <span className="flex items-center gap-1 font-semibold text-emerald-600">
                                    <CheckCircle2 className="h-3.5 w-3.5" />{' '}
                                    {t(
                                        'admin.activeAccepting',
                                        "Faol (To'lov qabul qilinadi)",
                                    )}
                                </span>
                            ) : (
                                <span className="text-muted-foreground flex items-center gap-1">
                                    <XCircle className="h-3.5 w-3.5" />{' '}
                                    {t('devices.disabled', "O'chirilgan")}
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Edit Modal */}
            {editingMethod && (
                <div className="bg-background/80 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
                    <form
                        onSubmit={handleSave}
                        className="bg-card border-border max-h-[90vh] w-full max-w-md space-y-4 overflow-y-auto rounded-2xl border p-6 shadow-xl"
                    >
                        <h3 className="text-lg font-bold">
                            {t(
                                'admin.configurePaymentMethod',
                                "To'lov tizimini sozlash",
                            )}
                            : {editingMethod.name}
                        </h3>

                        <div className="border-border flex items-center gap-2 border-b pb-2">
                            <input
                                type="checkbox"
                                id="methodActive"
                                checked={data.is_active}
                                onChange={(e) =>
                                    setData('is_active', e.target.checked)
                                }
                                className="text-primary h-4 w-4 rounded"
                            />
                            <label
                                htmlFor="methodActive"
                                className="text-xs font-semibold"
                            >
                                {t(
                                    'admin.enablePaymentMethod',
                                    "Ushbu to'lov usulini faollashtirish",
                                )}
                            </label>
                        </div>

                        {editingMethod.code === 'card_transfer' && (
                            <>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold">
                                        {t(
                                            'admin.cardNumberLabel',
                                            "Karta raqami (P2P o'tkazmalar uchun):",
                                        )}
                                    </label>
                                    <Input
                                        value={data.settings?.card_number || ''}
                                        onChange={(e) =>
                                            setData('settings', {
                                                ...data.settings,
                                                card_number: e.target.value,
                                            })
                                        }
                                        placeholder="8600 0000 0000 0000"
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold">
                                        {t(
                                            'admin.cardHolderLabel',
                                            'Karta egasining ismi-sharifi:',
                                        )}
                                    </label>
                                    <Input
                                        value={data.settings?.card_holder || ''}
                                        onChange={(e) =>
                                            setData('settings', {
                                                ...data.settings,
                                                card_holder: e.target.value,
                                            })
                                        }
                                        placeholder="FALONCHI PISTONCHIYEV"
                                        required
                                    />
                                </div>
                            </>
                        )}

                        {editingMethod.code === 'click' && (
                            <>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold">
                                        Service ID (Click):
                                    </label>
                                    <Input
                                        value={data.settings?.service_id || ''}
                                        onChange={(e) =>
                                            setData('settings', {
                                                ...data.settings,
                                                service_id: e.target.value,
                                            })
                                        }
                                        placeholder="masalan, 12345"
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold">
                                        Merchant ID:
                                    </label>
                                    <Input
                                        value={data.settings?.merchant_id || ''}
                                        onChange={(e) =>
                                            setData('settings', {
                                                ...data.settings,
                                                merchant_id: e.target.value,
                                            })
                                        }
                                        placeholder="masalan, 1234"
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold">
                                        Secret Key (Maxfiy kalit):
                                    </label>
                                    <Input
                                        type="password"
                                        value={data.settings?.secret_key || ''}
                                        onChange={(e) =>
                                            setData('settings', {
                                                ...data.settings,
                                                secret_key: e.target.value,
                                            })
                                        }
                                        placeholder="••••••••••••••••"
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold">
                                        Merchant User ID (ixtiyoriy):
                                    </label>
                                    <Input
                                        value={
                                            data.settings?.merchant_user_id ||
                                            ''
                                        }
                                        onChange={(e) =>
                                            setData('settings', {
                                                ...data.settings,
                                                merchant_user_id:
                                                    e.target.value,
                                            })
                                        }
                                        placeholder="0000"
                                    />
                                </div>
                            </>
                        )}

                        {editingMethod.code === 'payme' && (
                            <>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold">
                                        Merchant ID (Payme):
                                    </label>
                                    <Input
                                        value={data.settings?.merchant_id || ''}
                                        onChange={(e) =>
                                            setData('settings', {
                                                ...data.settings,
                                                merchant_id: e.target.value,
                                            })
                                        }
                                        placeholder="masalan, 6080... (Paycom ID)"
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold">
                                        Secret Key (Parol / Maxfiy kalit):
                                    </label>
                                    <Input
                                        type="password"
                                        value={data.settings?.secret_key || ''}
                                        onChange={(e) =>
                                            setData('settings', {
                                                ...data.settings,
                                                secret_key: e.target.value,
                                            })
                                        }
                                        placeholder="••••••••••••••••"
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold">
                                        Account Param Key (Kabinetdagi hisob
                                        parametri):
                                    </label>
                                    <Input
                                        value={data.settings?.key || ''}
                                        onChange={(e) =>
                                            setData('settings', {
                                                ...data.settings,
                                                key: e.target.value,
                                            })
                                        }
                                        placeholder="order_id"
                                    />
                                    <p className="text-muted-foreground text-[11px]">
                                        Payme merchant cabinet sozlamalaridagi
                                        maydon nomi (odatda{' '}
                                        <code>order_id</code> yoki{' '}
                                        <code>id</code>)
                                    </p>
                                </div>
                            </>
                        )}

                        {editingMethod.code === 'lemonsqueezy' && (
                            <>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold">
                                        Lemon Squeezy Store ID:
                                    </label>
                                    <Input
                                        value={data.settings?.store_id || ''}
                                        onChange={(e) =>
                                            setData('settings', {
                                                ...data.settings,
                                                store_id: e.target.value,
                                            })
                                        }
                                        placeholder="12345"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold">
                                        Product Variant ID:
                                    </label>
                                    <Input
                                        value={data.settings?.variant_id || ''}
                                        onChange={(e) =>
                                            setData('settings', {
                                                ...data.settings,
                                                variant_id: e.target.value,
                                            })
                                        }
                                        placeholder="masalan, 123456"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold">
                                        API Key:
                                    </label>
                                    <Input
                                        type="password"
                                        value={data.settings?.api_key || ''}
                                        onChange={(e) =>
                                            setData('settings', {
                                                ...data.settings,
                                                api_key: e.target.value,
                                            })
                                        }
                                        placeholder="eyJhbGciOiJKV1Qi..."
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold">
                                        Webhook Secret:
                                    </label>
                                    <Input
                                        type="password"
                                        value={
                                            data.settings?.webhook_secret || ''
                                        }
                                        onChange={(e) =>
                                            setData('settings', {
                                                ...data.settings,
                                                webhook_secret: e.target.value,
                                            })
                                        }
                                        placeholder="••••••••••••••••"
                                    />
                                </div>
                            </>
                        )}

                        <div className="space-y-1">
                            <label className="text-xs font-semibold">
                                {t(
                                    'admin.customerInstructionsLabel',
                                    "Mijoz uchun ko'rsatma (Instructions):",
                                )}
                            </label>
                            <Input
                                value={data.instructions || ''}
                                onChange={(e) =>
                                    setData('instructions', e.target.value)
                                }
                                placeholder="To'lovdan so'ng chekni yuklang..."
                            />
                        </div>

                        <div className="flex gap-2 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                className="flex-1"
                                onClick={() => setEditingMethod(null)}
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
