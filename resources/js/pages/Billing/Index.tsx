import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Head, router, Link } from "@inertiajs/react";
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
    Minus,
    Plus,
    TrendingUp,
    RotateCw,
    Clock,
    Info,
    CheckCircle2,
    Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PaymentMethodLogo } from "@/components/brand-logos";
import { formatDate } from "@/lib/datetime";

interface Tariff {
    id: number;
    name: string;
    code: string;
    base_price_monthly: number;
    price_usd_monthly: number;
    discounts: { type: string; min_value: number; max_value?: number | null; discount_percent: number }[];
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
        has_active_paid?: boolean;
        remaining_days?: number;
    };
    tariffs: Tariff[];
    paymentMethods: PaymentMethod[];
    currentSubscription?: any;
}

function getMarks(min: number, max: number = 50): number[] {
    const defaultMarks = [1, 2, 5, 10, 20, 30, 50];
    const filtered = defaultMarks.filter((m) => m >= min && m <= max);
    if (!filtered.includes(min)) {
        filtered.unshift(min);
    }
    if (!filtered.includes(max)) {
        filtered.push(max);
    }
    return Array.from(new Set(filtered)).sort((a, b) => a - b);
}

function countToSliderPercent(count: number, marks: number[]): number {
    if (marks.length < 2) return 0;
    if (count <= marks[0]) return 0;
    if (count >= marks[marks.length - 1]) return 100;

    const n = marks.length - 1;
    for (let i = 0; i < n; i++) {
        const minC = marks[i];
        const maxC = marks[i + 1];
        if (count >= minC && count <= maxC) {
            const minP = (i / n) * 100;
            const maxP = ((i + 1) / n) * 100;
            const fraction = (count - minC) / (maxC - minC);
            return minP + fraction * (maxP - minP);
        }
    }
    return 100;
}

function sliderPercentToCount(percent: number, marks: number[]): number {
    if (marks.length < 2) return marks[0] || 1;
    if (percent <= 0) return marks[0];
    if (percent >= 100) return marks[marks.length - 1];

    const n = marks.length - 1;
    for (let i = 0; i < n; i++) {
        const minP = (i / n) * 100;
        const maxP = ((i + 1) / n) * 100;
        if (percent >= minP && percent <= maxP) {
            const minC = marks[i];
            const maxC = marks[i + 1];
            const fraction = (percent - minP) / (maxP - minP);
            return Math.max(minC, Math.min(maxC, Math.round(minC + fraction * (maxC - minC))));
        }
    }
    return marks[marks.length - 1];
}

