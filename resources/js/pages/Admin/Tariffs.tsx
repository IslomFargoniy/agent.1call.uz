import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Head, router, Link } from '@inertiajs/react';
import {
    Coins,
    RefreshCw,
    DollarSign,
    Calculator,
    Check,
    Calendar,
    Smartphone,
    ShieldCheck,
    Percent,
    ExternalLink,
    Sparkles,
    CheckCircle2,
    Sliders,
    Minus,
    Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { formatDateTime } from '@/lib/datetime';

interface RetentionOption {
    id: number;
    retention_days: number;
    additional_price_monthly: number;
    additional_price_usd_monthly: number;
    is_active: boolean;
}

interface Discount {
    id: number;
    type: 'period' | 'device_volume';
    min_value: number;
    max_value: number | null;
    discount_percent: number;
}

interface Tariff {
    id: number;
    name: string;
    code: string;
    base_price_monthly: number;
    price_usd_monthly: number;
    min_devices: number;
    default_retention_days: number;
    is_active: boolean;
    retention_options?: RetentionOption[];
    discounts?: Discount[];
}

const SIM_DEVICE_STEPS = [1, 2, 5, 10, 20, 30, 50];

function simCountToPercent(count: number): number {
    if (count <= 1) return 0;
    if (count >= 50) return 100;

    const intervals = [
        { minC: 1, maxC: 2, minP: 0, maxP: 100 / 6 },
        { minC: 2, maxC: 5, minP: 100 / 6, maxP: (100 / 6) * 2 },
        { minC: 5, maxC: 10, minP: (100 / 6) * 2, maxP: (100 / 6) * 3 },
        { minC: 10, maxC: 20, minP: (100 / 6) * 3, maxP: (100 / 6) * 4 },
        { minC: 20, maxC: 30, minP: (100 / 6) * 4, maxP: (100 / 6) * 5 },
        { minC: 30, maxC: 50, minP: (100 / 6) * 5, maxP: 100 },
    ];

    const interval =
        intervals.find((int) => count >= int.minC && count <= int.maxC) ||
        intervals[intervals.length - 1];
    const fraction = (count - interval.minC) / (interval.maxC - interval.minC);
    return interval.minP + fraction * (interval.maxP - interval.minP);
}

function simPercentToCount(percent: number): number {
    if (percent <= 0) return 1;
    if (percent >= 100) return 50;

    const intervals = [
        { minC: 1, maxC: 2, minP: 0, maxP: 100 / 6 },
        { minC: 2, maxC: 5, minP: 100 / 6, maxP: (100 / 6) * 2 },
        { minC: 5, maxC: 10, minP: (100 / 6) * 2, maxP: (100 / 6) * 3 },
        { minC: 10, maxC: 20, minP: (100 / 6) * 3, maxP: (100 / 6) * 4 },
        { minC: 20, maxC: 30, minP: (100 / 6) * 4, maxP: (100 / 6) * 5 },
        { minC: 30, maxC: 50, minP: (100 / 6) * 5, maxP: 100 },
    ];

    const interval =
        intervals.find((int) => percent >= int.minP && percent <= int.maxP) ||
        intervals[intervals.length - 1];
    const fraction =
        (percent - interval.minP) / (interval.maxP - interval.minP);
    const rawCount = interval.minC + fraction * (interval.maxC - interval.minC);
    return Math.max(1, Math.min(50, Math.round(rawCount)));
}

interface TariffsProps {
    tariff?: Tariff;
    tariffs?: Tariff[];
    usdRate?: number;
    rateUpdatedAt?: string | null;
}

export default function AdminTariffs({
    tariff: singleTariff,
    tariffs = [],
    usdRate = 12850,
    rateUpdatedAt,
}: TariffsProps) {
    const { t } = useTranslation();
    const tariff = singleTariff || tariffs[0];

    // 1. Exchange Rate State
    const [rateValue, setRateValue] = useState<number>(usdRate);
    const [fetchingCbu, setFetchingCbu] = useState(false);
    const [savingRate, setSavingRate] = useState(false);
    const [recalculate, setRecalculate] = useState(true);

    // 2. Base Tariff State
    const [baseName, setBaseName] = useState(
        tariff?.name || 'Agent1Call Standart',
    );
    const [baseCode, setBaseCode] = useState(tariff?.code || 'standard');
    const [basePriceUzs, setBasePriceUzs] = useState(
        tariff?.base_price_monthly || 50000,
    );
    const [basePriceUsd, setBasePriceUsd] = useState(
        tariff?.price_usd_monthly || 3.89,
    );
    const [savingBase, setSavingBase] = useState(false);

    // 3. Retention Options State
    const [retOptions, setRetOptions] = useState<RetentionOption[]>(
        tariff?.retention_options || [],
    );
    const [savingRet, setSavingRet] = useState(false);

    // 4. Discounts State
    const [discountsList, setDiscountsList] = useState<Discount[]>(
        tariff?.discounts || [],
    );
    const [savingDiscounts, setSavingDiscounts] = useState(false);

    // 5. Live Simulation State (matching /billing)
    const [simDevices, setSimDevices] = useState(5);
    const [simMonths, setSimMonths] = useState(3);
    const [simRetention, setSimRetention] = useState(60);

    const simProgressPercent = useMemo(
        () => simCountToPercent(simDevices),
        [simDevices],
    );

    // Exchange Rate: Fetch CBU
    const handleFetchCbuRate = async () => {
        setFetchingCbu(true);
        try {
            const res = await fetch('/admin/tariffs/cbu-rate');
            const result = await res.json();
            if (result.success && result.rate) {
                setRateValue(result.rate);
                toast.success(
                    `O'zbekiston Markaziy Banki kursi olindi: 1 USD = ${Number(result.rate).toLocaleString('uz-UZ')} UZS (${result.date || ''})`,
                );
            } else {
                toast.error(
                    'Markaziy Bankdan kursni olishda xatolik yuz berdi',
                );
            }
        } catch {
            toast.error("Internet yoki server bilan bog'lanishda xatolik");
        } finally {
            setFetchingCbu(false);
        }
    };

    // Exchange Rate: Save
    const handleSaveRate = () => {
        if (!rateValue || rateValue < 1000) {
            toast.error(
                "Iltimos, to'g'ri kurs qiymatini kiriting (masalan, 12850)",
            );
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
                            ? `Valyuta kursi (1 USD = ${Number(rateValue).toLocaleString('uz-UZ')} UZS) saqlandi va barcha USD narxlari yangilandi!`
                            : `Valyuta kursi (1 USD = ${Number(rateValue).toLocaleString('uz-UZ')} UZS) saqlandi!`,
                    );
                },
                onError: () => {
                    toast.error('Valyuta kursini saqlashda xatolik yuz berdi');
                },
                onFinish: () => {
                    setSavingRate(false);
                },
            },
        );
    };

    // Base Tariff: Save
    const handleSaveBaseTariff = (e: React.FormEvent) => {
        e.preventDefault();
        setSavingBase(true);
        router.post(
            '/admin/tariffs',
            {
                id: tariff?.id || 1,
                name: baseName,
                code: baseCode,
                base_price_monthly: basePriceUzs,
                price_usd_monthly: basePriceUsd,
                default_retention_days: 30,
                is_active: true,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(
                        'Asosiy baza tarif narxi muvaffaqiyatli saqlandi!',
                    );
                },
                onError: () => {
                    toast.error('Baza narxni saqlashda xatolik');
                },
                onFinish: () => {
                    setSavingBase(false);
                },
            },
        );
    };

    // Retention Options: Update Local
    const updateRetentionOption = (
        id: number,
        field: 'additional_price_monthly' | 'additional_price_usd_monthly',
        value: number,
    ) => {
        setRetOptions((prev) =>
            prev.map((opt) => {
                if (opt.id !== id) return opt;
                const updated = { ...opt, [field]: value };
                if (field === 'additional_price_monthly' && rateValue > 0) {
                    updated.additional_price_usd_monthly = Number(
                        (value / rateValue).toFixed(2),
                    );
                }
                return updated;
            }),
        );
    };

    // Retention Options: Save to Server
    const handleSaveRetention = () => {
        setSavingRet(true);
        router.post(
            '/admin/tariffs/retention-options',
            {
                options: retOptions.map((o) => ({
                    id: o.id,
                    additional_price_monthly: o.additional_price_monthly,
                    additional_price_usd_monthly:
                        o.additional_price_usd_monthly,
                })),
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(
                        'Audio arxiv saqlash narxlari muvaffaqiyatli saqlandi!',
                    );
                },
                onError: () => {
                    toast.error('Arxiv narxlarini saqlashda xatolik');
                },
                onFinish: () => {
                    setSavingRet(false);
                },
            },
        );
    };

    // Discounts: Update Local
    const updateDiscount = (id: number, percent: number) => {
        setDiscountsList((prev) =>
            prev.map((d) =>
                d.id === id ? { ...d, discount_percent: percent } : d,
            ),
        );
    };

    // Discounts: Save to Server
    const handleSaveDiscounts = () => {
        setSavingDiscounts(true);
        router.post(
            '/admin/tariffs/discounts',
            {
                discounts: discountsList.map((d) => ({
                    id: d.id,
                    discount_percent: d.discount_percent,
                })),
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(
                        'Chegirmalar foizlari muvaffaqiyatli saqlandi!',
                    );
                },
                onError: () => {
                    toast.error('Chegirmalarni saqlashda xatolik');
                },
                onFinish: () => {
                    setSavingDiscounts(false);
                },
            },
        );
    };

    // Live Calculation Simulation
    const simulationResult = useMemo(() => {
        const baseUzs = Number(basePriceUzs) || 0;
        const baseUsd = Number(basePriceUsd) || 0;

        let retAddonUzs = 0;
        let retAddonUsd = 0;
        if (simRetention > 30) {
            const opt = retOptions.find(
                (o) => o.retention_days === simRetention,
            );
            if (opt) {
                retAddonUzs = Number(opt.additional_price_monthly);
                retAddonUsd = Number(opt.additional_price_usd_monthly);
            }
        }

        const devRateUzs = baseUzs + retAddonUzs;
        const devRateUsd = baseUsd + retAddonUsd;

        const subtotalUzs = devRateUzs * simDevices * simMonths;
        const subtotalUsd = devRateUsd * simDevices * simMonths;

        // Period discount
        let pDisc = 0;
        const periodMatch = discountsList
            .filter(
                (d) =>
                    d.type === 'period' &&
                    simMonths >= d.min_value &&
                    (!d.max_value || simMonths <= d.max_value),
            )
            .sort(
                (a, b) =>
                    Number(b.discount_percent) - Number(a.discount_percent),
            )[0];
        if (periodMatch) pDisc = Number(periodMatch.discount_percent);
        else if (simMonths === 12) pDisc = 20;
        else if (simMonths === 6) pDisc = 10;
        else if (simMonths === 3) pDisc = 5;

        // Volume discount
        let vDisc = 0;
        const volMatch = discountsList
            .filter(
                (d) =>
                    d.type === 'device_volume' &&
                    simDevices >= d.min_value &&
                    (!d.max_value || simDevices <= d.max_value),
            )
            .sort(
                (a, b) =>
                    Number(b.discount_percent) - Number(a.discount_percent),
            )[0];
        if (volMatch) vDisc = Number(volMatch.discount_percent);
        else if (simDevices >= 20) vDisc = 15;
        else if (simDevices >= 10) vDisc = 10;
        else if (simDevices >= 5) vDisc = 5;

        const totalDisc = Math.min(40, pDisc + vDisc);
        const factor = (100 - totalDisc) / 100;

        const totalUzs = Math.round(subtotalUzs * factor);
        const totalUsd = Math.round(subtotalUsd * factor * 100) / 100;

        return {
            devRateUzs,
            devRateUsd,
            subtotalUzs,
            subtotalUsd,
            pDisc,
            vDisc,
            totalDisc,
            totalUzs,
            totalUsd,
        };
    }, [
        basePriceUzs,
        basePriceUsd,
        retOptions,
        discountsList,
        simDevices,
        simMonths,
        simRetention,
    ]);

    const periodDiscounts = discountsList.filter((d) => d.type === 'period');
    const volumeDiscounts = discountsList.filter(
        (d) => d.type === 'device_volume',
    );

    return (
        <div className="mx-auto max-w-6xl space-y-8 p-6">
            <Head
                title={t(
                    'admin.tariffsHead',
                    'Superadmin — Yagona Tarif & Billing Sozlamalari',
                )}
            />

            {/* Page Header */}
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                    <div className="flex items-center gap-2">
                        <h2 className="text-2xl font-bold tracking-tight">
                            {t(
                                'admin.tariffsTitle',
                                "Yagona Tarif & To'lov Parametrlari",
                            )}
                        </h2>
                        <span className="bg-primary/10 text-primary border-primary/20 rounded-full border px-2.5 py-0.5 text-xs font-semibold">
                            Agent1Call Modeli
                        </span>
                    </div>
                    <p className="text-muted-foreground mt-1 text-sm">
                        {t(
                            'admin.tariffsDesc',
                            'agent.1call.uz/billing sahifasi uchun baza narxlari, arxiv saqlash muddati narxlari, chegirmalar va valyuta kursi boshqaruvi',
                        )}
                    </p>
                </div>

                <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="h-9 gap-1.5 shadow-xs"
                >
                    <Link href="/billing">
                        <ExternalLink className="text-muted-foreground h-4 w-4" />
                        {t(
                            'admin.viewClientBilling',
                            "Mijoz ko'rinishi (/billing)",
                        )}
                    </Link>
                </Button>
            </div>

            {/* 1. Exchange Rate Card */}
            <div className="bg-card border-border space-y-5 rounded-2xl border p-6 shadow-xs">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                    <div className="flex items-start gap-4">
                        <div className="bg-primary/10 text-primary flex h-12 w-12 shrink-0 items-center justify-center rounded-xl">
                            <DollarSign className="h-6 w-6" />
                        </div>
                        <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-foreground text-lg font-bold">
                                    {t(
                                        'admin.exchangeRateTitle',
                                        'AQSH Dollari Valyuta Kursi (USD / UZS)',
                                    )}
                                </h3>
                                <span className="inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-600">
                                    1 USD ={' '}
                                    {Number(rateValue || 12850).toLocaleString(
                                        'uz-UZ',
                                    )}{' '}
                                    UZS
                                </span>
                            </div>
                            <p className="text-muted-foreground max-w-2xl text-xs leading-relaxed">
                                {t(
                                    'admin.exchangeRateSubtitle',
                                    "Lemon Squeezy to'lovlarida xalqaro mijozlar uchun dollar narxi ushbu kurs orqali UZS ga bog'lanadi. Kursni qo'lda kiritishingiz yoki Markaziy Bankdan bir tugma orqali avtomatik yangilashingiz mumkin.",
                                )}
                            </p>
                            {rateUpdatedAt && (
                                <p className="text-muted-foreground/80 flex items-center gap-1 pt-0.5 font-mono text-[11px]">
                                    <Calendar className="h-3 w-3" />
                                    {t(
                                        'admin.lastUpdated',
                                        'Tizimda oxirgi yangilanish',
                                    )}
                                    : {formatDateTime(rateUpdatedAt)}
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
                        className="border-border hover:bg-muted h-9 shrink-0 gap-2 font-medium"
                    >
                        <RefreshCw
                            className={`h-4 w-4 ${fetchingCbu ? 'text-primary animate-spin' : 'text-muted-foreground'}`}
                        />
                        {fetchingCbu
                            ? t('admin.fetchingCbu', 'MB dan olinmoqda...')
                            : t('admin.fetchCbu', 'Markaziy Bankdan olish')}
                    </Button>
                </div>

                <div className="border-border flex flex-col justify-between gap-4 border-t pt-4 md:flex-row md:items-center">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-muted-foreground text-xs font-semibold whitespace-nowrap">
                                1 USD =
                            </span>
                            <div className="relative w-44">
                                <Input
                                    type="number"
                                    step="0.01"
                                    min="1000"
                                    value={rateValue}
                                    onChange={(e) =>
                                        setRateValue(Number(e.target.value))
                                    }
                                    className="h-9 pr-12 font-mono text-sm font-bold"
                                    placeholder="12850"
                                />
                                <span className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 font-mono text-xs font-bold">
                                    UZS
                                </span>
                            </div>
                        </div>

                        <label className="bg-muted/40 hover:bg-muted/70 border-border flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-colors select-none">
                            <input
                                type="checkbox"
                                checked={recalculate}
                                onChange={(e) =>
                                    setRecalculate(e.target.checked)
                                }
                                className="text-primary h-4 w-4 rounded"
                            />
                            <span className="text-foreground/90 font-medium">
                                {t(
                                    'admin.autoRecalculateTariffs',
                                    "Baza narx va barcha arxiv variantlari USD narxlarini ushbu kurs bo'yicha avtomatik qayta hisoblash",
                                )}
                            </span>
                        </label>
                    </div>

                    <Button
                        onClick={handleSaveRate}
                        disabled={savingRate || !rateValue || rateValue <= 0}
                        size="sm"
                        className="h-9 shrink-0 gap-1.5 px-4"
                    >
                        <Check className="h-4 w-4" />
                        {savingRate
                            ? t('admin.saving', 'Saqlanmoqda...')
                            : t('admin.saveRate', 'Kursni saqlash')}
                    </Button>
                </div>
            </div>

            {/* 2. Base Tariff Settings Card */}
            <form
                onSubmit={handleSaveBaseTariff}
                className="bg-card border-border space-y-5 rounded-2xl border p-6 shadow-xs"
            >
                <div className="border-border flex flex-col justify-between gap-4 border-b pb-4 md:flex-row md:items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                            <Coins className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-foreground text-lg font-bold">
                                1. Asosiy Baza Narx (1 ta telefon / 1 oy)
                            </h3>
                            <p className="text-muted-foreground text-xs">
                                Mijoz tanlagan har bir telefon (agent) uchun
                                oylik hisoblanadigan standart baza qiymati
                            </p>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        size="sm"
                        disabled={savingBase}
                        className="h-9 shrink-0 gap-1.5 px-4"
                    >
                        <Check className="h-4 w-4" />
                        {savingBase ? 'Saqlanmoqda...' : 'Baza narxni saqlash'}
                    </Button>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <div className="space-y-1.5">
                        <label className="text-foreground text-xs font-semibold">
                            Tarif nomi
                        </label>
                        <Input
                            value={baseName}
                            onChange={(e) => setBaseName(e.target.value)}
                            placeholder="Agent1Call Standart"
                            required
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-foreground text-xs font-semibold">
                            Kod (Slug)
                        </label>
                        <Input
                            value={baseCode}
                            onChange={(e) => setBaseCode(e.target.value)}
                            placeholder="standard"
                            required
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-foreground text-xs font-semibold">
                            Baza narx (UZS/oy)
                        </label>
                        <div className="relative">
                            <Input
                                type="number"
                                step="1000"
                                min="1000"
                                value={basePriceUzs}
                                onChange={(e) => {
                                    const uzs = Number(e.target.value);
                                    setBasePriceUzs(uzs);
                                    if (rateValue > 0) {
                                        setBasePriceUsd(
                                            Number(
                                                (uzs / rateValue).toFixed(2),
                                            ),
                                        );
                                    }
                                }}
                                className="pr-12 font-mono font-bold"
                                required
                            />
                            <span className="text-muted-foreground absolute top-1/2 right-3 -translate-y-1/2 font-mono text-xs font-bold">
                                UZS
                            </span>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <label className="text-foreground text-xs font-semibold">
                                USD narx ($/oy)
                            </label>
                            {rateValue > 0 && basePriceUzs > 0 && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        setBasePriceUsd(
                                            Number(
                                                (
                                                    basePriceUzs / rateValue
                                                ).toFixed(2),
                                            ),
                                        )
                                    }
                                    className="text-primary flex items-center gap-0.5 font-mono text-[11px] hover:underline"
                                    title="Kurs bo'yicha hisoblash"
                                >
                                    <Calculator className="h-3 w-3" />$
                                    {(basePriceUzs / rateValue).toFixed(2)}
                                </button>
                            )}
                        </div>
                        <div className="relative">
                            <Input
                                type="number"
                                step="0.01"
                                min="0.1"
                                value={basePriceUsd}
                                onChange={(e) =>
                                    setBasePriceUsd(Number(e.target.value))
                                }
                                className="pl-7 font-mono font-bold"
                                required
                            />
                            <span className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2 font-mono text-xs font-bold">
                                $
                            </span>
                        </div>
                    </div>
                </div>
            </form>

            {/* 3. Audio Retention Options Card */}
            <div className="bg-card border-border space-y-5 rounded-2xl border p-6 shadow-xs">
                <div className="border-border flex flex-col justify-between gap-4 border-b pb-4 md:flex-row md:items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                            <ShieldCheck className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-foreground text-lg font-bold">
                                2. Audio Arxiv Saqlash Narxlari (Retention
                                Variantlari)
                            </h3>
                            <p className="text-muted-foreground text-xs">
                                Mijoz 30 kundan ortiq arxiv tanlaganda har bir
                                telefon uchun oylik qo'shiladigan qo'shimcha
                                summa
                            </p>
                        </div>
                    </div>

                    <Button
                        onClick={handleSaveRetention}
                        size="sm"
                        disabled={savingRet}
                        className="h-9 shrink-0 gap-1.5 px-4"
                    >
                        <Check className="h-4 w-4" />
                        {savingRet
                            ? 'Saqlanmoqda...'
                            : 'Arxiv narxlarini saqlash'}
                    </Button>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
                    {/* 30 Days (Standard free) */}
                    <div className="border-border/80 bg-muted/20 space-y-2 rounded-xl border p-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-bold">30 kun</span>
                            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                                Standart
                            </span>
                        </div>
                        <p className="text-muted-foreground text-xs">
                            Baza narx ichida bepul (0 so'm / $0.00)
                        </p>
                        <div className="text-foreground pt-1 font-mono text-xs font-bold">
                            +0 UZS / oy
                        </div>
                    </div>

                    {/* Dynamic options (60, 90, 180, 365) */}
                    {retOptions.map((opt) => (
                        <div
                            key={opt.id}
                            className="border-border bg-card space-y-3 rounded-xl border p-4 shadow-2xs"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-bold">
                                    {opt.retention_days === 365
                                        ? '1 yil (365 kun)'
                                        : `${opt.retention_days} kun`}
                                </span>
                                <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-[10px] font-bold">
                                    +{opt.retention_days - 30} kun
                                </span>
                            </div>

                            <div className="space-y-1">
                                <label className="text-muted-foreground text-[11px] font-semibold">
                                    Qo'shimcha UZS
                                </label>
                                <div className="relative">
                                    <Input
                                        type="number"
                                        step="1000"
                                        min="0"
                                        value={opt.additional_price_monthly}
                                        onChange={(e) =>
                                            updateRetentionOption(
                                                opt.id,
                                                'additional_price_monthly',
                                                Number(e.target.value),
                                            )
                                        }
                                        className="h-8 pr-10 font-mono text-xs font-bold"
                                    />
                                    <span className="text-muted-foreground absolute top-1/2 right-2.5 -translate-y-1/2 font-mono text-[10px]">
                                        UZS
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-muted-foreground text-[11px] font-semibold">
                                    Qo'shimcha USD
                                </label>
                                <div className="relative">
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={opt.additional_price_usd_monthly}
                                        onChange={(e) =>
                                            updateRetentionOption(
                                                opt.id,
                                                'additional_price_usd_monthly',
                                                Number(e.target.value),
                                            )
                                        }
                                        className="h-8 pl-6 font-mono text-xs font-bold"
                                    />
                                    <span className="text-muted-foreground absolute top-1/2 left-2.5 -translate-y-1/2 font-mono text-[10px]">
                                        $
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 4. Discounts Settings Card */}
            <div className="bg-card border-border space-y-5 rounded-2xl border p-6 shadow-xs">
                <div className="border-border flex flex-col justify-between gap-4 border-b pb-4 md:flex-row md:items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                            <Percent className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-foreground text-lg font-bold">
                                3. Chegirmalar Tizimi (Discounts)
                            </h3>
                            <p className="text-muted-foreground text-xs">
                                Obuna muddati va xarid qilingan telefonlar hajmi
                                bo'yicha mijozga beriladigan avtomatik chegirma
                                foizlari
                            </p>
                        </div>
                    </div>

                    <Button
                        onClick={handleSaveDiscounts}
                        size="sm"
                        disabled={savingDiscounts}
                        className="h-9 shrink-0 gap-1.5 px-4"
                    >
                        <Check className="h-4 w-4" />
                        {savingDiscounts
                            ? 'Saqlanmoqda...'
                            : 'Chegirmalarni saqlash'}
                    </Button>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {/* Period Discounts */}
                    <div className="border-border/80 bg-muted/10 space-y-3 rounded-xl border p-4">
                        <div className="text-foreground flex items-center gap-2 text-sm font-bold">
                            <Calendar className="text-primary h-4 w-4" />
                            Obuna muddati bo'yicha chegirmalar
                        </div>

                        <div className="grid grid-cols-3 gap-3 pt-1">
                            {periodDiscounts.map((disc) => (
                                <div key={disc.id} className="space-y-1.5">
                                    <label className="text-muted-foreground block text-xs font-semibold">
                                        {disc.min_value} oy
                                        {disc.max_value
                                            ? ` - ${disc.max_value} oy`
                                            : '+ (1 yil)'}
                                    </label>
                                    <div className="relative">
                                        <Input
                                            type="number"
                                            step="1"
                                            min="0"
                                            max="100"
                                            value={disc.discount_percent}
                                            onChange={(e) =>
                                                updateDiscount(
                                                    disc.id,
                                                    Number(e.target.value),
                                                )
                                            }
                                            className="h-8 pr-7 text-center font-mono text-xs font-bold"
                                        />
                                        <span className="text-muted-foreground absolute top-1/2 right-2.5 -translate-y-1/2 font-mono text-xs font-bold">
                                            %
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Volume Discounts */}
                    <div className="border-border/80 bg-muted/10 space-y-3 rounded-xl border p-4">
                        <div className="text-foreground flex items-center gap-2 text-sm font-bold">
                            <Smartphone className="text-primary h-4 w-4" />
                            Telefonlar hajmi (Volume) bo'yicha chegirmalar
                        </div>

                        <div className="grid grid-cols-3 gap-3 pt-1">
                            {volumeDiscounts.map((disc) => (
                                <div key={disc.id} className="space-y-1.5">
                                    <label className="text-muted-foreground block text-xs font-semibold">
                                        {disc.min_value}
                                        {disc.max_value
                                            ? ` - ${disc.max_value} ta`
                                            : '+ ta telefon'}
                                    </label>
                                    <div className="relative">
                                        <Input
                                            type="number"
                                            step="1"
                                            min="0"
                                            max="100"
                                            value={disc.discount_percent}
                                            onChange={(e) =>
                                                updateDiscount(
                                                    disc.id,
                                                    Number(e.target.value),
                                                )
                                            }
                                            className="h-8 pr-7 text-center font-mono text-xs font-bold"
                                        />
                                        <span className="text-muted-foreground absolute top-1/2 right-2.5 -translate-y-1/2 font-mono text-xs font-bold">
                                            %
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* 5. Live Simulator Preview (matching /billing) */}
            <div className="from-card via-card to-primary/5 border-primary/20 space-y-5 rounded-2xl border bg-gradient-to-br p-6 shadow-xs">
                <div className="border-border flex flex-col justify-between gap-2 border-b pb-3 md:flex-row md:items-center">
                    <div className="flex items-center gap-2">
                        <Sparkles className="text-primary h-5 w-5" />
                        <h3 className="text-foreground text-base font-bold">
                            Jonli Kalkulyator Simulyatori (Mijoz /billing
                            sahifasida qanday ko'radi)
                        </h3>
                    </div>
                    <span className="text-muted-foreground text-xs">
                        Har qanday parametrni o'zgartirib darhol tekshirib
                        ko'rishingiz mumkin
                    </span>
                </div>

                <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
                    {/* Controls */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:col-span-2">
                        {/* Devices */}
                        <div className="bg-card border-border space-y-2 rounded-xl border p-4">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground font-semibold">
                                    Telefonlar soni:
                                </span>
                                <div className="flex items-center gap-1.5">
                                    <button
                                        type="button"
                                        className="hover:bg-muted text-muted-foreground inline-flex h-5 w-5 items-center justify-center rounded border disabled:opacity-40"
                                        onClick={() =>
                                            setSimDevices((prev) =>
                                                Math.max(1, prev - 1),
                                            )
                                        }
                                        disabled={simDevices <= 1}
                                    >
                                        <Minus className="h-3 w-3" />
                                    </button>
                                    <span className="text-primary min-w-[1.75rem] text-center font-mono font-bold">
                                        {simDevices}
                                    </span>
                                    <button
                                        type="button"
                                        className="hover:bg-muted text-muted-foreground inline-flex h-5 w-5 items-center justify-center rounded border disabled:opacity-40"
                                        onClick={() =>
                                            setSimDevices((prev) =>
                                                Math.min(50, prev + 1),
                                            )
                                        }
                                        disabled={simDevices >= 50}
                                    >
                                        <Plus className="h-3 w-3" />
                                    </button>
                                    <span className="text-muted-foreground text-[11px] font-semibold">
                                        ta
                                    </span>
                                </div>
                            </div>
                            <div className="relative flex h-6 w-full touch-none items-center select-none">
                                <div className="bg-secondary relative h-2 w-full overflow-hidden rounded-full">
                                    <div
                                        className="bg-primary h-full transition-all duration-75"
                                        style={{
                                            width: `${simProgressPercent}%`,
                                        }}
                                    />
                                </div>
                                <div
                                    className="bg-background border-primary ring-primary/20 pointer-events-none absolute top-1/2 flex h-4.5 w-4.5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 shadow-md ring-2 transition-all duration-75"
                                    style={{
                                        left: `calc(9px + (100% - 18px) * ${simProgressPercent / 100})`,
                                    }}
                                >
                                    <div className="bg-primary h-1.5 w-1.5 rounded-full" />
                                </div>
                                <input
                                    type="range"
                                    min={0}
                                    max={100}
                                    step={0.1}
                                    value={simProgressPercent}
                                    onChange={(e) =>
                                        setSimDevices(
                                            simPercentToCount(
                                                Number(e.target.value),
                                            ),
                                        )
                                    }
                                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                                    aria-label="Telefonlar soni"
                                />
                            </div>
                            <div className="text-muted-foreground flex justify-between pt-0.5 font-mono text-[11px]">
                                {SIM_DEVICE_STEPS.map((n) => (
                                    <button
                                        type="button"
                                        key={n}
                                        onClick={() => setSimDevices(n)}
                                        className={`rounded px-1.5 py-0.5 transition-colors ${simDevices === n ? 'bg-primary text-primary-foreground font-bold shadow-xs' : 'hover:bg-muted'}`}
                                    >
                                        {n}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Period */}
                        <div className="bg-card border-border space-y-2 rounded-xl border p-4">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground font-semibold">
                                    Obuna davri:
                                </span>
                                <span className="text-primary font-mono font-bold">
                                    {simMonths} oy
                                </span>
                            </div>
                            <div className="grid grid-cols-4 gap-1.5 pt-1">
                                {[1, 3, 6, 12].map((m) => (
                                    <button
                                        type="button"
                                        key={m}
                                        onClick={() => setSimMonths(m)}
                                        className={`rounded-lg border py-1.5 text-xs font-semibold transition-colors ${
                                            simMonths === m
                                                ? 'bg-primary text-primary-foreground border-primary'
                                                : 'bg-muted/30 border-border hover:bg-muted'
                                        }`}
                                    >
                                        {m} oy
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Retention */}
                        <div className="bg-card border-border space-y-2 rounded-xl border p-4">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground font-semibold">
                                    Arxiv muddati:
                                </span>
                                <span className="text-primary font-mono font-bold">
                                    {simRetention} kun
                                </span>
                            </div>
                            <div className="grid grid-cols-3 gap-1.5 pt-1">
                                {[30, 60, 90, 180, 365].map((d) => (
                                    <button
                                        type="button"
                                        key={d}
                                        onClick={() => setSimRetention(d)}
                                        className={`rounded-lg border py-1 text-[11px] font-semibold transition-colors ${
                                            simRetention === d
                                                ? 'bg-primary text-primary-foreground border-primary'
                                                : 'bg-muted/30 border-border hover:bg-muted'
                                        }`}
                                    >
                                        {d === 365 ? '1 yil' : `${d}k`}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Result Card */}
                    <div className="bg-card border-border/90 space-y-4 rounded-xl border p-5 shadow-md">
                        <h4 className="border-border text-foreground border-b pb-2 text-sm font-bold">
                            Simulyatsiya Hisob-kitobi
                        </h4>

                        <div className="space-y-2 text-xs">
                            <div className="text-muted-foreground flex justify-between">
                                <span>1 telefon narxi:</span>
                                <span className="text-foreground font-mono font-semibold">
                                    {simulationResult.devRateUzs.toLocaleString(
                                        'uz-UZ',
                                    )}{' '}
                                    UZS (${simulationResult.devRateUsd})
                                </span>
                            </div>

                            <div className="text-muted-foreground flex justify-between">
                                <span>Oraliq summa:</span>
                                <span className="text-foreground font-mono font-semibold">
                                    {simulationResult.subtotalUzs.toLocaleString(
                                        'uz-UZ',
                                    )}{' '}
                                    UZS
                                </span>
                            </div>

                            {simulationResult.totalDisc > 0 && (
                                <div className="flex justify-between font-semibold text-emerald-600">
                                    <span>Jami chegirma:</span>
                                    <span>-{simulationResult.totalDisc}%</span>
                                </div>
                            )}

                            <div className="border-border flex items-baseline justify-between border-t pt-3">
                                <span className="text-foreground text-sm font-bold">
                                    Jami to'lov:
                                </span>
                                <div className="text-right">
                                    <span className="text-primary block font-mono text-xl font-extrabold">
                                        {simulationResult.totalUzs.toLocaleString(
                                            'uz-UZ',
                                        )}{' '}
                                        UZS
                                    </span>
                                    <span className="text-muted-foreground font-mono text-xs">
                                        (~${simulationResult.totalUsd} USD)
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
