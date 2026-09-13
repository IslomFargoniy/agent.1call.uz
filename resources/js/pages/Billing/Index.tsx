import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Head, router, Link } from '@inertiajs/react';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PaymentMethodLogo } from '@/components/brand-logos';
import { formatDate } from '@/lib/datetime';

interface Tariff {
    id: number;
    name: string;
    code: string;
    base_price_monthly: number;
    price_usd_monthly: number;
    discounts: {
        type: string;
        min_value: number;
        max_value?: number | null;
        discount_percent: number;
    }[];
    retention_options: {
        retention_days: number;
        additional_price_monthly: number;
        additional_price_usd_monthly: number;
    }[];
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
        contract_months?: number;
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
            return Math.max(
                minC,
                Math.min(maxC, Math.round(minC + fraction * (maxC - minC))),
            );
        }
    }
    return marks[marks.length - 1];
}

export default function BillingIndex({
    tenant,
    tariffs,
    paymentMethods,
}: BillingProps) {
    const { t } = useTranslation();
    const defaultTariff = tariffs[0] || null;

    const hasActivePaid = Boolean(
        tenant?.has_active_paid && tenant?.subscription_expires_at,
    );
    const remainingDays = Math.max(1, tenant?.remaining_days || 1);
    const currentAllowed = Math.max(1, tenant?.allowed_devices_count || 2);
    const currentRetention = Math.max(30, tenant?.audio_retention_days || 30);

    // Active mode: 'upgrade' (Add devices / upgrade retention pro-rata) or 'renewal' (Extend subscription)
    const [activeMode, setActiveMode] = useState<'upgrade' | 'renewal'>(
        hasActivePaid && remainingDays <= 10
            ? 'renewal'
            : hasActivePaid
              ? 'upgrade'
              : 'renewal',
    );

    // Upgrade target devices (>= currentAllowed)
    const [upgradeTargetDevices, setUpgradeTargetDevices] =
        useState<number>(currentAllowed);

    // Upgrade target retention (>= currentRetention)
    const [upgradeRetentionDays, setUpgradeRetentionDays] =
        useState<number>(currentRetention);

    // Renewal devices count (>= currentAllowed when active)
    const [renewalDevicesCount, setRenewalDevicesCount] =
        useState<number>(currentAllowed);

    // Standard devices count (for trial / expired)
    const [standardDevicesCount, setStandardDevicesCount] = useState<number>(
        currentAllowed || 2,
    );

    const [selectedTariff, setSelectedTariff] = useState<Tariff | null>(
        defaultTariff,
    );
    const [renewalRetentionDays, setRenewalRetentionDays] =
        useState<number>(currentRetention);
    const [months, setMonths] = useState(1);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(
        paymentMethods[0]?.code || 'payme',
    );
    const [processing, setProcessing] = useState(false);

    // Memoized slider marks and percentages
    const renewalMarks = useMemo(() => {
        return getMarks(hasActivePaid ? currentAllowed : 1, 50);
    }, [hasActivePaid, currentAllowed]);

    const renewalPercent = useMemo(() => {
        return countToSliderPercent(
            hasActivePaid ? renewalDevicesCount : standardDevicesCount,
            renewalMarks,
        );
    }, [
        hasActivePaid,
        renewalDevicesCount,
        standardDevicesCount,
        renewalMarks,
    ]);

    const upgradeMarks = useMemo(() => {
        return getMarks(currentAllowed, 50);
    }, [currentAllowed]);

    const upgradePercent = useMemo(() => {
        return countToSliderPercent(upgradeTargetDevices, upgradeMarks);
    }, [upgradeTargetDevices, upgradeMarks]);

    // Base Pricing Rates
    const baseUzs = selectedTariff
        ? Number(selectedTariff.base_price_monthly)
        : 0;
    const baseUsd = selectedTariff
        ? Number(selectedTariff.price_usd_monthly)
        : 0;

    // Helper for retention addon
    const getRetentionAddon = (days: number) => {
        if (days <= 30 || !selectedTariff) return { uzs: 0, usd: 0 };
        const opt = selectedTariff.retention_options?.find(
            (o) => o.retention_days === days,
        );
        return {
            uzs: opt ? Number(opt.additional_price_monthly) : 0,
            usd: opt ? Number(opt.additional_price_usd_monthly) : 0,
        };
    };

    const activeContractMonths = tenant?.contract_months || 1;

    // Calculate monthly rate for a given device count and retention (including volume and active contract discounts)
    const calculateMonthlyRate = (
        devices: number,
        retentionDays: number,
        contractMonths: number = activeContractMonths,
    ) => {
        const retAddon = getRetentionAddon(retentionDays);
        const rateUzs = baseUzs + retAddon.uzs;
        const rateUsd = baseUsd + retAddon.usd;
        const subUzs = rateUzs * devices;
        const subUsd = rateUsd * devices;

        let volDisc = 0;
        const dbVol = selectedTariff?.discounts
            ?.filter(
                (d) =>
                    d.type === 'device_volume' &&
                    devices >= d.min_value &&
                    (!d.max_value || devices <= d.max_value),
            )
            .sort(
                (a, b) =>
                    Number(b.discount_percent) - Number(a.discount_percent),
            )[0];

        if (dbVol) {
            volDisc = Number(dbVol.discount_percent);
        } else {
            if (devices >= 20) volDisc = 15;
            else if (devices >= 10) volDisc = 10;
            else if (devices >= 5) volDisc = 5;
        }

        let periodDisc = 0;
        const dbPeriod = selectedTariff?.discounts
            ?.filter(
                (d) =>
                    d.type === 'period' &&
                    contractMonths >= d.min_value &&
                    (!d.max_value || contractMonths <= d.max_value),
            )
            .sort(
                (a, b) =>
                    Number(b.discount_percent) - Number(a.discount_percent),
            )[0];

        if (dbPeriod) {
            periodDisc = Number(dbPeriod.discount_percent);
        } else {
            if (contractMonths >= 12) periodDisc = 20;
            else if (contractMonths >= 6) periodDisc = 10;
            else if (contractMonths >= 3) periodDisc = 5;
        }

        const totalDisc = Math.min(40, volDisc + periodDisc);
        const factor = (100 - totalDisc) / 100;
        return {
            uzs: Math.round(subUzs * factor),
            usd: Math.round(subUsd * factor * 100) / 100,
        };
    };

    // === UPGRADE (PRO-RATA) CALCULATION ===
    const isDevicesChanged = upgradeTargetDevices > currentAllowed;
    const isRetentionChanged = upgradeRetentionDays > currentRetention;
    const isUpgradeChanged = isDevicesChanged || isRetentionChanged;
    const additionalDevices = Math.max(
        0,
        upgradeTargetDevices - currentAllowed,
    );

    const currentMonthly = calculateMonthlyRate(
        currentAllowed,
        currentRetention,
    );
    const upgradeTargetMonthly = calculateMonthlyRate(
        upgradeTargetDevices,
        upgradeRetentionDays,
    );

    // Monthly difference
    const monthlyDiffUzs = Math.max(
        0,
        upgradeTargetMonthly.uzs - currentMonthly.uzs,
    );
    const monthlyDiffUsd = Math.max(
        0,
        upgradeTargetMonthly.usd - currentMonthly.usd,
    );

    // Prorated cost for remaining days
    const proratedTotalUzs = Math.ceil((monthlyDiffUzs / 30.0) * remainingDays);
    const proratedTotalUsd =
        Math.round((monthlyDiffUsd / 30.0) * remainingDays * 100) / 100;

    // === RENEWAL & STANDARD CALCULATION ===
    const activeRenewalDevices = hasActivePaid
        ? renewalDevicesCount
        : standardDevicesCount;
    const renewalRetAddon = getRetentionAddon(renewalRetentionDays);
    const deviceRateMonthlyUzs = baseUzs + renewalRetAddon.uzs;
    const deviceRateMonthlyUsd = baseUsd + renewalRetAddon.usd;

    const subtotalUzs = deviceRateMonthlyUzs * activeRenewalDevices * months;
    const subtotalUsd = deviceRateMonthlyUsd * activeRenewalDevices * months;

    // Dynamic Discounts for Renewal
    let periodDiscount = 0;
    const dbPeriod = selectedTariff?.discounts
        ?.filter(
            (d) =>
                d.type === 'period' &&
                months >= d.min_value &&
                (!d.max_value || months <= d.max_value),
        )
        .sort(
            (a, b) => Number(b.discount_percent) - Number(a.discount_percent),
        )[0];

    if (dbPeriod) {
        periodDiscount = Number(dbPeriod.discount_percent);
    } else {
        if (months === 12) periodDiscount = 20;
        else if (months === 6) periodDiscount = 10;
        else if (months === 3) periodDiscount = 5;
    }

    let volumeDiscount = 0;
    const dbVolume = selectedTariff?.discounts
        ?.filter(
            (d) =>
                d.type === 'device_volume' &&
                activeRenewalDevices >= d.min_value &&
                (!d.max_value || activeRenewalDevices <= d.max_value),
        )
        .sort(
            (a, b) => Number(b.discount_percent) - Number(a.discount_percent),
        )[0];

    if (dbVolume) {
        volumeDiscount = Number(dbVolume.discount_percent);
    } else {
        if (activeRenewalDevices >= 20) volumeDiscount = 15;
        else if (activeRenewalDevices >= 10) volumeDiscount = 10;
        else if (activeRenewalDevices >= 5) volumeDiscount = 5;
    }

    const totalDiscount = Math.min(40, periodDiscount + volumeDiscount);
    const discountFactor = (100 - totalDiscount) / 100;
    const renewalPeriodTotalUzs = Math.round(subtotalUzs * discountFactor);
    const renewalPeriodTotalUsd =
        Math.round(subtotalUsd * discountFactor * 100) / 100;

    // Renewal with upgrade over current active subscription
    const isRenewalUpgraded = Boolean(
        hasActivePaid &&
        (activeRenewalDevices > currentAllowed ||
            renewalRetentionDays > currentRetention),
    );

    const renewalTargetMonthly = calculateMonthlyRate(
        activeRenewalDevices,
        renewalRetentionDays,
    );
    const renewalMonthlyDiffUzs = isRenewalUpgraded
        ? Math.max(0, renewalTargetMonthly.uzs - currentMonthly.uzs)
        : 0;
    const renewalMonthlyDiffUsd = isRenewalUpgraded
        ? Math.max(0, renewalTargetMonthly.usd - currentMonthly.usd)
        : 0;

    const renewalProratedUzs = Math.ceil(
        (renewalMonthlyDiffUzs / 30.0) * remainingDays,
    );
    const renewalProratedUsd =
        Math.round((renewalMonthlyDiffUsd / 30.0) * remainingDays * 100) / 100;

    const renewalTotalUzs = renewalPeriodTotalUzs + renewalProratedUzs;
    const renewalTotalUsd =
        Math.round((renewalPeriodTotalUsd + renewalProratedUsd) * 100) / 100;

    // Dynamic Retention items list
    const retentionItems = [
        {
            days: 30,
            label: t('billing.days30', '30 kun'),
            extra: t('billing.standardPrice', "Standart (0 so'm)"),
        },
        ...[60, 90, 180, 365].map((d) => {
            const opt = selectedTariff?.retention_options?.find(
                (o) => o.retention_days === d,
            );
            const extraText = opt
                ? selectedPaymentMethod === 'lemonsqueezy'
                    ? `+$${Number(opt.additional_price_usd_monthly).toFixed(2)}`
                    : `+${Number(opt.additional_price_monthly).toLocaleString('uz-UZ')} so'm`
                : d === 60
                  ? "+10 000 so'm"
                  : d === 90
                    ? "+20 000 so'm"
                    : d === 180
                      ? "+35 000 so'm"
                      : "+50 000 so'm";
            return {
                days: d,
                label:
                    d === 365 ? t('billing.year1', '1 yil (365k)') : `${d} kun`,
                extra: extraText,
            };
        }),
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
            router.post(
                '/billing/checkout',
                {
                    action_type: 'upgrade_devices',
                    tariff_id: selectedTariff.id,
                    devices_count: upgradeTargetDevices,
                    retention_days: upgradeRetentionDays,
                    payment_method: selectedPaymentMethod,
                },
                {
                    onFinish: () => setProcessing(false),
                },
            );
        } else {
            router.post(
                '/billing/checkout',
                {
                    action_type: 'renewal',
                    tariff_id: selectedTariff.id,
                    devices_count: hasActivePaid
                        ? renewalDevicesCount
                        : standardDevicesCount,
                    retention_days: renewalRetentionDays,
                    months: months,
                    payment_method: selectedPaymentMethod,
                },
                {
                    onFinish: () => setProcessing(false),
                },
            );
        }
    };

    return (
        <div className="mx-auto max-w-6xl space-y-8 p-6">
            <Head title={t('billing.title', "To'lovlar va Tariflar")} />

            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">
                        {t('billing.title', "Obuna va To'lovlar")}
                    </h2>
                    <p className="text-muted-foreground text-sm">
                        {t(
                            'billing.subtitle',
                            'Kompaniyangiz uchun qulay tarif va muddatni tanlang',
                        )}
                    </p>
                </div>

                <Button asChild variant="outline" size="sm">
                    <Link href="/billing/invoices">
                        <Receipt className="mr-1.5 h-4 w-4" />{' '}
                        {t(
                            'billing.invoicesHistory',
                            'Hisob-fakturalar (Invoices)',
                        )}
                    </Link>
                </Button>
            </div>

            {/* Current Status Box */}
            {tenant && (
                <div className="bg-card border-border flex flex-col justify-between gap-6 rounded-2xl border p-6 shadow-xs md:flex-row md:items-center">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-lg font-bold">
                                {tenant.name}
                            </span>
                            {tenant.is_trial && (
                                <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-600">
                                    {t(
                                        'billing.trialPeriodBadge',
                                        '14 kunlik Sinov davri',
                                    )}
                                </span>
                            )}
                            {tenant.is_grace_period && (
                                <span className="rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-semibold text-red-600">
                                    {t(
                                        'billing.gracePeriodBadge',
                                        'Grace Period (3 kun)',
                                    )}
                                </span>
                            )}
                            {tenant.is_active &&
                                !tenant.is_trial &&
                                !tenant.is_grace_period && (
                                    <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600">
                                        {t(
                                            'billing.activeSubscriptionBadge',
                                            'Obuna faol',
                                        )}
                                    </span>
                                )}
                        </div>

                        <div className="text-muted-foreground mt-3 grid grid-cols-2 gap-4 text-xs md:grid-cols-4">
                            <div>
                                <span className="text-foreground block font-semibold">
                                    {tenant.allowed_devices_count}{' '}
                                    {t('billing.devicesUnit', 'ta')}
                                </span>
                                <span>
                                    {t(
                                        'billing.allowedDevicesLabel',
                                        'Ruxsat etilgan telefonlar',
                                    )}
                                </span>
                            </div>
                            <div>
                                <span className="text-foreground block font-semibold">
                                    {tenant.audio_retention_days}{' '}
                                    {t('billing.daysUnit', 'kun')}
                                </span>
                                <span>
                                    {t(
                                        'billing.retentionDaysLabel',
                                        'Arxiv saqlash muddati',
                                    )}
                                </span>
                            </div>
                            <div>
                                <span className="text-foreground block font-semibold">
                                    {tenant.subscription_expires_at
                                        ? formatDate(
                                              tenant.subscription_expires_at,
                                          )
                                        : tenant.trial_ends_at
                                          ? formatDate(tenant.trial_ends_at)
                                          : '—'}
                                </span>
                                <span>
                                    {tenant.is_trial
                                        ? t(
                                              'billing.trialPeriod',
                                              'Sinov muddati tugashi',
                                          )
                                        : t(
                                              'billing.expiresAt',
                                              'Amal qilish muddati',
                                          )}
                                </span>
                            </div>
                            {hasActivePaid && (
                                <div>
                                    <span className="text-primary block font-mono text-sm font-bold">
                                        {remainingDays}{' '}
                                        {t('billing.daysUnit', 'kun')}
                                    </span>
                                    <span>
                                        {t(
                                            'billing.remainingDaysLabel',
                                            'Qolgan muddat',
                                        )}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Active Subscription Mode Selector */}
            {hasActivePaid && (
                <div className="bg-card border-border space-y-3 rounded-2xl border p-4 shadow-xs">
                    <h3 className="flex items-center gap-2 text-sm font-semibold">
                        <Zap className="text-primary h-4 w-4" />{' '}
                        {t('billing.modeSelector', 'Harakat turini tanlang')}
                    </h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <button
                            type="button"
                            onClick={() => setActiveMode('upgrade')}
                            className={`flex cursor-pointer items-start gap-3.5 rounded-xl border p-4 text-left transition-all ${
                                activeMode === 'upgrade'
                                    ? 'border-primary bg-primary/5 ring-primary/20 shadow-sm ring-2'
                                    : 'border-border bg-card hover:bg-muted/40'
                            }`}
                        >
                            <div
                                className={`shrink-0 rounded-lg p-2 ${
                                    activeMode === 'upgrade'
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted text-muted-foreground'
                                }`}
                            >
                                <TrendingUp className="h-5 w-5" />
                            </div>
                            <div className="space-y-1">
                                <span className="text-foreground block text-sm font-bold">
                                    {t(
                                        'billing.upgradeTab',
                                        'Qurilmalar va Arxivni oshirish (Pro-rata)',
                                    )}
                                </span>
                                <p className="text-muted-foreground text-xs leading-relaxed">
                                    {t(
                                        'billing.upgradeDesc',
                                        "Hozirgi faol obuna tugaguniga qadar qo'shimcha telefonlar qo'shish yoki audio arxiv muddatini oshirish. To'lov qolgan kunlar uchun hisoblanadi.",
                                    )}
                                </p>
                            </div>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveMode('renewal')}
                            className={`flex cursor-pointer items-start gap-3.5 rounded-xl border p-4 text-left transition-all ${
                                activeMode === 'renewal'
                                    ? 'border-primary bg-primary/5 ring-primary/20 shadow-sm ring-2'
                                    : 'border-border bg-card hover:bg-muted/40'
                            }`}
                        >
                            <div
                                className={`shrink-0 rounded-lg p-2 ${
                                    activeMode === 'renewal'
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted text-muted-foreground'
                                }`}
                            >
                                <RotateCw className="h-5 w-5" />
                            </div>
                            <div className="space-y-1">
                                <span className="text-foreground block text-sm font-bold">
                                    {t(
                                        'billing.renewTab',
                                        'Obunani uzaytirish',
                                    )}
                                </span>
                                <p className="text-muted-foreground text-xs leading-relaxed">
                                    {t(
                                        'billing.renewDesc',
                                        "Hozirgi obunangiz tugaganidan so'ng yangi davr uchun muddatni uzaytirish.",
                                    )}
                                </p>
                            </div>
                        </button>
                    </div>
                </div>
            )}

            <form
                onSubmit={handleCheckout}
                className="grid grid-cols-1 items-start gap-8 lg:grid-cols-3"
            >
                <div className="space-y-6 lg:col-span-2">
                    {/* === UPGRADE MODE: ADD DEVICES & UPGRADE RETENTION PRO-RATA === */}
                    {hasActivePaid && activeMode === 'upgrade' && (
                        <>
                            {/* 1. Devices Slider for Upgrade */}
                            <div className="bg-card border-border space-y-5 rounded-2xl border p-6 shadow-xs">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="flex items-center gap-2 text-base font-semibold">
                                            <Smartphone className="text-primary h-5 w-5" />{' '}
                                            {t(
                                                'billing.targetDevices',
                                                'Yangi umumiy telefonlar miqdori',
                                            )}
                                        </h3>
                                        <p className="text-muted-foreground text-xs">
                                            {t(
                                                'billing.currentDevices',
                                                'Hozirgi telefonlar',
                                            )}
                                            :{' '}
                                            <span className="text-foreground font-semibold">
                                                {currentAllowed} ta
                                            </span>
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8 rounded-md"
                                            onClick={() =>
                                                setUpgradeTargetDevices(
                                                    (prev) =>
                                                        Math.max(
                                                            currentAllowed,
                                                            prev - 1,
                                                        ),
                                                )
                                            }
                                            disabled={
                                                upgradeTargetDevices <=
                                                currentAllowed
                                            }
                                        >
                                            <Minus className="h-3.5 w-3.5" />
                                        </Button>
                                        <span className="text-primary min-w-[3rem] text-center font-mono text-2xl font-bold">
                                            {upgradeTargetDevices}
                                        </span>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8 rounded-md"
                                            onClick={() =>
                                                setUpgradeTargetDevices(
                                                    (prev) =>
                                                        Math.min(50, prev + 1),
                                                )
                                            }
                                            disabled={
                                                upgradeTargetDevices >= 50
                                            }
                                        >
                                            <Plus className="h-3.5 w-3.5" />
                                        </Button>
                                        <span className="text-muted-foreground text-sm font-semibold">
                                            {t('billing.devicesUnit', 'ta')}
                                        </span>
                                    </div>
                                </div>

                                {/* Slider for target devices */}
                                <div className="space-y-3">
                                    <div className="relative flex h-8 w-full touch-none items-center select-none">
                                        <div className="bg-secondary relative h-2 w-full overflow-hidden rounded-full">
                                            <div
                                                className="bg-primary h-full transition-all duration-75"
                                                style={{
                                                    width: `calc(14px + (100% - 28px) * ${upgradePercent / 100})`,
                                                }}
                                            />
                                        </div>
                                        <div
                                            className="bg-background border-primary ring-primary/20 pointer-events-none absolute top-1/2 flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 shadow-md ring-2 transition-all duration-75"
                                            style={{
                                                left: `calc(14px + (100% - 28px) * ${upgradePercent / 100})`,
                                            }}
                                        >
                                            <div className="bg-primary h-1.5 w-1.5 rounded-full" />
                                        </div>
                                        <input
                                            type="range"
                                            min={0}
                                            max={100}
                                            step={0.1}
                                            value={upgradePercent}
                                            onChange={(e) =>
                                                setUpgradeTargetDevices(
                                                    sliderPercentToCount(
                                                        Number(e.target.value),
                                                        upgradeMarks,
                                                    ),
                                                )
                                            }
                                            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                                            aria-label="Telefonlar soni"
                                        />
                                    </div>

                                    {/* Marks Buttons aligned with slider */}
                                    <div className="text-muted-foreground flex justify-between pt-0.5 font-mono text-xs">
                                        {upgradeMarks.map((num) => (
                                            <button
                                                type="button"
                                                key={num}
                                                onClick={() =>
                                                    setUpgradeTargetDevices(num)
                                                }
                                                className={`min-w-[1.75rem] rounded px-1 py-0.5 text-center transition-all ${
                                                    upgradeTargetDevices === num
                                                        ? 'bg-primary text-primary-foreground scale-105 font-bold shadow-xs'
                                                        : 'hover:bg-muted'
                                                }`}
                                            >
                                                {num}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* 2. Audio Archive Retention for Upgrade */}
                            <div className="bg-card border-border space-y-4 rounded-2xl border p-6 shadow-xs">
                                <div>
                                    <h3 className="flex items-center gap-2 text-base font-semibold">
                                        <ShieldCheck className="text-primary h-5 w-5" />{' '}
                                        {t(
                                            'billing.upgradeStepRetention',
                                            'Audio arxiv saqlash muddati',
                                        )}
                                    </h3>
                                    <p className="text-muted-foreground text-xs">
                                        {t(
                                            'billing.currentRetentionLabel',
                                            'Hozirgi arxiv muddati',
                                        )}
                                        :{' '}
                                        <span className="text-foreground font-semibold">
                                            {currentRetention} kun
                                        </span>
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-2.5 md:grid-cols-5">
                                    {retentionItems.map((item) => {
                                        const isLower =
                                            item.days < currentRetention;
                                        const isSelected =
                                            upgradeRetentionDays === item.days;

                                        return (
                                            <div
                                                key={item.days}
                                                onClick={() => {
                                                    if (!isLower) {
                                                        setUpgradeRetentionDays(
                                                            item.days,
                                                        );
                                                    }
                                                }}
                                                className={`rounded-xl border p-3 text-center text-xs transition-all select-none ${
                                                    isLower
                                                        ? 'bg-muted/20 border-border cursor-not-allowed opacity-40'
                                                        : isSelected
                                                          ? 'border-primary bg-primary/5 ring-primary cursor-pointer shadow-xs ring-1'
                                                          : 'border-border bg-card hover:bg-muted/40 cursor-pointer'
                                                }`}
                                            >
                                                <div className="flex items-center justify-center gap-1 font-bold">
                                                    {isLower && (
                                                        <Lock className="text-muted-foreground h-3 w-3 shrink-0" />
                                                    )}
                                                    <span>{item.label}</span>
                                                </div>
                                                <span className="text-muted-foreground mt-0.5 block text-[10px]">
                                                    {isLower
                                                        ? t(
                                                              'billing.cannotLowerRetention',
                                                              "Kamaytirib bo'lmaydi",
                                                          )
                                                        : item.extra}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* 3. Upgrade Summary Notice Box */}
                            <div
                                className={`space-y-1.5 rounded-xl p-4 text-xs font-medium transition-all ${
                                    isUpgradeChanged
                                        ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-900 dark:text-emerald-300'
                                        : 'border border-amber-500/20 bg-amber-500/10 text-amber-900 dark:text-amber-300'
                                }`}
                            >
                                <div className="flex items-center gap-2 font-bold">
                                    {isUpgradeChanged ? (
                                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                                    ) : (
                                        <Info className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                                    )}
                                    <span>
                                        {isUpgradeChanged ? (
                                            <>
                                                {isDevicesChanged &&
                                                    `+${additionalDevices} ta telefon qo'shilmoqda`}
                                                {isDevicesChanged &&
                                                    isRetentionChanged &&
                                                    ', '}
                                                {isRetentionChanged &&
                                                    `arxiv muddati ${currentRetention} dan ${upgradeRetentionDays} kunga oshirilmoqda`}
                                            </>
                                        ) : (
                                            t(
                                                'billing.upgradeNoChange',
                                                'Kamida bitta parametrni oshiring (Telefonlar soni yoki Arxiv muddati)',
                                            )
                                        )}
                                    </span>
                                </div>
                                <p className="text-muted-foreground text-[11px] leading-relaxed">
                                    {t('billing.proratedExplanation', {
                                        date: tenant?.subscription_expires_at
                                            ? formatDate(
                                                  tenant.subscription_expires_at,
                                              )
                                            : '',
                                        defaultValue: `To'lov amalga oshirilgach, yangi parametrlar darhol kuchga kiradi. Obunaning umumiy amal qilish muddati o'zgarmaydi.`,
                                    })}
                                </p>
                            </div>
                        </>
                    )}

                    {/* === RENEWAL / STANDARD MODE === */}
                    {(!hasActivePaid || activeMode === 'renewal') && (
                        <>
                            {/* Devices Count */}
                            <div className="bg-card border-border space-y-4 rounded-2xl border p-6 shadow-xs">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="flex items-center gap-2 text-base font-semibold">
                                            <Smartphone className="text-primary h-5 w-5" />{' '}
                                            {t(
                                                'billing.step2Devices',
                                                'Telefonlar (Agentlar) soni',
                                            )}
                                        </h3>
                                        <p className="text-muted-foreground text-xs">
                                            {hasActivePaid
                                                ? t(
                                                      'billing.renewMinDevicesNotice',
                                                      {
                                                          count: currentAllowed,
                                                          defaultValue: `Faol obunani uzaytirishda telefonlar soni kamida ${currentAllowed} ta bo'ladi`,
                                                      },
                                                  )
                                                : t(
                                                      'billing.step2DevicesDesc',
                                                      "Bir vaqtda qo'ng'iroqlari yoziladigan xodimlar soni",
                                                  )}
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
                                                    setRenewalDevicesCount(
                                                        (prev) =>
                                                            Math.max(
                                                                currentAllowed,
                                                                prev - 1,
                                                            ),
                                                    );
                                                } else {
                                                    setStandardDevicesCount(
                                                        (prev) =>
                                                            Math.max(
                                                                1,
                                                                prev - 1,
                                                            ),
                                                    );
                                                }
                                            }}
                                            disabled={
                                                hasActivePaid
                                                    ? renewalDevicesCount <=
                                                      currentAllowed
                                                    : standardDevicesCount <= 1
                                            }
                                        >
                                            <Minus className="h-3.5 w-3.5" />
                                        </Button>
                                        <span className="text-primary min-w-[2.5rem] text-center font-mono text-xl font-bold">
                                            {hasActivePaid
                                                ? renewalDevicesCount
                                                : standardDevicesCount}
                                        </span>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            className="h-7 w-7 rounded-md"
                                            onClick={() => {
                                                if (hasActivePaid) {
                                                    setRenewalDevicesCount(
                                                        (prev) =>
                                                            Math.min(
                                                                50,
                                                                prev + 1,
                                                            ),
                                                    );
                                                } else {
                                                    setStandardDevicesCount(
                                                        (prev) =>
                                                            Math.min(
                                                                50,
                                                                prev + 1,
                                                            ),
                                                    );
                                                }
                                            }}
                                            disabled={
                                                (hasActivePaid
                                                    ? renewalDevicesCount
                                                    : standardDevicesCount) >=
                                                50
                                            }
                                        >
                                            <Plus className="h-3.5 w-3.5" />
                                        </Button>
                                        <span className="text-muted-foreground text-sm font-semibold">
                                            {t('billing.devicesUnit', 'ta')}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="relative flex h-8 w-full touch-none items-center select-none">
                                        <div className="bg-secondary relative h-2 w-full overflow-hidden rounded-full">
                                            <div
                                                className="bg-primary h-full transition-all duration-75"
                                                style={{
                                                    width: `calc(14px + (100% - 28px) * ${renewalPercent / 100})`,
                                                }}
                                            />
                                        </div>
                                        <div
                                            className="bg-background border-primary ring-primary/20 pointer-events-none absolute top-1/2 flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 shadow-md ring-2 transition-all duration-75"
                                            style={{
                                                left: `calc(14px + (100% - 28px) * ${renewalPercent / 100})`,
                                            }}
                                        >
                                            <div className="bg-primary h-1.5 w-1.5 rounded-full" />
                                        </div>
                                        <input
                                            type="range"
                                            min={0}
                                            max={100}
                                            step={0.1}
                                            value={renewalPercent}
                                            onChange={(e) => {
                                                const val =
                                                    sliderPercentToCount(
                                                        Number(e.target.value),
                                                        renewalMarks,
                                                    );
                                                if (hasActivePaid)
                                                    setRenewalDevicesCount(val);
                                                else
                                                    setStandardDevicesCount(
                                                        val,
                                                    );
                                            }}
                                            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                                            aria-label="Telefonlar soni"
                                        />
                                    </div>

                                    <div className="text-muted-foreground flex justify-between pt-0.5 font-mono text-xs">
                                        {renewalMarks.map((num) => {
                                            const activeCount = hasActivePaid
                                                ? renewalDevicesCount
                                                : standardDevicesCount;
                                            return (
                                                <button
                                                    type="button"
                                                    key={num}
                                                    onClick={() => {
                                                        if (hasActivePaid)
                                                            setRenewalDevicesCount(
                                                                num,
                                                            );
                                                        else
                                                            setStandardDevicesCount(
                                                                num,
                                                            );
                                                    }}
                                                    className={`min-w-[1.75rem] rounded px-1 py-0.5 text-center transition-all ${
                                                        activeCount === num
                                                            ? 'bg-primary text-primary-foreground scale-105 font-bold shadow-xs'
                                                            : 'hover:bg-muted'
                                                    }`}
                                                >
                                                    {num}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {volumeDiscount > 0 && (
                                    <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                        {t(
                                            'billing.volumeDiscountApplied',
                                            "Hajm bo'yicha {{percent}}% chegirma qo'llandi!",
                                            { percent: volumeDiscount },
                                        )}
                                    </p>
                                )}

                                {isRenewalUpgraded && (
                                    <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-300">
                                        <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                                        <div>
                                            <span className="block font-semibold">
                                                {t(
                                                    'billing.renewalProrataTitle',
                                                    "Qurilmalar/arxiv oshirilishi bo'yicha ma'lumot",
                                                )}
                                            </span>
                                            <span className="text-muted-foreground mt-0.5 block text-[11px] leading-relaxed">
                                                {t(
                                                    'billing.renewalProrataExplanation',
                                                    {
                                                        days: remainingDays,
                                                        prorated:
                                                            renewalProratedUzs.toLocaleString(
                                                                'uz-UZ',
                                                            ),
                                                        defaultValue: `Siz obunani uzaytirish bilan birga tarif parametrlarini oshirmoqdasiz. Yangi parametrlar to'lovdan so'ng darhol kuchga kirganligi sababli, amaldagi obunaning qolgan ${remainingDays} kuni uchun pro-rata farqi (+${renewalProratedUzs.toLocaleString('uz-UZ')} UZS) hisoblandi.`,
                                                    },
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Subscription Period Selection */}
                            <div className="bg-card border-border space-y-4 rounded-2xl border p-6 shadow-xs">
                                <h3 className="flex items-center gap-2 text-base font-semibold">
                                    <Calendar className="text-primary h-5 w-5" />{' '}
                                    {t('billing.step3Period', "To'lov davri")}
                                </h3>

                                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                                    {[
                                        {
                                            m: 1,
                                            label: t('billing.month1', '1 oy'),
                                            discount: null,
                                        },
                                        {
                                            m: 3,
                                            label: t('billing.month3', '3 oy'),
                                            discount: t(
                                                'billing.discount5',
                                                '5% chegirma',
                                            ),
                                        },
                                        {
                                            m: 6,
                                            label: t('billing.month6', '6 oy'),
                                            discount: t(
                                                'billing.discount10',
                                                '10% chegirma',
                                            ),
                                        },
                                        {
                                            m: 12,
                                            label: t(
                                                'billing.month12',
                                                '12 oy (1 yil)',
                                            ),
                                            discount: t(
                                                'billing.discount20',
                                                '20% chegirma',
                                            ),
                                        },
                                    ].map((item) => (
                                        <div
                                            key={item.m}
                                            onClick={() => setMonths(item.m)}
                                            className={`cursor-pointer rounded-xl border p-4 text-center transition-all ${
                                                months === item.m
                                                    ? 'border-primary bg-primary/5 ring-primary ring-1'
                                                    : 'border-border bg-card hover:bg-muted/40'
                                            }`}
                                        >
                                            <span className="block text-sm font-bold">
                                                {item.label}
                                            </span>
                                            {item.discount && (
                                                <span className="mt-1 block text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                                    {item.discount}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {hasActivePaid &&
                                    tenant?.subscription_expires_at && (
                                        <p className="text-muted-foreground flex items-center gap-1.5 pt-1 text-xs">
                                            <Clock className="text-primary h-3.5 w-3.5 shrink-0" />
                                            <span>
                                                {t(
                                                    'billing.renewalExplanation',
                                                    {
                                                        date: formatDate(
                                                            tenant.subscription_expires_at,
                                                        ),
                                                        defaultValue: `Yangi obuna muddati hozirgi obunangiz (${formatDate(tenant.subscription_expires_at)}) tugaganidan so'ng uzaytiriladi.`,
                                                    },
                                                )}
                                            </span>
                                        </p>
                                    )}
                            </div>

                            {/* Archive Retention Selection */}
                            <div className="bg-card border-border space-y-4 rounded-2xl border p-6 shadow-xs">
                                <div>
                                    <h3 className="flex items-center gap-2 text-base font-semibold">
                                        <ShieldCheck className="text-primary h-5 w-5" />{' '}
                                        {t(
                                            'billing.step4Retention',
                                            "Ovozli qo'ng'iroqlar arxivini saqlash",
                                        )}
                                    </h3>
                                    <p className="text-muted-foreground text-xs">
                                        {t(
                                            'billing.step4RetentionDesc',
                                            "Qo'ng'iroq yozuvlari va tahlillar bazada qancha muddat saqlanishi kerak?",
                                        )}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-2.5 md:grid-cols-5">
                                    {retentionItems.map((item) => {
                                        const isRetentionDisabled = Boolean(
                                            hasActivePaid &&
                                            item.days < currentRetention,
                                        );
                                        return (
                                            <div
                                                key={item.days}
                                                onClick={() => {
                                                    if (!isRetentionDisabled) {
                                                        setRenewalRetentionDays(
                                                            item.days,
                                                        );
                                                    }
                                                }}
                                                className={`rounded-xl border p-3 text-center text-xs transition-all ${
                                                    isRetentionDisabled
                                                        ? 'border-border bg-muted/20 cursor-not-allowed border-dashed opacity-40 select-none'
                                                        : renewalRetentionDays ===
                                                            item.days
                                                          ? 'border-primary bg-primary/5 ring-primary cursor-pointer ring-1'
                                                          : 'border-border bg-card hover:bg-muted/40 cursor-pointer'
                                                }`}
                                                title={
                                                    isRetentionDisabled
                                                        ? t(
                                                              'billing.retentionDowngradeRestricted',
                                                              'Amaldagi obuna muddati davomida arxiv saqlash muddatini kamaytirish mumkin emas',
                                                          )
                                                        : undefined
                                                }
                                            >
                                                <span className="block font-bold">
                                                    {item.label}
                                                </span>
                                                <span className="text-muted-foreground mt-0.5 block text-[10px]">
                                                    {item.extra}
                                                </span>
                                                {isRetentionDisabled && (
                                                    <span className="mt-1 block text-[9px] font-medium text-amber-600 dark:text-amber-400">
                                                        {t(
                                                            'billing.currentActiveTier',
                                                            'Amaldagidan kam',
                                                        )}
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Right Column: Payment Method & Order Summary */}
                <div className="sticky top-6 space-y-4 lg:col-span-1">
                    {/* Payment Method Selection Card */}
                    <div className="bg-card border-border space-y-2.5 rounded-xl border p-4 shadow-xs">
                        <h3 className="text-muted-foreground flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase">
                            <CreditCard className="text-primary h-3.5 w-3.5" />{' '}
                            {t(
                                'billing.step5Payment',
                                "To'lov tizimini tanlang",
                            )}
                        </h3>

                        <div className="space-y-1.5">
                            {paymentMethods.map((method) => {
                                const isSelected =
                                    selectedPaymentMethod === method.code;
                                return (
                                    <div
                                        key={method.code}
                                        onClick={() =>
                                            setSelectedPaymentMethod(
                                                method.code,
                                            )
                                        }
                                        className={`flex cursor-pointer items-center justify-between rounded-xl border p-2.5 transition-all select-none ${
                                            isSelected
                                                ? 'border-primary bg-primary/5 ring-primary shadow-xs ring-1'
                                                : 'border-border bg-card hover:bg-muted/40'
                                        }`}
                                    >
                                        <div className="flex min-w-0 items-center gap-2.5">
                                            <PaymentMethodLogo
                                                code={method.code}
                                                className="h-5"
                                            />
                                            <div className="min-w-0">
                                                <span className="block truncate text-xs leading-tight font-bold">
                                                    {method.code ===
                                                    'card_transfer'
                                                        ? t(
                                                              'billing.p2pTransfer',
                                                              method.name,
                                                          )
                                                        : method.code ===
                                                            'lemonsqueezy'
                                                          ? t(
                                                                'billing.intlCards',
                                                                method.name,
                                                            )
                                                          : method.name}
                                                </span>
                                                <span className="text-muted-foreground block truncate text-[10px] leading-tight">
                                                    {method.code ===
                                                    'lemonsqueezy'
                                                        ? t(
                                                              'billing.usdCards',
                                                              'USD (Visa, Mastercard)',
                                                          )
                                                        : t(
                                                              'billing.uzsCards',
                                                              'UZS (Humo / Uzcard)',
                                                          )}
                                                </span>
                                            </div>
                                        </div>
                                        <div
                                            className={`ml-2 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors ${
                                                isSelected
                                                    ? 'border-primary bg-primary text-primary-foreground'
                                                    : 'border-muted-foreground/30'
                                            }`}
                                        >
                                            {isSelected && (
                                                <Check className="h-2.5 w-2.5 stroke-[3]" />
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Order Summary & Checkout Card */}
                    <div className="bg-card border-border space-y-3 rounded-xl border p-4 shadow-xs">
                        <h3 className="border-border text-foreground flex items-center justify-between border-b pb-2 text-sm font-bold">
                            <span>
                                {t(
                                    'billing.orderSummary',
                                    'Buyurtma tafsilotlari',
                                )}
                            </span>
                            {hasActivePaid && activeMode === 'upgrade' && (
                                <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-[10px] font-bold">
                                    Pro-rata
                                </span>
                            )}
                        </h3>

                        {hasActivePaid && activeMode === 'upgrade' ? (
                            /* UPGRADE SUMMARY */
                            <div className="space-y-2 text-xs">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">
                                        {t(
                                            'billing.currentDevices',
                                            'Hozirgi telefonlar:',
                                        )}
                                    </span>
                                    <span className="font-mono font-semibold">
                                        {currentAllowed}{' '}
                                        {t('billing.devicesUnit', 'ta')}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">
                                        {t(
                                            'billing.targetDevices',
                                            'Yangi miqdor:',
                                        )}
                                    </span>
                                    <span className="text-primary font-mono font-bold">
                                        {upgradeTargetDevices}{' '}
                                        {t('billing.devicesUnit', 'ta')}
                                        {isDevicesChanged &&
                                            ` (+${additionalDevices})`}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">
                                        {t(
                                            'billing.retentionLabel',
                                            'Arxiv saqlash:',
                                        )}
                                    </span>
                                    <span
                                        className={`font-mono font-semibold ${isRetentionChanged ? 'font-bold text-emerald-600 dark:text-emerald-400' : ''}`}
                                    >
                                        {upgradeRetentionDays}{' '}
                                        {t('billing.daysUnit', 'kun')}
                                        {isRetentionChanged &&
                                            ` (+${upgradeRetentionDays - currentRetention})`}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">
                                        {t(
                                            'billing.remainingDaysLabel',
                                            'Qolgan muddat:',
                                        )}
                                    </span>
                                    <span className="font-mono font-semibold">
                                        {remainingDays}{' '}
                                        {t('billing.daysUnit', 'kun')}
                                    </span>
                                </div>

                                <div className="border-border flex items-baseline justify-between border-t pt-2.5">
                                    <span className="text-xs font-bold">
                                        {t(
                                            'billing.totalPriceLabel',
                                            "Jami to'lov:",
                                        )}
                                    </span>
                                    <div className="text-right">
                                        <span className="text-primary block font-mono text-xl leading-tight font-extrabold">
                                            {proratedTotalUzs.toLocaleString(
                                                'uz-UZ',
                                            )}{' '}
                                            UZS
                                        </span>
                                        <span className="text-muted-foreground font-mono text-[11px]">
                                            (~{proratedTotalUsd} USD)
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* RENEWAL / STANDARD SUMMARY */
                            <div className="space-y-2 text-xs">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">
                                        {t(
                                            'billing.devicesCountLabel',
                                            'Telefonlar soni:',
                                        )}
                                    </span>
                                    <span className="font-mono font-semibold">
                                        {activeRenewalDevices}{' '}
                                        {t('billing.devicesUnit', 'ta')}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">
                                        {t('billing.periodLabel', 'Muddat:')}
                                    </span>
                                    <span className="font-mono font-semibold">
                                        {months} {t('billing.monthsUnit', 'oy')}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">
                                        {t(
                                            'billing.retentionLabel',
                                            'Arxiv saqlash:',
                                        )}
                                    </span>
                                    <div className="text-right">
                                        <span className="font-mono font-semibold">
                                            {renewalRetentionDays}{' '}
                                            {t('billing.daysUnit', 'kun')}
                                        </span>
                                        {renewalRetAddon.uzs > 0 && (
                                            <span className="text-muted-foreground block text-[10px]">
                                                (+
                                                {renewalRetAddon.uzs.toLocaleString(
                                                    'uz-UZ',
                                                )}{' '}
                                                UZS × {activeRenewalDevices}{' '}
                                                ta/oy)
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {totalDiscount > 0 && (
                                    <div className="flex items-center justify-between font-semibold text-emerald-600 dark:text-emerald-400">
                                        <span>
                                            {t(
                                                'billing.totalDiscountLabel',
                                                'Jami chegirma:',
                                            )}
                                        </span>
                                        <span>-{totalDiscount}%</span>
                                    </div>
                                )}

                                {isRenewalUpgraded && (
                                    <div className="border-border space-y-1.5 border-t border-dashed pt-2 text-[11px]">
                                        <div className="text-muted-foreground flex items-center justify-between">
                                            <span>
                                                {t(
                                                    'billing.renewalPeriodCost',
                                                    "Uzaytirish to'lovi ({{months}} oy):",
                                                    { months },
                                                )}
                                            </span>
                                            <span className="text-foreground font-mono font-semibold">
                                                {renewalPeriodTotalUzs.toLocaleString(
                                                    'uz-UZ',
                                                )}{' '}
                                                UZS
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between font-medium text-amber-600 dark:text-amber-400">
                                            <span>
                                                {t(
                                                    'billing.renewalProrataCost',
                                                    'Qolgan {{days}} kun uchun pro-rata:',
                                                    { days: remainingDays },
                                                )}
                                            </span>
                                            <span className="font-mono font-semibold">
                                                +
                                                {renewalProratedUzs.toLocaleString(
                                                    'uz-UZ',
                                                )}{' '}
                                                UZS
                                            </span>
                                        </div>
                                    </div>
                                )}

                                <div className="border-border flex items-baseline justify-between border-t pt-2.5">
                                    <span className="text-xs font-bold">
                                        {t(
                                            'billing.totalPriceLabel',
                                            "Jami to'lov:",
                                        )}
                                    </span>
                                    <div className="text-right">
                                        <span className="text-primary block font-mono text-xl leading-tight font-extrabold">
                                            {renewalTotalUzs.toLocaleString(
                                                'uz-UZ',
                                            )}{' '}
                                            UZS
                                        </span>
                                        <span className="text-muted-foreground font-mono text-[11px]">
                                            (~{renewalTotalUsd} USD)
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <Button
                            type="submit"
                            size="default"
                            className="h-10 w-full cursor-pointer text-sm font-bold shadow-sm"
                            disabled={
                                processing ||
                                (hasActivePaid &&
                                    activeMode === 'upgrade' &&
                                    !isUpgradeChanged)
                            }
                        >
                            {processing
                                ? t('billing.loading', 'Yuklanmoqda...')
                                : hasActivePaid && activeMode === 'upgrade'
                                  ? isUpgradeChanged
                                      ? t(
                                            'billing.upgradeProceed',
                                            "Tarifni oshirish va to'lash",
                                        )
                                      : t(
                                            'billing.upgradeNoChange',
                                            'Kamida bittasini oshiring',
                                        )
                                  : t(
                                        'billing.proceedToPayment',
                                        "To'lovga o'tish",
                                    )}
                        </Button>

                        <p className="text-muted-foreground text-center text-[10px] leading-tight">
                            {hasActivePaid && activeMode === 'upgrade'
                                ? t(
                                      'billing.upgradeNote',
                                      "To'lov tasdiqlangach, yangi parametrlar darhol faollashadi.",
                                  )
                                : t(
                                      'billing.autoRenewNote',
                                      "To'lov tasdiqlangach, obunangiz avtomatik ravishda faollashtiriladi.",
                                  )}
                        </p>
                    </div>
                </div>
            </form>
        </div>
    );
}
