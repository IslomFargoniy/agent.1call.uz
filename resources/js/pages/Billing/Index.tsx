import React, { useState } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import {
    CreditCard,
    Check,
    Coins,
    ShieldCheck,
    Receipt,
    Calendar,
    Smartphone,
    Zap,
    AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PaymentMethodLogo } from '@/components/brand-logos';


interface Tariff {
    id: number;
    name: string;
    code: string;
    base_price_monthly: number;
    price_usd_monthly: number;
    discounts: { type: string; min_value: number; discount_percent: number }[];
    retention_options: { retention_days: number; additional_price_monthly: number; additional_price_usd_monthly: number }[];
}

interface PaymentMethod {
    id: number;
    code: string;
    name: string;
    settings?: any;
    instructions?: string;
}

interface BillingProps {
    tenant?: {
        name: string;
        allowed_devices_count: number;
        audio_retention_days: number;
        subscription_expires_at?: string;
        trial_ends_at?: string;
        grace_period_ends_at?: string;
        is_active: boolean;
        is_trial: boolean;
        is_grace_period: boolean;
    };
    tariffs: Tariff[];
    paymentMethods: PaymentMethod[];
}

export default function BillingIndex({ tenant, tariffs, paymentMethods }: BillingProps) {
    const defaultTariff = tariffs[0] || null;

    const [selectedTariff, setSelectedTariff] = useState<Tariff | null>(defaultTariff);
    const [devicesCount, setDevicesCount] = useState(tenant?.allowed_devices_count || 2);
    const [retentionDays, setRetentionDays] = useState(tenant?.audio_retention_days || 30);
    const [months, setMonths] = useState(1);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(paymentMethods[0]?.code || 'payme');

    const { post, processing } = useForm();

    // Price calculation
    const baseUzs = selectedTariff ? Number(selectedTariff.base_price_monthly) : 0;
    const baseUsd = selectedTariff ? Number(selectedTariff.price_usd_monthly) : 0;

    let retentionAddonUzs = 0;
    let retentionAddonUsd = 0;
    if (retentionDays > 30 && selectedTariff) {
        const opt = selectedTariff.retention_options?.find((o) => o.retention_days === retentionDays);
        if (opt) {
            retentionAddonUzs = Number(opt.additional_price_monthly);
            retentionAddonUsd = Number(opt.additional_price_usd_monthly);
        }
    }

    const deviceRateUzs = baseUzs + retentionAddonUzs;
    const deviceRateUsd = baseUsd + retentionAddonUsd;

    const subtotalUzs = deviceRateUzs * devicesCount * months;
    const subtotalUsd = deviceRateUsd * devicesCount * months;

    // Discounts
    let periodDiscount = 0;
    if (months === 12) periodDiscount = 20;
    else if (months === 6) periodDiscount = 10;
    else if (months === 3) periodDiscount = 5;

    let volumeDiscount = 0;
    if (devicesCount >= 20) volumeDiscount = 15;
    else if (devicesCount >= 10) volumeDiscount = 10;
    else if (devicesCount >= 5) volumeDiscount = 5;

    const totalDiscount = Math.min(40, periodDiscount + volumeDiscount);
    const discountFactor = (100 - totalDiscount) / 100;

    const totalUzs = Math.round(subtotalUzs * discountFactor);
    const totalUsd = Math.round(subtotalUsd * discountFactor * 100) / 100;

    const handleCheckout = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTariff) return;

        post('/billing/checkout', {
            data: {
                tariff_id: selectedTariff.id,
                devices_count: devicesCount,
                retention_days: retentionDays,
                months: months,
                payment_method: selectedPaymentMethod,
            },
        });
    };

    return (
        <div className="p-6 space-y-8 max-w-6xl mx-auto">
            <Head title="To'lovlar va Tariflar" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Obuna va To'lovlar</h2>
                    <p className="text-sm text-muted-foreground">
                        Kompaniyangiz uchun qulay tarif va muddatni tanlang
                    </p>
                </div>

                <Button asChild variant="outline" size="sm">
                    <Link href="/billing/invoices">
                        <Receipt className="h-4 w-4 mr-1.5" /> Hisob-fakturalar (Invoices)
                    </Link>
                </Button>
            </div>

            {/* Current Status Box */}
            {tenant && (
                <div className="bg-card p-6 rounded-2xl border border-border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-lg">{tenant.name}</span>
                            {tenant.is_trial && (
                                <span className="text-xs bg-amber-500/10 text-amber-600 px-2.5 py-0.5 rounded-full font-semibold">
                                    14 kunlik Sinov davri
                                </span>
                            )}
                            {tenant.is_grace_period && (
                                <span className="text-xs bg-red-500/10 text-red-600 px-2.5 py-0.5 rounded-full font-semibold">
                                    Grace Period (3 kun)
                                </span>
                            )}
                            {tenant.is_active && !tenant.is_trial && !tenant.is_grace_period && (
                                <span className="text-xs bg-emerald-500/10 text-emerald-600 px-2.5 py-0.5 rounded-full font-semibold">
                                    Obuna faol
                                </span>
                            )}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-3 text-xs text-muted-foreground">
                            <div>
                                <span className="block text-foreground font-semibold">{tenant.allowed_devices_count} ta</span>
                                <span>Ruxsat etilgan telefonlar</span>
                            </div>
                            <div>
                                <span className="block text-foreground font-semibold">{tenant.audio_retention_days} kun</span>
                                <span>Audio arxiv muddati</span>
                            </div>
                            <div>
                                <span className="block text-foreground font-semibold">
                                    {tenant.subscription_expires_at
                                        ? new Date(tenant.subscription_expires_at).toLocaleDateString('uz-UZ')
                                        : tenant.trial_ends_at
                                            ? new Date(tenant.trial_ends_at).toLocaleDateString('uz-UZ')
                                            : '—'}
                                </span>
                                <span>Amal qilish muddati</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Interactive Calculator Form */}
            <form onSubmit={handleCheckout} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Configuration Options */}
                <div className="lg:col-span-2 space-y-6">
                    {/* 1. Devices Count */}
                    <div className="bg-card p-6 rounded-2xl border border-border space-y-4 shadow-xs">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="font-semibold text-base flex items-center gap-2">
                                    <Smartphone className="h-5 w-5 text-primary" /> Telefonlar (Agentlar) soni
                                </h3>
                                <p className="text-xs text-muted-foreground">Bir vaqtda qo'ng'iroqlari yoziladigan xodimlar soni</p>
                            </div>
                            <span className="text-xl font-bold font-mono text-primary">{devicesCount} ta</span>
                        </div>

                        <input
                            type="range"
                            min={1}
                            max={50}
                            value={devicesCount}
                            onChange={(e) => setDevicesCount(Number(e.target.value))}
                            className="w-full h-2 bg-secondary rounded-lg cursor-pointer accent-primary"
                        />

                        <div className="flex gap-2 text-xs">
                            {[1, 2, 5, 10, 20, 30].map((num) => (
                                <button
                                    key={num}
                                    type="button"
                                    onClick={() => setDevicesCount(num)}
                                    className={`px-3 py-1.5 rounded-lg border font-mono transition-colors ${
                                        devicesCount === num ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary/50 border-border'
                                    }`}
                                >
                                    {num}
                                </button>
                            ))}
                        </div>

                        {volumeDiscount > 0 && (
                            <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5">
                                <Zap className="h-4 w-4" /> Hajm bo'yicha {volumeDiscount}% chegirma qo'llandi!
                            </div>
                        )}
                    </div>

                    {/* 2. Billing Period */}
                    <div className="bg-card p-6 rounded-2xl border border-border space-y-4 shadow-xs">
                        <h3 className="font-semibold text-base flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-primary" /> To'lov davri
                        </h3>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {[
                                { m: 1, label: '1 oy', discount: null },
                                { m: 3, label: '3 oy', discount: '5% chegirma' },
                                { m: 6, label: '6 oy', discount: '10% chegirma' },
                                { m: 12, label: '12 oy (1 yil)', discount: '20% chegirma' },
                            ].map((item) => (
                                <div
                                    key={item.m}
                                    onClick={() => setMonths(item.m)}
                                    className={`p-4 rounded-xl border cursor-pointer text-center transition-all ${
                                        months === item.m
                                            ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                                            : 'border-border bg-card hover:bg-muted/40'
                                    }`}
                                >
                                    <span className="font-bold text-sm block">{item.label}</span>
                                    {item.discount && (
                                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold block mt-1">
                                            {item.discount}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 3. Audio Retention Options */}
                    <div className="bg-card p-6 rounded-2xl border border-border space-y-4 shadow-xs">
                        <div>
                            <h3 className="font-semibold text-base flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5 text-primary" /> Audio arxiv saqlash muddati
                            </h3>
                            <p className="text-xs text-muted-foreground">Belgilangan muddatdan oshgan audio yozuvlar avtomatik tozalanadi</p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
                            {[
                                { days: 30, label: '30 kun', extra: 'Standart (0 so\'m)' },
                                { days: 60, label: '60 kun', extra: '+10 000 so\'m' },
                                { days: 90, label: '90 kun', extra: '+20 000 so\'m' },
                                { days: 180, label: '180 kun', extra: '+35 000 so\'m' },
                                { days: 365, label: '1 yil (365k)', extra: '+50 000 so\'m' },
                            ].map((item) => (
                                <div
                                    key={item.days}
                                    onClick={() => setRetentionDays(item.days)}
                                    className={`p-3 rounded-xl border cursor-pointer text-center text-xs transition-all ${
                                        retentionDays === item.days
                                            ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                            : 'border-border bg-card hover:bg-muted/40'
                                    }`}
                                >
                                    <span className="font-bold block">{item.label}</span>
                                    <span className="text-[10px] text-muted-foreground block mt-0.5">{item.extra}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 4. Payment Method Selection */}
                    <div className="bg-card p-6 rounded-2xl border border-border space-y-4 shadow-xs">
                        <h3 className="font-semibold text-base flex items-center gap-2">
                            <CreditCard className="h-5 w-5 text-primary" /> To'lov tizimini tanlang
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {paymentMethods.map((method) => (
                                <div
                                    key={method.code}
                                    onClick={() => setSelectedPaymentMethod(method.code)}
                                    className={`p-4 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                                        selectedPaymentMethod === method.code
                                            ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                                            : 'border-border bg-card hover:bg-muted/40'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <PaymentMethodLogo code={method.code} className="h-6" />
                                        <div>
                                            <span className="font-bold text-sm block">{method.name}</span>
                                            <span className="text-xs text-muted-foreground">
                                                {method.code === 'lemonsqueezy' ? 'USD (Visa, Mastercard)' : 'UZS (Humo / Uzcard)'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                                        selectedPaymentMethod === method.code ? 'border-primary bg-primary text-primary-foreground' : 'border-border'
                                    }`}>
                                        {selectedPaymentMethod === method.code && <Check className="h-3 w-3" />}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Order Summary & Checkout Card */}
                <div className="lg:col-span-1">
                    <div className="bg-card p-6 rounded-2xl border border-border shadow-md space-y-6 sticky top-6">
                        <h3 className="font-bold text-lg border-b border-border pb-3">Buyurtma tafsilotlari</h3>

                        <div className="space-y-3 text-xs">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Telefonlar soni:</span>
                                <span className="font-semibold font-mono">{devicesCount} ta</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Muddat:</span>
                                <span className="font-semibold font-mono">{months} oy</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Arxiv saqlash:</span>
                                <span className="font-semibold font-mono">{retentionDays} kun</span>
                            </div>

                            {totalDiscount > 0 && (
                                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                                    <span>Jami chegirma:</span>
                                    <span>-{totalDiscount}%</span>
                                </div>
                            )}

                            <div className="border-t border-border pt-3 flex justify-between items-baseline">
                                <span className="text-sm font-bold">Jami to'lov:</span>
                                <div className="text-right">
                                    <span className="text-2xl font-extrabold font-mono text-primary block">
                                        {totalUzs.toLocaleString('uz-UZ')} UZS
                                    </span>
                                    <span className="text-xs text-muted-foreground font-mono">
                                        (~{totalUsd} USD)
                                    </span>
                                </div>
                            </div>
                        </div>

                        <Button type="submit" size="lg" className="w-full font-bold shadow-md" disabled={processing}>
                            {processing ? 'Yuklanmoqda...' : 'To\'lovga o\'tish'}
                        </Button>

                        <p className="text-[11px] text-muted-foreground text-center">
                            To'lov tasdiqlangach, obunangiz avtomatik ravishda uzaytiriladi.
                        </p>
                    </div>
                </div>
            </form>
        </div>
    );
}