export default function BillingIndex({ tenant, tariffs, paymentMethods }: BillingProps) {
    const { t } = useTranslation();
    const defaultTariff = tariffs[0] || null;

    const hasActivePaid = Boolean(tenant?.has_active_paid && tenant?.subscription_expires_at);
    const remainingDays = Math.max(1, tenant?.remaining_days || 1);
    const currentAllowed = Math.max(1, tenant?.allowed_devices_count || 2);
    const currentRetention = Math.max(30, tenant?.audio_retention_days || 30);

    // Active mode: 'upgrade' (Add devices / upgrade retention pro-rata) or 'renewal' (Extend subscription)
    const [activeMode, setActiveMode] = useState<'upgrade' | 'renewal'>(
        hasActivePaid && remainingDays <= 10 ? 'renewal' : hasActivePaid ? 'upgrade' : 'renewal'
    );

    // Upgrade target devices (>= currentAllowed)
    const [upgradeTargetDevices, setUpgradeTargetDevices] = useState<number>(currentAllowed);

    // Upgrade target retention (>= currentRetention)
    const [upgradeRetentionDays, setUpgradeRetentionDays] = useState<number>(currentRetention);

    // Renewal devices count (>= currentAllowed when active)
    const [renewalDevicesCount, setRenewalDevicesCount] = useState<number>(currentAllowed);

    // Standard devices count (for trial / expired)
    const [standardDevicesCount, setStandardDevicesCount] = useState<number>(currentAllowed || 2);

    const [selectedTariff, setSelectedTariff] = useState<Tariff | null>(defaultTariff);
    const [renewalRetentionDays, setRenewalRetentionDays] = useState<number>(currentRetention);
    const [months, setMonths] = useState(1);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(paymentMethods[0]?.code || "payme");
    const [processing, setProcessing] = useState(false);

    // Memoized slider marks and percentages
    const renewalMarks = useMemo(() => {
        return getMarks(hasActivePaid ? currentAllowed : 1, 50);
    }, [hasActivePaid, currentAllowed]);

    const renewalPercent = useMemo(() => {
        return countToSliderPercent(hasActivePaid ? renewalDevicesCount : standardDevicesCount, renewalMarks);
    }, [hasActivePaid, renewalDevicesCount, standardDevicesCount, renewalMarks]);

    const upgradeMarks = useMemo(() => {
        return getMarks(currentAllowed, 50);
    }, [currentAllowed]);

    const upgradePercent = useMemo(() => {
        return countToSliderPercent(upgradeTargetDevices, upgradeMarks);
    }, [upgradeTargetDevices, upgradeMarks]);

    // Base Pricing Rates
    const baseUzs = selectedTariff ? Number(selectedTariff.base_price_monthly) : 0;
    const baseUsd = selectedTariff ? Number(selectedTariff.price_usd_monthly) : 0;

    // Helper for retention addon
    const getRetentionAddon = (days: number) => {
        if (days <= 30 || !selectedTariff) return { uzs: 0, usd: 0 };
        const opt = selectedTariff.retention_options?.find((o) => o.retention_days === days);
        return {
            uzs: opt ? Number(opt.additional_price_monthly) : 0,
            usd: opt ? Number(opt.additional_price_usd_monthly) : 0,
        };
    };

    // === UPGRADE (PRO-RATA) CALCULATION ===
    const isDevicesChanged = upgradeTargetDevices > currentAllowed;
    const isRetentionChanged = upgradeRetentionDays > currentRetention;
    const isUpgradeChanged = isDevicesChanged || isRetentionChanged;
    const additionalDevices = Math.max(0, upgradeTargetDevices - currentAllowed);

    // Current monthly cost for current devices with current retention
    const currentRetAddon = getRetentionAddon(currentRetention);
    const currentMonthlyUzs = (baseUzs + currentRetAddon.uzs) * currentAllowed;
    const currentMonthlyUsd = (baseUsd + currentRetAddon.usd) * currentAllowed;

    // Target monthly cost for upgrade target devices with upgrade retention
    const targetRetAddon = getRetentionAddon(upgradeRetentionDays);
    const targetMonthlyUzs = (baseUzs + targetRetAddon.uzs) * upgradeTargetDevices;
    const targetMonthlyUsd = (baseUsd + targetRetAddon.usd) * upgradeTargetDevices;

    // Monthly difference
    const monthlyDiffUzs = Math.max(0, targetMonthlyUzs - currentMonthlyUzs);
    const monthlyDiffUsd = Math.max(0, targetMonthlyUsd - currentMonthlyUsd);

    // Prorated cost for remaining days
    const proratedTotalUzs = Math.ceil((monthlyDiffUzs / 30.0) * remainingDays);
    const proratedTotalUsd = Math.round((monthlyDiffUsd / 30.0) * remainingDays * 100) / 100;

    // === RENEWAL & STANDARD CALCULATION ===
    const activeRenewalDevices = hasActivePaid ? renewalDevicesCount : standardDevicesCount;
    const renewalRetAddon = getRetentionAddon(renewalRetentionDays);
    const deviceRateMonthlyUzs = baseUzs + renewalRetAddon.uzs;
    const deviceRateMonthlyUsd = baseUsd + renewalRetAddon.usd;

    const subtotalUzs = deviceRateMonthlyUzs * activeRenewalDevices * months;
    const subtotalUsd = deviceRateMonthlyUsd * activeRenewalDevices * months;

    // Dynamic Discounts for Renewal
    let periodDiscount = 0;
    const dbPeriod = selectedTariff?.discounts
        ?.filter((d) => d.type === 'period' && months >= d.min_value && (!d.max_value || months <= d.max_value))
        .sort((a, b) => Number(b.discount_percent) - Number(a.discount_percent))[0];

    if (dbPeriod) {
        periodDiscount = Number(dbPeriod.discount_percent);
    } else {
        if (months === 12) periodDiscount = 20;
        else if (months === 6) periodDiscount = 10;
        else if (months === 3) periodDiscount = 5;
    }

    let volumeDiscount = 0;
    const dbVolume = selectedTariff?.discounts
        ?.filter((d) => d.type === 'device_volume' && activeRenewalDevices >= d.min_value && (!d.max_value || activeRenewalDevices <= d.max_value))
        .sort((a, b) => Number(b.discount_percent) - Number(a.discount_percent))[0];

    if (dbVolume) {
        volumeDiscount = Number(dbVolume.discount_percent);
    } else {
        if (activeRenewalDevices >= 20) volumeDiscount = 15;
        else if (activeRenewalDevices >= 10) volumeDiscount = 10;
        else if (activeRenewalDevices >= 5) volumeDiscount = 5;
    }

    const totalDiscount = Math.min(40, periodDiscount + volumeDiscount);
    const discountFactor = (100 - totalDiscount) / 100;
    const renewalTotalUzs = Math.round(subtotalUzs * discountFactor);
    const renewalTotalUsd = Math.round(subtotalUsd * discountFactor * 100) / 100;

    // Dynamic Retention items list
    const retentionItems = [
        { days: 30, label: t("billing.days30", "30 kun"), extra: t("billing.standardPrice", "Standart (0 so'm)") },
        ...([60, 90, 180, 365].map((d) => {
            const opt = selectedTariff?.retention_options?.find((o) => o.retention_days === d);
            const extraText = opt
                ? selectedPaymentMethod === "lemonsqueezy"
                    ? `+$${Number(opt.additional_price_usd_monthly).toFixed(2)}`
                    : `+${Number(opt.additional_price_monthly).toLocaleString("uz-UZ")} so'm`
                : d === 60
                    ? "+10 000 so'm"
                    : d === 90
                        ? "+20 000 so'm"
                        : d === 180
                            ? "+35 000 so'm"
                            : "+50 000 so'm";
            return {
                days: d,
                label: d === 365 ? t("billing.year1", "1 yil (365k)") : `${d} kun`,
                extra: extraText,
            };
        })),
    ];

    const handleCheckout = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTariff) return;

        setProcessing(true);

        if (hasActivePaid && activeMode === 'upgrade') {
            if (!isUpgradeChanged) {
                setProcessing(false);
                return;
            }
            router.post("/billing/checkout", {
                action_type: 'upgrade_devices',
                tariff_id: selectedTariff.id,
                devices_count: upgradeTargetDevices,
                retention_days: upgradeRetentionDays,
                payment_method: selectedPaymentMethod,
            }, {
                onFinish: () => setProcessing(false),
            });
        } else {
            router.post("/billing/checkout", {
                action_type: 'renewal',
                tariff_id: selectedTariff.id,
                devices_count: hasActivePaid ? renewalDevicesCount : standardDevicesCount,
                retention_days: renewalRetentionDays,
                months: months,
                payment_method: selectedPaymentMethod,
            }, {
                onFinish: () => setProcessing(false),
            });
        }
    };

    return (
        <div className="p-6 space-y-8 max-w-6xl mx-auto">
            <Head title={t("billing.title", "To'lovlar va Tariflar")} />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">{t("billing.title", "Obuna va To'lovlar")}</h2>
                    <p className="text-sm text-muted-foreground">
                        {t("billing.subtitle", "Kompaniyangiz uchun qulay tarif va muddatni tanlang")}
                    </p>
                </div>

                <Button asChild variant="outline" size="sm">
                    <Link href="/billing/invoices">
                        <Receipt className="h-4 w-4 mr-1.5" /> {t("billing.invoicesHistory", "Hisob-fakturalar (Invoices)")}
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
                                    {t("billing.trialPeriodBadge", "14 kunlik Sinov davri")}
                                </span>
                            )}
                            {tenant.is_grace_period && (
                                <span className="text-xs bg-red-500/10 text-red-600 px-2.5 py-0.5 rounded-full font-semibold">
                                    {t("billing.gracePeriodBadge", "Grace Period (3 kun)")}
                                </span>
                            )}
                            {tenant.is_active && !tenant.is_trial && !tenant.is_grace_period && (
                                <span className="text-xs bg-emerald-500/10 text-emerald-600 px-2.5 py-0.5 rounded-full font-semibold">
                                    {t("billing.activeSubscriptionBadge", "Obuna faol")}
                                </span>
                            )}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-xs text-muted-foreground">
                            <div>
                                <span className="block text-foreground font-semibold">{tenant.allowed_devices_count} {t("billing.devicesUnit", "ta")}</span>
                                <span>{t("billing.allowedDevicesLabel", "Ruxsat etilgan telefonlar")}</span>
                            </div>
                            <div>
                                <span className="block text-foreground font-semibold">{tenant.audio_retention_days} {t("billing.daysUnit", "kun")}</span>
                                <span>{t("billing.retentionDaysLabel", "Arxiv saqlash muddati")}</span>
                            </div>
                            <div>
                                <span className="block text-foreground font-semibold">
                                    {tenant.subscription_expires_at
                                        ? formatDate(tenant.subscription_expires_at)
                                        : tenant.trial_ends_at
                                            ? formatDate(tenant.trial_ends_at)
                                            : "—"}
                                </span>
                                <span>{tenant.is_trial ? t("billing.trialPeriod", "Sinov muddati tugashi") : t("billing.expiresAt", "Amal qilish muddati")}</span>
                            </div>
                            {hasActivePaid && (
                                <div>
                                    <span className="block text-primary font-bold font-mono text-sm">
                                        {remainingDays} {t("billing.daysUnit", "kun")}
                                    </span>
                                    <span>{t("billing.remainingDaysLabel", "Qolgan muddat")}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Active Subscription Mode Selector */}
            {hasActivePaid && (
                <div className="bg-card p-4 rounded-2xl border border-border shadow-xs space-y-3">
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                        <Zap className="h-4 w-4 text-primary" /> {t("billing.modeSelector", "Harakat turini tanlang")}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button
                            type="button"
                            onClick={() => setActiveMode('upgrade')}
                            className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3.5 ${
                                activeMode === 'upgrade'
                                    ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm"
                                    : "border-border bg-card hover:bg-muted/40"
                            }`}
                        >
                            <div className={`p-2 rounded-lg shrink-0 ${
                                activeMode === 'upgrade' ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                            }`}>
                                <TrendingUp className="h-5 w-5" />
                            </div>
                            <div className="space-y-1">
                                <span className="font-bold text-sm block text-foreground">
                                    {t("billing.upgradeTab", "Qurilmalar va Arxivni oshirish (Pro-rata)")}
                                </span>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    {t("billing.upgradeDesc", "Hozirgi faol obuna tugaguniga qadar qo'shimcha telefonlar qo'shish yoki audio arxiv muddatini oshirish. To'lov qolgan kunlar uchun hisoblanadi.")}
                                </p>
                            </div>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveMode('renewal')}
                            className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3.5 ${
                                activeMode === 'renewal'
                                    ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm"
                                    : "border-border bg-card hover:bg-muted/40"
                            }`}
                        >
                            <div className={`p-2 rounded-lg shrink-0 ${
                                activeMode === 'renewal' ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                            }`}>
                                <RotateCw className="h-5 w-5" />
                            </div>
                            <div className="space-y-1">
                                <span className="font-bold text-sm block text-foreground">
                                    {t("billing.renewTab", "Obunani uzaytirish")}
                                </span>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    {t("billing.renewDesc", "Hozirgi obunangiz tugaganidan so'ng yangi davr uchun muddatni uzaytirish.")}
                                </p>
                            </div>
                        </button>
                    </div>
                </div>
            )}

            <form onSubmit={handleCheckout} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 space-y-6">

                    {/* === UPGRADE MODE: ADD DEVICES & UPGRADE RETENTION PRO-RATA === */}
                    {hasActivePaid && activeMode === 'upgrade' && (
                        <>
                            {/* 1. Devices Slider for Upgrade */}
                            <div className="bg-card p-6 rounded-2xl border border-border space-y-5 shadow-xs">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="font-semibold text-base flex items-center gap-2">
                                            <Smartphone className="h-5 w-5 text-primary" /> {t("billing.targetDevices", "Yangi umumiy telefonlar miqdori")}
                                        </h3>
                                        <p className="text-xs text-muted-foreground">
                                            {t("billing.currentDevices", "Hozirgi telefonlar")}: <span className="font-semibold text-foreground">{currentAllowed} ta</span>
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8 rounded-md"
                                            onClick={() => setUpgradeTargetDevices((prev) => Math.max(currentAllowed, prev - 1))}
                                            disabled={upgradeTargetDevices <= currentAllowed}
                                        >
                                            <Minus className="h-3.5 w-3.5" />
                                        </Button>
                                        <span className="text-2xl font-bold font-mono text-primary min-w-[3rem] text-center">
                                            {upgradeTargetDevices}
                                        </span>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8 rounded-md"
                                            onClick={() => setUpgradeTargetDevices((prev) => Math.min(50, prev + 1))}
                                            disabled={upgradeTargetDevices >= 50}
                                        >
                                            <Plus className="h-3.5 w-3.5" />
                                        </Button>
                                        <span className="text-sm font-semibold text-muted-foreground">{t("billing.devicesUnit", "ta")}</span>
                                    </div>
                                </div>

                                {/* Slider for target devices */}
                                <div className="space-y-3">
                                    <div className="relative w-full h-8 flex items-center select-none touch-none">
                                        <div className="w-full h-2 bg-secondary rounded-full overflow-hidden relative">
                                            <div
                                                className="h-full bg-primary transition-all duration-75"
                                                style={{ width: `calc(14px + (100% - 28px) * ${upgradePercent / 100})` }}
                                            />
                                        </div>
                                        <div
                                            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 bg-background border-2 border-primary rounded-full shadow-md pointer-events-none transition-all duration-75 flex items-center justify-center ring-2 ring-primary/20"
                                            style={{
                                                left: `calc(14px + (100% - 28px) * ${upgradePercent / 100})`,
                                            }}
                                        >
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                        </div>
                                        <input
                                            type="range"
                                            min={0}
                                            max={100}
                                            step={0.1}
                                            value={upgradePercent}
                                            onChange={(e) => setUpgradeTargetDevices(sliderPercentToCount(Number(e.target.value), upgradeMarks))}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            aria-label="Telefonlar soni"
                                        />
                                    </div>

                                    {/* Marks Buttons aligned with slider */}
                                    <div className="flex justify-between text-xs text-muted-foreground font-mono pt-0.5">
                                        {upgradeMarks.map((num) => (
                                            <button
                                                type="button"
                                                key={num}
                                                onClick={() => setUpgradeTargetDevices(num)}
                                                className={`min-w-[1.75rem] py-0.5 px-1 rounded text-center transition-all ${
                                                    upgradeTargetDevices === num
                                                        ? "bg-primary text-primary-foreground font-bold shadow-xs scale-105"
                                                        : "hover:bg-muted"
                                                }`}
                                            >
                                                {num}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* 2. Audio Archive Retention for Upgrade */}
                            <div className="bg-card p-6 rounded-2xl border border-border space-y-4 shadow-xs">
                                <div>
                                    <h3 className="font-semibold text-base flex items-center gap-2">
                                        <ShieldCheck className="h-5 w-5 text-primary" /> {t("billing.upgradeStepRetention", "Audio arxiv saqlash muddati")}
                                    </h3>
                                    <p className="text-xs text-muted-foreground">
                                        {t("billing.currentRetentionLabel", "Hozirgi arxiv muddati")}: <span className="font-semibold text-foreground">{currentRetention} kun</span>
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
                                    {retentionItems.map((item) => {
                                        const isLower = item.days < currentRetention;
                                        const isSelected = upgradeRetentionDays === item.days;

                                        return (
                                            <div
                                                key={item.days}
                                                onClick={() => {
                                                    if (!isLower) {
                                                        setUpgradeRetentionDays(item.days);
                                                    }
                                                }}
                                                className={`p-3 rounded-xl border text-center text-xs transition-all select-none ${
                                                    isLower
                                                        ? "opacity-40 bg-muted/20 border-border cursor-not-allowed"
                                                        : isSelected
                                                            ? "border-primary bg-primary/5 ring-1 ring-primary cursor-pointer shadow-xs"
                                                            : "border-border bg-card hover:bg-muted/40 cursor-pointer"
                                                }`}
                                            >
                                                <div className="flex items-center justify-center gap-1 font-bold">
                                                    {isLower && <Lock className="h-3 w-3 text-muted-foreground shrink-0" />}
                                                    <span>{item.label}</span>
                                                </div>
                                                <span className="text-[10px] text-muted-foreground block mt-0.5">
                                                    {isLower ? t("billing.cannotLowerRetention", "Kamaytirib bo'lmaydi") : item.extra}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* 3. Upgrade Summary Notice Box */}
                            <div className={`p-4 rounded-xl text-xs font-medium space-y-1.5 transition-all ${
                                isUpgradeChanged
                                    ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-900 dark:text-emerald-300"
                                    : "bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-300"
                            }`}>
                                <div className="flex items-center gap-2 font-bold">
                                    {isUpgradeChanged ? (
                                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                                    ) : (
                                        <Info className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                                    )}
                                    <span>
                                        {isUpgradeChanged ? (
                                            <>
                                                {isDevicesChanged && `+${additionalDevices} ta telefon qo'shilmoqda`}
                                                {isDevicesChanged && isRetentionChanged && ", "}
                                                {isRetentionChanged && `arxiv muddati ${currentRetention} dan ${upgradeRetentionDays} kunga oshirilmoqda`}
                                            </>
                                        ) : (
                                            t("billing.upgradeNoChange", "Kamida bitta parametrni oshiring (Telefonlar soni yoki Arxiv muddati)")
                                        )}
                                    </span>
                                </div>
                                <p className="text-muted-foreground text-[11px] leading-relaxed">
                                    {t("billing.proratedExplanation", {
                                        date: tenant.subscription_expires_at ? formatDate(tenant.subscription_expires_at) : "",
                                        defaultValue: `To'lov amalga oshirilgach, yangi parametrlar darhol kuchga kiradi. Obunaning umumiy amal qilish muddati o'zgarmaydi.`
                                    })}
                                </p>
                            </div>
                        </>
                    )}

                    {/* === RENEWAL / STANDARD MODE === */}
                    {(!hasActivePaid || activeMode === 'renewal') && (
                        <>
                            {/* Devices Count */}
                            <div className="bg-card p-6 rounded-2xl border border-border space-y-4 shadow-xs">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="font-semibold text-base flex items-center gap-2">
                                            <Smartphone className="h-5 w-5 text-primary" /> {t("billing.step2Devices", "Telefonlar (Agentlar) soni")}
                                        </h3>
                                        <p className="text-xs text-muted-foreground">
                                            {hasActivePaid
                                                ? t("billing.renewMinDevicesNotice", { count: currentAllowed, defaultValue: `Faol obunani uzaytirishda telefonlar soni kamida ${currentAllowed} ta bo'ladi` })
                                                : t("billing.step2DevicesDesc", "Bir vaqtda qo'ng'iroqlari yoziladigan xodimlar soni")
                                            }
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            className="h-7 w-7 rounded-md"
                                            onClick={() => {
                                                if (hasActivePaid) {
                                                    setRenewalDevicesCount((prev) => Math.max(currentAllowed, prev - 1));
                                                } else {
                                                    setStandardDevicesCount((prev) => Math.max(1, prev - 1));
                                                }
                                            }}
                                            disabled={hasActivePaid ? renewalDevicesCount <= currentAllowed : standardDevicesCount <= 1}
                                        >
                                            <Minus className="h-3.5 w-3.5" />
                                        </Button>
                                        <span className="text-xl font-bold font-mono text-primary min-w-[2.5rem] text-center">
                                            {hasActivePaid ? renewalDevicesCount : standardDevicesCount}
                                        </span>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            className="h-7 w-7 rounded-md"
                                            onClick={() => {
                                                if (hasActivePaid) {
                                                    setRenewalDevicesCount((prev) => Math.min(50, prev + 1));
                                                } else {
                                                    setStandardDevicesCount((prev) => Math.min(50, prev + 1));
                                                }
                                            }}
                                            disabled={(hasActivePaid ? renewalDevicesCount : standardDevicesCount) >= 50}
                                        >
                                            <Plus className="h-3.5 w-3.5" />
                                        </Button>
                                        <span className="text-sm font-semibold text-muted-foreground">{t("billing.devicesUnit", "ta")}</span>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="relative w-full h-8 flex items-center select-none touch-none">
                                        <div className="w-full h-2 bg-secondary rounded-full overflow-hidden relative">
                                            <div
                                                className="h-full bg-primary transition-all duration-75"
                                                style={{
                                                    width: `calc(14px + (100% - 28px) * ${renewalPercent / 100})`,
                                                }}
                                            />
                                        </div>
                                        <div
                                            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 bg-background border-2 border-primary rounded-full shadow-md pointer-events-none transition-all duration-75 flex items-center justify-center ring-2 ring-primary/20"
                                            style={{
                                                left: `calc(14px + (100% - 28px) * ${renewalPercent / 100})`,
                                            }}
                                        >
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                        </div>
                                        <input
                                            type="range"
                                            min={0}
                                            max={100}
                                            step={0.1}
                                            value={renewalPercent}
                                            onChange={(e) => {
                                                const val = sliderPercentToCount(Number(e.target.value), renewalMarks);
                                                if (hasActivePaid) setRenewalDevicesCount(val);
                                                else setStandardDevicesCount(val);
                                            }}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            aria-label="Telefonlar soni"
                                        />
                                    </div>

                                    <div className="flex justify-between text-xs text-muted-foreground font-mono pt-0.5">
                                        {renewalMarks.map((num) => {
                                            const activeCount = hasActivePaid ? renewalDevicesCount : standardDevicesCount;
                                            return (
                                                <button
                                                    type="button"
                                                    key={num}
                                                    onClick={() => {
                                                        if (hasActivePaid) setRenewalDevicesCount(num);
                                                        else setStandardDevicesCount(num);
                                                    }}
                                                    className={`min-w-[1.75rem] py-0.5 px-1 rounded text-center transition-all ${
                                                        activeCount === num
                                                            ? "bg-primary text-primary-foreground font-bold shadow-xs scale-105"
                                                            : "hover:bg-muted"
                                                    }`}
                                                >
                                                    {num}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {volumeDiscount > 0 && (
                                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                                        {t("billing.volumeDiscountApplied", "Hajm bo'yicha {{percent}}% chegirma qo'llandi!", { percent: volumeDiscount })}
                                    </p>
                                )}
                            </div>

                            {/* Subscription Period Selection */}
                            <div className="bg-card p-6 rounded-2xl border border-border space-y-4 shadow-xs">
                                <h3 className="font-semibold text-base flex items-center gap-2">
                                    <Calendar className="h-5 w-5 text-primary" /> {t("billing.step3Period", "To'lov davri")}
                                </h3>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {[
                                        { m: 1, label: t("billing.month1", "1 oy"), discount: null },
                                        { m: 3, label: t("billing.month3", "3 oy"), discount: t("billing.discount5", "5% chegirma") },
                                        { m: 6, label: t("billing.month6", "6 oy"), discount: t("billing.discount10", "10% chegirma") },
                                        { m: 12, label: t("billing.month12", "12 oy (1 yil)"), discount: t("billing.discount20", "20% chegirma") },
                                    ].map((item) => (
                                        <div
                                            key={item.m}
                                            onClick={() => setMonths(item.m)}
                                            className={`p-4 rounded-xl border cursor-pointer text-center transition-all ${
                                                months === item.m
                                                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                                                    : "border-border bg-card hover:bg-muted/40"
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

                                {hasActivePaid && tenant?.subscription_expires_at && (
                                    <p className="text-xs text-muted-foreground flex items-center gap-1.5 pt-1">
                                        <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
                                        <span>
                                            {t("billing.renewalExplanation", {
                                                date: formatDate(tenant.subscription_expires_at),
                                                defaultValue: `Yangi obuna muddati hozirgi obunangiz (${formatDate(tenant.subscription_expires_at)}) tugaganidan so'ng uzaytiriladi.`
                                            })}
                                        </span>
                                    </p>
                                )}
                            </div>

                            {/* Archive Retention Selection */}
                            <div className="bg-card p-6 rounded-2xl border border-border space-y-4 shadow-xs">
                                <div>
                                    <h3 className="font-semibold text-base flex items-center gap-2">
                                        <ShieldCheck className="h-5 w-5 text-primary" /> {t("billing.step4Retention", "Ovozli qo'ng'iroqlar arxivini saqlash")}
                                    </h3>
                                    <p className="text-xs text-muted-foreground">{t("billing.step4RetentionDesc", "Qo'ng'iroq yozuvlari va tahlillar bazada qancha muddat saqlanishi kerak?")}</p>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
                                    {retentionItems.map((item) => (
                                        <div
                                            key={item.days}
                                            onClick={() => setRenewalRetentionDays(item.days)}
                                            className={`p-3 rounded-xl border cursor-pointer text-center text-xs transition-all ${
                                                renewalRetentionDays === item.days
                                                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                                                    : "border-border bg-card hover:bg-muted/40"
                                            }`}
                                        >
                                            <span className="font-bold block">{item.label}</span>
                                            <span className="text-[10px] text-muted-foreground block mt-0.5">{item.extra}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                </div>

                {/* Right Column: Payment Method & Order Summary */}
                <div className="lg:col-span-1 space-y-4 sticky top-6">
                    {/* Payment Method Selection Card */}
                    <div className="bg-card p-4 rounded-xl border border-border shadow-xs space-y-2.5">
                        <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <CreditCard className="h-3.5 w-3.5 text-primary" /> {t("billing.step5Payment", "To'lov tizimini tanlang")}
                        </h3>

                        <div className="space-y-1.5">
                            {paymentMethods.map((method) => {
                                const isSelected = selectedPaymentMethod === method.code;
                                return (
                                    <div
                                        key={method.code}
                                        onClick={() => setSelectedPaymentMethod(method.code)}
                                        className={`p-2.5 rounded-xl border cursor-pointer flex items-center justify-between transition-all select-none ${
                                            isSelected
                                                ? "border-primary bg-primary/5 ring-1 ring-primary shadow-xs"
                                                : "border-border bg-card hover:bg-muted/40"
                                        }`}
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <PaymentMethodLogo code={method.code} className="h-5" />
                                            <div className="min-w-0">
                                                <span className="font-bold text-xs block truncate leading-tight">
                                                    {method.code === "card_transfer"
                                                        ? t("billing.p2pTransfer", method.name)
                                                        : method.code === "lemonsqueezy"
                                                            ? t("billing.intlCards", method.name)
                                                            : method.name}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground block truncate leading-tight">
                                                    {method.code === "lemonsqueezy" ? t("billing.usdCards", "USD (Visa, Mastercard)") : t("billing.uzsCards", "UZS (Humo / Uzcard)")}
                                                </span>
                                            </div>
                                        </div>
                                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ml-2 transition-colors ${
                                            isSelected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30"
                                        }`}>
                                            {isSelected && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Order Summary & Checkout Card */}
                    <div className="bg-card p-4 rounded-xl border border-border shadow-xs space-y-3">
                        <h3 className="font-bold text-sm border-b border-border pb-2 text-foreground flex items-center justify-between">
                            <span>{t("billing.orderSummary", "Buyurtma tafsilotlari")}</span>
                            {hasActivePaid && activeMode === 'upgrade' && (
                                <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">
                                    Pro-rata
                                </span>
                            )}
                        </h3>

                        {hasActivePaid && activeMode === 'upgrade' ? (
                            /* UPGRADE SUMMARY */
                            <div className="space-y-2 text-xs">
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">{t("billing.currentDevices", "Hozirgi telefonlar:")}</span>
                                    <span className="font-semibold font-mono">{currentAllowed} {t("billing.devicesUnit", "ta")}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">{t("billing.targetDevices", "Yangi miqdor:")}</span>
                                    <span className="font-bold font-mono text-primary">
                                        {upgradeTargetDevices} {t("billing.devicesUnit", "ta")}
                                        {isDevicesChanged && ` (+${additionalDevices})`}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">{t("billing.retentionLabel", "Arxiv saqlash:")}</span>
                                    <span className={`font-semibold font-mono ${isRetentionChanged ? "text-emerald-600 dark:text-emerald-400 font-bold" : ""}`}>
                                        {upgradeRetentionDays} {t("billing.daysUnit", "kun")}
                                        {isRetentionChanged && ` (+${upgradeRetentionDays - currentRetention})`}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">{t("billing.remainingDaysLabel", "Qolgan muddat:")}</span>
                                    <span className="font-semibold font-mono">{remainingDays} {t("billing.daysUnit", "kun")}</span>
                                </div>

                                <div className="border-t border-border pt-2.5 flex justify-between items-baseline">
                                    <span className="text-xs font-bold">{t("billing.totalPriceLabel", "Jami to'lov:")}</span>
                                    <div className="text-right">
                                        <span className="text-xl font-extrabold font-mono text-primary block leading-tight">
                                            {proratedTotalUzs.toLocaleString("uz-UZ")} UZS
                                        </span>
                                        <span className="text-[11px] text-muted-foreground font-mono">
                                            (~{proratedTotalUsd} USD)
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* RENEWAL / STANDARD SUMMARY */
                            <div className="space-y-2 text-xs">
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">{t("billing.devicesCountLabel", "Telefonlar soni:")}</span>
                                    <span className="font-semibold font-mono">{activeRenewalDevices} {t("billing.devicesUnit", "ta")}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">{t("billing.periodLabel", "Muddat:")}</span>
                                    <span className="font-semibold font-mono">{months} {t("billing.monthsUnit", "oy")}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">{t("billing.retentionLabel", "Arxiv saqlash:")}</span>
                                    <span className="font-semibold font-mono">{renewalRetentionDays} {t("billing.daysUnit", "kun")}</span>
                                </div>

                                {totalDiscount > 0 && (
                                    <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-semibold">
                                        <span>{t("billing.totalDiscountLabel", "Jami chegirma:")}</span>
                                        <span>-{totalDiscount}%</span>
                                    </div>
                                )}

                                <div className="border-t border-border pt-2.5 flex justify-between items-baseline">
                                    <span className="text-xs font-bold">{t("billing.totalPriceLabel", "Jami to'lov:")}</span>
                                    <div className="text-right">
                                        <span className="text-xl font-extrabold font-mono text-primary block leading-tight">
                                            {renewalTotalUzs.toLocaleString("uz-UZ")} UZS
                                        </span>
                                        <span className="text-[11px] text-muted-foreground font-mono">
                                            (~{renewalTotalUsd} USD)
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <Button
                            type="submit"
                            size="default"
                            className="w-full font-bold shadow-sm h-10 text-sm cursor-pointer"
                            disabled={processing || (hasActivePaid && activeMode === 'upgrade' && !isUpgradeChanged)}
                        >
                            {processing
                                ? t("billing.loading", "Yuklanmoqda...")
                                : hasActivePaid && activeMode === 'upgrade'
                                    ? isUpgradeChanged
                                        ? t("billing.upgradeProceed", "Tarifni oshirish va to'lash")
                                        : t("billing.upgradeNoChange", "Kamida bittasini oshiring")
                                    : t("billing.proceedToPayment", "To'lovga o'tish")}
                        </Button>

                        <p className="text-[10px] text-muted-foreground text-center leading-tight">
                            {hasActivePaid && activeMode === 'upgrade'
                                ? t("billing.upgradeNote", "To'lov tasdiqlangach, yangi parametrlar darhol faollashadi.")
                                : t("billing.autoRenewNote", "To'lov tasdiqlangach, obunangiz avtomatik ravishda faollashtiriladi.")}
                        </p>
                    </div>
                </div>
            </form>
        </div>
    );
}
