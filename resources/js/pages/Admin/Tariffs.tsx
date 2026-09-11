import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Head, useForm, router } from '@inertiajs/react';
import {
    Coins,
    Edit3,
    Plus,
    CheckCircle2,
    XCircle,
    RefreshCw,
    DollarSign,
    Calculator,
    Check,
    ArrowUpDown,
    Calendar,
    Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

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
    usdRate?: number;
    rateUpdatedAt?: string | null;
}

export default function AdminTariffs({ tariffs, usdRate = 12850, rateUpdatedAt }: TariffsProps) {
    const { t } = useTranslation();
    const [editingTariff, setEditingTariff] = useState<Tariff | null>(null);
    const [showModal, setShowModal] = useState(false);

    // Exchange Rate States
    const [rateValue, setRateValue] = useState<number>(usdRate);
    const [fetchingCbu, setFetchingCbu] = useState(false);
    const [savingRate, setSavingRate] = useState(false);
    const [recalculate, setRecalculate] = useState(true);

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
                toast.success(t("admin.tariffSavedSuccess", "Tarif muvaffaqiyatli saqlandi!"));
            },
            onError: () => {
                toast.error(t("admin.tariffSaveError", "Tarifni saqlashda xatolik yuz berdi"));
            },
        });
    };

    const handleFetchCbuRate = async () => {
        setFetchingCbu(true);
        try {
            const res = await fetch('/admin/tariffs/cbu-rate');
            const result = await res.json();
            if (result.success && result.rate) {
                setRateValue(result.rate);
                toast.success(
                    `O'zbekiston Markaziy Banki kursi olindi: 1 USD = ${Number(result.rate).toLocaleString('uz-UZ')} UZS (${result.date || ''})`
                );
            } else {
                toast.error("Markaziy Bankdan kursni olishda xatolik yuz berdi");
            }
        } catch {
            toast.error("Internet yoki server bilan bog'lanishda xatolik");
        } finally {
            setFetchingCbu(false);
        }
    };

    const handleSaveRate = () => {
        if (!rateValue || rateValue < 1000) {
            toast.error("Iltimos, to'g'ri kurs qiymatini kiriting (masalan, 12850)");
            return;
        }

        setSavingRate(true);
        router.post(
            '/admin/tariffs/exchange-rate',
            {
                usd_rate: rateValue,
                recalculate_tariffs: recalculate,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(
                        recalculate
                            ? `Valyuta kursi (1 USD = ${Number(rateValue).toLocaleString('uz-UZ')} UZS) saqlandi va barcha tariflar USD narxlari yangilandi!`
                            : `Valyuta kursi (1 USD = ${Number(rateValue).toLocaleString('uz-UZ')} UZS) saqlandi!`
                    );
                },
                onError: () => {
                    toast.error("Valyuta kursini saqlashda xatolik yuz berdi");
                },
                onFinish: () => {
                    setSavingRate(false);
                },
            }
        );
    };

    return (
        <div className="p-6 space-y-6 max-w-6xl mx-auto">
            <Head title={t("admin.tariffsHead", "Superadmin — Tariflar & Valyuta kursi")} />

            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">
                        {t("admin.tariffsTitle", "Tariflar & Valyuta Kursi")}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        {t("admin.tariffsDesc", "Baza narxlari (UZS va USD), Markaziy Bank kursi va Lemon Squeezy to'lovlari uchun avtomatik konvertatsiya")}
                    </p>
                </div>

                <Button onClick={openCreate} size="sm" className="h-9 gap-1.5 shadow-xs">
                    <Plus className="h-4 w-4" /> {t("admin.addNewTariff", "Yangi tarif qo'shish")}
                </Button>
            </div>

            {/* Exchange Rate Card (Valyuta kursi boshqaruvi) */}
            <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-xs relative overflow-hidden space-y-5">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <DollarSign className="h-6 w-6" />
                        </div>
                        <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-lg font-bold text-foreground">
                                    {t("admin.exchangeRateTitle", "AQSH Dollari Valyuta Kursi (USD / UZS)")}
                                </h3>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                    1 USD = {Number(rateValue || 12850).toLocaleString('uz-UZ')} UZS
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
                                {t(
                                    "admin.exchangeRateSubtitle",
                                    "Lemon Squeezy to'lovlarida xalqaro to'lovlar uchun dollar narxi ushbu kurs orqali UZS ga bog'lanadi. Kursni qo'lda kiritishingiz yoki Markaziy Bankdan bir tugma orqali avtomatik yangilashingiz mumkin."
                                )}
                            </p>
                            {rateUpdatedAt && (
                                <p className="text-[11px] text-muted-foreground/80 flex items-center gap-1 font-mono pt-0.5">
                                    <Calendar className="h-3 w-3" />
                                    {t("admin.lastUpdated", "Tizimda oxirgi yangilanish")}: {new Date(rateUpdatedAt).toLocaleString('uz-UZ')}
                                </p>
                            )}
                        </div>
                    </div>

                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleFetchCbuRate}
                        disabled={fetchingCbu}
                        className="shrink-0 gap-2 h-9 border-border/80 hover:bg-muted font-medium"
                    >
                        <RefreshCw className={`h-4 w-4 ${fetchingCbu ? 'animate-spin text-primary' : 'text-muted-foreground'}`} />
                        {fetchingCbu ? t("admin.fetchingCbu", "MB dan olinmoqda...") : t("admin.fetchCbu", "Markaziy Bankdan olish")}
                    </Button>
                </div>

                {/* Form controls for Exchange Rate */}
                <div className="pt-4 border-t border-border/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
                                1 USD =
                            </span>
                            <div className="relative w-44">
                                <Input
                                    type="number"
                                    step="0.01"
                                    min="1000"
                                    value={rateValue}
                                    onChange={(e) => setRateValue(Number(e.target.value))}
                                    className="h-9 pr-12 font-mono font-bold text-sm"
                                    placeholder="12850"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono font-bold pointer-events-none">
                                    UZS
                                </span>
                            </div>
                        </div>

                        <label className="flex items-center gap-2 text-xs cursor-pointer select-none bg-muted/40 hover:bg-muted/70 px-3 py-2 rounded-lg border border-border/60 transition-colors">
                            <input
                                type="checkbox"
                                checked={recalculate}
                                onChange={(e) => setRecalculate(e.target.checked)}
                                className="rounded text-primary h-4 w-4"
                            />
                            <span className="text-foreground/90 font-medium">
                                {t("admin.autoRecalculateTariffs", "Barcha tariflarning USD narxlarini ushbu kurs bo'yicha avtomatik qayta hisoblash")}
                            </span>
                        </label>
                    </div>

                    <Button
                        onClick={handleSaveRate}
                        disabled={savingRate || !rateValue || rateValue <= 0}
                        size="sm"
                        className="h-9 gap-1.5 shrink-0 px-4"
                    >
                        <Check className="h-4 w-4" />
                        {savingRate ? t("admin.saving", "Saqlanmoqda...") : t("admin.saveRate", "Kursni saqlash")}
                    </Button>
                </div>
            </div>

            {/* Tariffs List Header */}
            <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                    <Coins className="h-5 w-5 text-primary" />
                    <h3 className="text-base font-bold text-foreground">
                        {t("admin.tariffsListTitle", "Mavjud Tarif Rejalari")}
                    </h3>
                </div>
                <span className="text-xs text-muted-foreground">
                    {t("admin.tariffsTotalCount", "Jami: {{count}} ta tarif", { count: tariffs.length })}
                </span>
            </div>

            {/* Tariffs Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {tariffs.map((tariff) => {
                    const expectedUsd = rateValue > 0 ? (tariff.base_price_monthly / rateValue).toFixed(2) : null;
                    return (
                        <div key={tariff.id} className="bg-card p-6 rounded-2xl border border-border shadow-xs space-y-4 relative flex flex-col justify-between hover:border-border/90 transition-all">
                            <div className="space-y-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <span className="font-bold text-lg block text-foreground">{tariff.name}</span>
                                        <span className="text-xs text-muted-foreground font-mono uppercase tracking-wider">{tariff.code}</span>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted" onClick={() => openEdit(tariff)}>
                                        <Edit3 className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                </div>

                                <div className="border-t border-b border-border/80 py-4 space-y-2.5">
                                    <div className="flex justify-between items-baseline">
                                        <span className="text-xs text-muted-foreground">{t("admin.basePricePerDevice", "Baza narx (1 telefon/oy):")}</span>
                                        <span className="text-xl font-extrabold font-mono text-primary">
                                            {Number(tariff.base_price_monthly).toLocaleString('uz-UZ')} UZS
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-baseline text-xs">
                                        <span className="text-muted-foreground">{t("admin.usdPrice", "USD narxi (Lemon Squeezy):")}</span>
                                        <div className="text-right">
                                            <span className="font-mono font-bold text-sm text-foreground">${tariff.price_usd_monthly}</span>
                                            {expectedUsd && (
                                                <span className="text-[11px] text-muted-foreground ml-1 font-mono block">
                                                    (~{Number(Math.round(tariff.price_usd_monthly * rateValue)).toLocaleString('uz-UZ')} UZS)
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-baseline text-xs text-muted-foreground">
                                        <span>{t("admin.standardRetention", "Standart arxiv muddati:")}</span>
                                        <span className="font-mono font-medium text-foreground">{tariff.default_retention_days} kun</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-xs pt-1">
                                <span className="text-muted-foreground">{t("admin.status", "Holati")}:</span>
                                {tariff.is_active ? (
                                    <span className="text-emerald-600 font-semibold flex items-center gap-1">
                                        <CheckCircle2 className="h-3.5 w-3.5" /> {t("admin.active", "Faol")}
                                    </span>
                                ) : (
                                    <span className="text-red-600 font-semibold flex items-center gap-1">
                                        <XCircle className="h-3.5 w-3.5" /> {t("devices.disabled", "O'chirilgan")}
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <form onSubmit={handleSave} className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4">
                        <h3 className="text-lg font-bold">{editingTariff ? t("admin.editTariff", "Tarifni tahrirlash") : t("admin.createTariff", "Yangi tarif yaratish")}</h3>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold">{t("admin.tariffName", "Tarif nomi")}</label>
                            <Input
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder="Standart"
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold">{t("admin.tariffCode", "Kod (Slug)")}</label>
                            <Input
                                value={data.code}
                                onChange={(e) => setData('code', e.target.value)}
                                placeholder="standard"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold">{t("admin.priceUzs", "Narx UZS (so'm/oy)")}</label>
                                <Input
                                    type="number"
                                    value={data.base_price_monthly}
                                    onChange={(e) => {
                                        const uzs = Number(e.target.value);
                                        setData('base_price_monthly', uzs);
                                    }}
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs font-semibold">{t("admin.priceUsd", "Narx USD ($/oy)")}</label>
                                    {rateValue > 0 && data.base_price_monthly > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => setData('price_usd_monthly', Number((data.base_price_monthly / rateValue).toFixed(2)))}
                                            className="text-[11px] text-primary hover:underline flex items-center gap-0.5"
                                            title="Joriy kurs bo'yicha hisoblash"
                                        >
                                            <Calculator className="h-3 w-3" />
                                            ${(data.base_price_monthly / rateValue).toFixed(2)}
                                        </button>
                                    )}
                                </div>
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
                            <label className="text-xs font-semibold">{t("admin.archiveRetentionDays", "Standart arxiv muddati (kun)")}</label>
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
                                {t("admin.tariffActive", "Tarif faol va tanlash uchun ochiq")}
                            </label>
                        </div>

                        <div className="flex gap-2 pt-2">
                            <Button type="button" variant="outline" className="flex-1" onClick={() => setShowModal(false)}>
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
