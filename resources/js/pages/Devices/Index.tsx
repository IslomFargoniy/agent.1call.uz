import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import {
    Smartphone,
    Plus,
    Battery,
    CheckCircle2,
    XCircle,
    Trash2,
    Edit3,
    QrCode,
    RefreshCw,
    Copy,
    Check,
    Download,
    BookOpen,
    ShieldAlert,
    PhoneCall,
    Mic,
    Zap,
    X,
} from 'lucide-react';
import QRCode from 'qrcode';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/datetime';
import { PaginationNav, PaginationLink } from '@/components/ui/pagination-nav';
import { Input } from '@/components/ui/input';

interface DeviceItem {
    id: number;
    name: string;
    model?: string;
    device_uid: string;
    selected_sim_slot?: number;
    sim_slots_info?: any;
    accessibility_service_enabled: boolean;
    battery_level?: number;
    pairing_code?: string;
    is_paired: boolean;
    last_seen_at?: string;
    tenant?: { id: number; name: string };
}

interface PaginatedDevices {
    data: DeviceItem[];
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    total: number;
    per_page: number;
    links: PaginationLink[];
}

interface DevicesProps {
    devices: PaginatedDevices | DeviceItem[];
    quota: {
        allowed: number;
        paired: number;
    };
    tenant_uuid?: string;
}

export default function DevicesIndex({
    devices,
    quota,
    tenant_uuid,
}: DevicesProps) {
    const { t } = useTranslation();
    const { auth, superadmin } = usePage<any>().props;
    const isSuperAdmin = auth?.user?.role === 'superadmin';
    const isAllTenants = isSuperAdmin && !superadmin?.selected_tenant;
    const deviceList: DeviceItem[] = Array.isArray(devices)
        ? devices
        : devices?.data || [];
    const pagination = !Array.isArray(devices)
        ? (devices as PaginatedDevices)
        : null;
    const [editingDevice, setEditingDevice] = useState<DeviceItem | null>(null);
    const [selectedPairingDevice, setSelectedPairingDevice] =
        useState<DeviceItem | null>(null);
    const [showPairModal, setShowPairModal] = useState(false);
    const [showGuideModal, setShowGuideModal] = useState(false);
    const [qrSvg, setQrSvg] = useState<string>('');
    const [copied, setCopied] = useState(false);

    const { data, setData, put, processing, reset } = useForm({
        name: '',
        selected_sim_slot: '',
        sim1_number: '',
        sim1_carrier: '',
        sim2_number: '',
        sim2_carrier: '',
    });

    const activePairingDevice = selectedPairingDevice
        ? deviceList.find((d) => d.id === selectedPairingDevice.id) ||
          selectedPairingDevice
        : deviceList.find((d) => !d.is_paired && d.pairing_code) || null;

    useEffect(() => {
        if (!activePairingDevice?.pairing_code) {
            setQrSvg('');
            return;
        }

        const serverUrl =
            typeof window !== 'undefined'
                ? window.location.origin
                : 'https://agent.1call.uz';
        const payload = JSON.stringify({
            app: '1call-agent',
            v: 1,
            server: serverUrl,
            tenant_uuid: tenant_uuid || '',
            pairing_code: activePairingDevice.pairing_code,
            name: activePairingDevice.name || 'Android Telefon',
        });

        QRCode.toString(payload, {
            type: 'svg',
            margin: 1,
            errorCorrectionLevel: 'M',
            color: {
                dark: '#0f172a',
                light: '#ffffff',
            },
        })
            .then((svg) => setQrSvg(svg))
            .catch((err) => {
                console.error('QR code generation error:', err);
                setQrSvg('');
            });
    }, [
        activePairingDevice?.id,
        activePairingDevice?.pairing_code,
        tenant_uuid,
    ]);

    const openEdit = (device: DeviceItem) => {
        setEditingDevice(device);
        const slots = device.sim_slots_info || {};
        setData({
            name: device.name,
            selected_sim_slot: device.selected_sim_slot
                ? String(device.selected_sim_slot)
                : '',
            sim1_number:
                slots?.sim1?.phone_number ||
                (Array.isArray(slots)
                    ? slots.find((s: any) => s.slot === 1)?.phone_number
                    : '') ||
                '',
            sim1_carrier:
                slots?.sim1?.carrier ||
                (Array.isArray(slots)
                    ? slots.find((s: any) => s.slot === 1)?.carrier
                    : '') ||
                '',
            sim2_number:
                slots?.sim2?.phone_number ||
                (Array.isArray(slots)
                    ? slots.find((s: any) => s.slot === 2)?.phone_number
                    : '') ||
                '',
            sim2_carrier:
                slots?.sim2?.carrier ||
                (Array.isArray(slots)
                    ? slots.find((s: any) => s.slot === 2)?.carrier
                    : '') ||
                '',
        });
    };

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingDevice) return;

        put(`/devices/${editingDevice.id}`, {
            onSuccess: () => {
                setEditingDevice(null);
                reset();
            },
        });
    };

    const handleDelete = (device: DeviceItem) => {
        if (
            confirm(
                t(
                    'devices.deleteConfirm',
                    'Haqiqatan ham "%{name}" qurilmasini o\x27chirmoqchimisiz?',
                    { name: device.name },
                ),
            )
        ) {
            router.delete(`/devices/${device.id}`);
        }
    };

    const generateCode = () => {
        router.post(
            '/devices/pair-code',
            {},
            {
                onSuccess: (page: any) => {
                    const newDeviceId = page?.props?.flash?.new_device_id;
                    const pageDevices: DeviceItem[] =
                        page?.props?.devices || [];

                    let targetDevice: DeviceItem | undefined;
                    if (newDeviceId) {
                        targetDevice = pageDevices.find(
                            (d) => d.id === newDeviceId,
                        );
                    }

                    if (!targetDevice) {
                        // Fallback: get the newest unpaired device (highest ID)
                        const unpaired = pageDevices.filter(
                            (d) => !d.is_paired && d.pairing_code,
                        );
                        if (unpaired.length > 0) {
                            targetDevice = unpaired.reduce((prev, curr) =>
                                curr.id > prev.id ? curr : prev,
                            );
                        }
                    }

                    if (targetDevice) {
                        setSelectedPairingDevice(targetDevice);
                    }
                    setShowPairModal(true);
                },
            },
        );
    };

    const copyPairingCode = () => {
        if (activePairingDevice?.pairing_code) {
            navigator.clipboard.writeText(activePairingDevice.pairing_code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="mx-auto max-w-7xl space-y-6 p-6">
            <Head title={t('devices.title', 'Android Telefonlar Boshqaruvi')} />

            {/* Header Section */}
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">
                        {t('devices.title', 'Ulangan Telefonlar')}
                    </h2>
                    <p className="text-muted-foreground text-sm">
                        {t(
                            'devices.subtitle',
                            'Kompaniya xodimlarining mobil telefonlari va monitoring agentlari',
                        )}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    <Button
                        variant="outline"
                        size="sm"
                        className="border-primary/30 text-primary hover:bg-primary/10 h-9 gap-1.5"
                        onClick={() => setShowGuideModal(true)}
                    >
                        <BookOpen className="h-4 w-4" />
                        {t('devices.toggleGuideShow', "O'rnatish yo'riqnomasi")}
                    </Button>

                    <a
                        href="/downloads/app"
                        download="1call-agent.apk"
                        className="border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex h-9 items-center justify-center gap-1.5 rounded-md border px-3 text-sm font-medium transition-colors"
                    >
                        <Download className="text-primary h-4 w-4" />{' '}
                        {t('devices.downloadApk', 'Agent1Call APK')}
                    </a>

                    <Button
                        onClick={generateCode}
                        size="sm"
                        className="h-9 gap-1.5"
                    >
                        <Plus className="h-4 w-4" />{' '}
                        {t('devices.addDevice', 'Yangi telefon ulash')}
                    </Button>
                </div>
            </div>

            {/* Quota Indicator Card */}
            <div className="bg-card border-border flex flex-col justify-between gap-4 rounded-xl border p-5 shadow-xs md:flex-row md:items-center">
                <div className="flex items-center gap-3">
                    <Smartphone className="text-primary h-6 w-6" />
                    <div>
                        <h4 className="text-sm font-semibold">
                            {t(
                                'devices.activeDevicesQuota',
                                'Faol telefonlar: {{paired}} / {{allowed}} ta',
                                {
                                    paired: quota.paired,
                                    allowed: quota.allowed,
                                },
                            )}
                        </h4>
                        <p className="text-muted-foreground text-xs">
                            {quota.paired >= quota.allowed
                                ? t(
                                      'devices.limitReached',
                                      'Mavjud limit tugadi. Yangi telefon ulash uchun tarifingizni kengaytiring.',
                                  )
                                : t(
                                      'devices.remainingQuota',
                                      'Yana {{count}} ta telefon ulash imkoniyati mavjud.',
                                      { count: quota.allowed - quota.paired },
                                  )}
                        </p>
                    </div>
                </div>

                <div className="flex w-full items-center gap-3 md:w-64">
                    <div className="bg-secondary h-2.5 flex-1 overflow-hidden rounded-full">
                        <div
                            className="bg-primary h-full rounded-full transition-all"
                            style={{
                                width: `${Math.min(100, (quota.paired / quota.allowed) * 100)}%`,
                            }}
                        />
                    </div>
                    <span className="font-mono text-xs font-semibold">
                        {quota.paired}/{quota.allowed}
                    </span>
                </div>
            </div>

            {/* Devices Table */}
            <div className="bg-card border-border overflow-hidden rounded-xl border shadow-xs">
                <table className="w-full text-left text-sm">
                    <thead className="bg-muted/50 border-border text-muted-foreground border-b text-xs font-medium uppercase">
                        <tr>
                            <th className="w-12 px-4 py-3 text-center">№</th>
                            <th className="px-4 py-3">
                                {t('devices.name', 'Qurilma nomi')}
                            </th>
                            {isAllTenants && (
                                <th className="px-4 py-3">
                                    {t('devices.company', 'Kompaniya')}
                                </th>
                            )}
                            <th className="px-4 py-3">
                                {t('devices.simSlot', 'SIM Slot')}
                            </th>
                            <th className="px-4 py-3">Accessibility</th>
                            <th className="px-4 py-3">
                                {t('devices.batteryLevel', 'Batareya')}
                            </th>
                            <th className="px-4 py-3">
                                {t(
                                    'devices.statusLastSeen',
                                    'Holat / Oxirgi faollik',
                                )}
                            </th>
                            <th className="px-4 py-3 text-right">
                                {t('devices.actions', 'Amallar')}
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-border divide-y">
                        {deviceList.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={isAllTenants ? 8 : 7}
                                    className="text-muted-foreground py-8 text-center text-sm"
                                >
                                    {t(
                                        'devices.noDevices',
                                        'Hozircha hech qanday telefon ulanmagan. "Yangi telefon ulash" tugmasini bosing.',
                                    )}
                                </td>
                            </tr>
                        ) : (
                            deviceList.map((device, idx) => {
                                const rowNum = pagination
                                    ? (pagination.current_page - 1) *
                                          (pagination.per_page || 10) +
                                      idx +
                                      1
                                    : idx + 1;
                                return (
                                    <tr
                                        key={device.id}
                                        className="hover:bg-muted/30 transition-colors"
                                    >
                                        <td className="text-muted-foreground px-4 py-3.5 text-center font-mono text-xs">
                                            {rowNum}
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <div className="font-semibold">
                                                {device.name}
                                            </div>
                                            <div className="text-muted-foreground font-mono text-xs">
                                                {device.model ||
                                                    device.device_uid}
                                            </div>
                                        </td>
                                        {isAllTenants && (
                                            <td className="px-4 py-3.5 text-xs">
                                                <span className="bg-primary/10 text-primary border-primary/20 inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium">
                                                    {device.tenant?.name || '-'}
                                                </span>
                                            </td>
                                        )}
                                        <td className="px-4 py-3.5 text-xs">
                                            <div className="flex flex-col gap-1">
                                                <span className="bg-secondary text-secondary-foreground inline-block w-fit rounded px-2 py-0.5 font-medium">
                                                    {device.selected_sim_slot
                                                        ? t(
                                                              'devices.onlySim',
                                                              'Faqat SIM {{slot}}',
                                                              {
                                                                  slot: device.selected_sim_slot,
                                                              },
                                                          )
                                                        : t(
                                                              'devices.bothSims',
                                                              'Ikkala SIM',
                                                          )}
                                                </span>
                                                {device.sim_slots_info && (
                                                    <div className="text-muted-foreground flex flex-col gap-0.5 font-mono text-[11px]">
                                                        {device.sim_slots_info
                                                            ?.sim1
                                                            ?.phone_number && (
                                                            <span>
                                                                SIM 1:{' '}
                                                                {
                                                                    device
                                                                        .sim_slots_info
                                                                        .sim1
                                                                        .phone_number
                                                                }{' '}
                                                                {device
                                                                    .sim_slots_info
                                                                    .sim1
                                                                    .carrier
                                                                    ? `(${device.sim_slots_info.sim1.carrier})`
                                                                    : ''}
                                                            </span>
                                                        )}
                                                        {device.sim_slots_info
                                                            ?.sim2
                                                            ?.phone_number && (
                                                            <span>
                                                                SIM 2:{' '}
                                                                {
                                                                    device
                                                                        .sim_slots_info
                                                                        .sim2
                                                                        .phone_number
                                                                }{' '}
                                                                {device
                                                                    .sim_slots_info
                                                                    .sim2
                                                                    .carrier
                                                                    ? `(${device.sim_slots_info.sim2.carrier})`
                                                                    : ''}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            {device.accessibility_service_enabled ? (
                                                <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                                    <CheckCircle2 className="h-4 w-4" />{' '}
                                                    {t(
                                                        'devices.active',
                                                        'Faol',
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                                                    <XCircle className="h-4 w-4" />{' '}
                                                    {t(
                                                        'devices.disabled',
                                                        'O\x27chirilgan',
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3.5 text-xs">
                                            {device.battery_level !==
                                                undefined &&
                                            device.battery_level !== null ? (
                                                <div className="flex items-center gap-1.5 font-mono">
                                                    <Battery className="text-muted-foreground h-4 w-4" />
                                                    <span>
                                                        {device.battery_level}%
                                                    </span>
                                                </div>
                                            ) : (
                                                '—'
                                            )}
                                        </td>
                                        <td className="px-4 py-3.5 text-xs">
                                            {device.is_paired ? (
                                                <div className="text-muted-foreground">
                                                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                                                        <CheckCircle2 className="h-3 w-3" />{' '}
                                                        {t(
                                                            'devices.paired',
                                                            'Ulangan',
                                                        )}
                                                    </span>
                                                    {device.last_seen_at && (
                                                        <span className="block font-mono text-[11px]">
                                                            {formatDateTime(
                                                                device.last_seen_at,
                                                                {
                                                                    hour: '2-digit',
                                                                    minute: '2-digit',
                                                                    day: '2-digit',
                                                                    month: '2-digit',
                                                                },
                                                            )}
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                '—'
                                            )}
                                        </td>
                                        <td className="px-4 py-3.5 text-right">
                                            <div className="flex justify-end gap-1">
                                                {!device.is_paired &&
                                                    device.pairing_code && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-primary hover:bg-primary/10 h-8 w-8"
                                                            title={t(
                                                                'devices.scanQrCode',
                                                                'QR-kodni skanerlash',
                                                            )}
                                                            onClick={() => {
                                                                setSelectedPairingDevice(
                                                                    device,
                                                                );
                                                                setShowPairModal(
                                                                    true,
                                                                );
                                                            }}
                                                        >
                                                            <QrCode className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-muted-foreground hover:text-foreground h-8 w-8"
                                                    onClick={() =>
                                                        openEdit(device)
                                                    }
                                                >
                                                    <Edit3 className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive hover:bg-destructive/10 h-8 w-8"
                                                    onClick={() =>
                                                        handleDelete(device)
                                                    }
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>

                {/* Pagination */}
                {pagination && (
                    <PaginationNav
                        links={pagination.links}
                        current_page={pagination.current_page}
                        last_page={pagination.last_page}
                        from={pagination.from}
                        to={pagination.to}
                        total={pagination.total}
                        per_page={pagination.per_page}
                    />
                )}
            </div>

            {/* Step-by-Step Installation & Setup Instruction Guide Modal */}
            {showGuideModal && (
                <div
                    className="bg-background/80 animate-in fade-in fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xs duration-200"
                    onClick={() => setShowGuideModal(false)}
                >
                    <div
                        className="bg-card border-border animate-in zoom-in-95 relative max-h-[90vh] w-full max-w-4xl space-y-5 overflow-y-auto rounded-2xl border p-5 shadow-2xl duration-200 md:p-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="from-primary absolute top-0 right-0 left-0 h-1 rounded-t-2xl bg-gradient-to-r via-indigo-500 to-emerald-500" />

                        <div className="border-border/60 flex items-center justify-between border-b pt-1 pb-4">
                            <div className="flex items-start gap-3 sm:items-center">
                                <div className="bg-primary/10 text-primary shrink-0 rounded-xl p-2.5">
                                    <BookOpen className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="text-foreground text-base font-bold sm:text-lg">
                                        {t(
                                            'devices.guideTitle',
                                            "Agent1Call ilovasini o'rnatish va sozlash yo'riqnomasi",
                                        )}
                                    </h3>
                                    <p className="text-muted-foreground text-xs">
                                        {t(
                                            'devices.guideSubtitle',
                                            "Qo'ng'iroqlarni aniqlash, audio yozish va CRM bilan sinxronlashni 4 ta qadamda sozlang",
                                        )}
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground hover:text-foreground h-8 w-8 rounded-lg"
                                onClick={() => setShowGuideModal(false)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* 4 Steps Grid */}
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                            {/* Step 1 */}
                            <div className="bg-secondary/30 border-border/70 flex flex-col justify-between space-y-3 rounded-xl border p-4">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-primary bg-primary/10 rounded-md px-2 py-0.5 text-[11px] font-bold tracking-wider uppercase">
                                            1-QADAM
                                        </span>
                                        <Download className="text-primary/70 h-4 w-4" />
                                    </div>
                                    <h4 className="text-foreground text-sm font-bold">
                                        {t(
                                            'devices.step1Title',
                                            '1-Qadam: APK ni yuklab olish',
                                        )}
                                    </h4>
                                    <p className="text-muted-foreground text-xs">
                                        {t(
                                            'devices.step1Desc',
                                            "Agent1Call APK faylini yuklab oling va telefonda o'rnating.",
                                        )}
                                    </p>
                                </div>

                                <div className="border-border/40 space-y-2 border-t pt-2">
                                    <a
                                        href="/downloads/app"
                                        download="1call-agent.apk"
                                        className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-semibold shadow-xs transition-colors"
                                    >
                                        <Download className="h-3.5 w-3.5" />{' '}
                                        Agent1Call v1.0.1 (.apk)
                                    </a>
                                    <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-2 text-[11px] leading-snug text-amber-800 dark:text-amber-300">
                                        <strong>Play Protect:</strong> Agar
                                        bloklasa,{' '}
                                        <em>"Batafsil / Подробнее"</em> &rarr;{' '}
                                        <em>
                                            "Har holda o'rnatish / Все равно
                                            установить"
                                        </em>{' '}
                                        ni bosing.
                                    </div>
                                </div>
                            </div>

                            {/* Step 2 */}
                            <div className="bg-secondary/30 border-border/70 flex flex-col justify-between space-y-3 rounded-xl border p-4">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="rounded-md bg-blue-500/10 px-2 py-0.5 text-[11px] font-bold tracking-wider text-blue-600 uppercase dark:text-blue-400">
                                            2-QADAM
                                        </span>
                                        <CheckCircle2 className="h-4 w-4 text-blue-500/70" />
                                    </div>
                                    <h4 className="text-foreground text-sm font-bold">
                                        {t(
                                            'devices.step2Title',
                                            '2-Qadam: Tizim ruxsatnomalari',
                                        )}
                                    </h4>
                                    <p className="text-muted-foreground text-xs">
                                        {t(
                                            'devices.step2Desc',
                                            "Ilova so'ragan ruxsatlarni bering:",
                                        )}
                                    </p>
                                </div>

                                <div className="text-muted-foreground border-border/40 space-y-1.5 border-t pt-2 text-xs">
                                    <div className="text-foreground flex items-center gap-1.5">
                                        <PhoneCall className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                                        <span className="text-[11px] font-medium">
                                            {t(
                                                'devices.step2Item1',
                                                "Telefon qo'ng'iroqlari: Raqamlarni aniqlash",
                                            )}
                                        </span>
                                    </div>
                                    <div className="text-foreground flex items-center gap-1.5">
                                        <Mic className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                                        <span className="text-[11px] font-medium">
                                            {t(
                                                'devices.step2Item2',
                                                'Mikrofon: Suhbat audiosini yozish (AAC)',
                                            )}
                                        </span>
                                    </div>
                                    <div className="text-foreground flex items-center gap-1.5">
                                        <Zap className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                                        <span className="text-[11px] font-medium">
                                            {t(
                                                'devices.step2Item3',
                                                "Fondagi faoliyat: Batareya tejashni o'chirish",
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Step 3 */}
                            <div className="flex flex-col justify-between space-y-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 dark:bg-amber-950/20">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="rounded-md bg-amber-500/20 px-2 py-0.5 text-[11px] font-bold tracking-wider text-amber-700 uppercase dark:text-amber-300">
                                            3-QADAM • MUHIM
                                        </span>
                                        <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                    </div>
                                    <h4 className="text-foreground text-sm font-bold">
                                        {t(
                                            'devices.step3Title',
                                            "3-Qadam: Qo'ng'iroq yozuv xizmati (Android 13+)",
                                        )}
                                    </h4>
                                    <p className="text-muted-foreground text-xs">
                                        {t(
                                            'devices.step3Desc',
                                            'Maxsus imkoniyatlar (Accessibility) orqali avto-yozish xizmatini yoqing.',
                                        )}
                                    </p>
                                </div>

                                <div className="bg-card/90 space-y-1 rounded-lg border border-amber-500/30 p-2.5 text-[11px] leading-snug">
                                    <p className="font-semibold text-amber-800 dark:text-amber-300">
                                        {t(
                                            'devices.step3RestrictedWarning',
                                            'Agar "Controlled by Restricted Setting" chiqsa:',
                                        )}
                                    </p>
                                    <ol className="text-muted-foreground list-inside list-decimal space-y-0.5">
                                        <li>
                                            Ilova ustiga 2 soniya bosib{' '}
                                            <strong>ⓘ (Ilova haqida)</strong> ni
                                            bosing.
                                        </li>
                                        <li>
                                            Yuqori o'ngdagi{' '}
                                            <strong>3 nuqta (⋮)</strong> &rarr;{' '}
                                            <em>
                                                \"Разрешить ограниченные
                                                настройки\"
                                            </em>
                                            .
                                        </li>
                                        <li>
                                            Accessibility bo'limida Agent1Call
                                            ni <strong>Yoqing (ON)</strong>.
                                        </li>
                                    </ol>
                                    <p className="text-muted-foreground pt-0.5 text-[10px] italic">
                                        * \"Shortcut\"ni yoqish shart emas,
                                        o'chiq qolsin.
                                    </p>
                                </div>
                            </div>

                            {/* Step 4 */}
                            <div className="bg-secondary/30 border-border/70 flex flex-col justify-between space-y-3 rounded-xl border p-4">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="rounded-md bg-indigo-500/10 px-2 py-0.5 text-[11px] font-bold tracking-wider text-indigo-600 uppercase dark:text-indigo-400">
                                            4-QADAM
                                        </span>
                                        <QrCode className="h-4 w-4 text-indigo-500/70" />
                                    </div>
                                    <h4 className="text-foreground text-sm font-bold">
                                        {t(
                                            'devices.step4Title',
                                            '4-Qadam: Qurilmani ulash (QR Kod)',
                                        )}
                                    </h4>
                                    <p className="text-muted-foreground text-xs">
                                        {t(
                                            'devices.step4Desc',
                                            'Ushbu sahifada "Yangi telefon ulash" tugmasini bosing va ekrandagi QR-kodni kameraga tuting.',
                                        )}
                                    </p>
                                </div>

                                <div className="border-border/40 space-y-2 border-t pt-2">
                                    <Button
                                        size="sm"
                                        onClick={() => {
                                            setShowGuideModal(false);
                                            generateCode();
                                        }}
                                        className="h-8 w-full gap-1.5 text-xs font-semibold"
                                    >
                                        <Plus className="h-3.5 w-3.5" />{' '}
                                        {t(
                                            'devices.addDevice',
                                            'Yangi telefon ulash',
                                        )}
                                    </Button>
                                    <p className="text-center text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                                        {t(
                                            'devices.step4Success',
                                            "Tayyor! Barcha qo'ng'iroqlar avtomatik yozilib CRM ga yuklanadi.",
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="border-border/60 flex items-center justify-between border-t pt-2">
                            <span className="text-muted-foreground text-xs">
                                Agent1Call v1.0.1
                            </span>
                            <Button
                                variant="default"
                                size="sm"
                                className="h-8 px-5 text-xs font-semibold"
                                onClick={() => setShowGuideModal(false)}
                            >
                                {t('devices.closeBtn', 'Tushunarli / Yopish')}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Pairing Modal with QR Code */}
            {showPairModal && activePairingDevice?.pairing_code && (
                <div
                    className="bg-background/80 animate-in fade-in fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xs duration-200"
                    onClick={() => {
                        setShowPairModal(false);
                        setSelectedPairingDevice(null);
                    }}
                >
                    <div
                        className="bg-card border-border max-h-[90vh] w-full max-w-md space-y-4 overflow-y-auto rounded-2xl border p-6 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="space-y-1 text-center">
                            <div className="bg-primary/10 text-primary mb-1 inline-flex rounded-full p-2">
                                <QrCode className="h-5 w-5" />
                            </div>
                            <h3 className="text-lg font-bold tracking-tight">
                                {t(
                                    'devices.pairModalTitle',
                                    'Android Telefonni Ulash',
                                )}
                            </h3>
                            <div className="bg-muted text-muted-foreground inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold">
                                {activePairingDevice.name}
                            </div>
                        </div>

                        {/* High-contrast QR Code Card */}
                        <div className="mx-auto flex w-fit items-center justify-center rounded-2xl border border-neutral-200 bg-white p-3.5 shadow-sm">
                            {qrSvg ? (
                                <div
                                    className="flex h-[190px] w-[190px] items-center justify-center [&>svg]:h-full [&>svg]:w-full"
                                    dangerouslySetInnerHTML={{ __html: qrSvg }}
                                />
                            ) : (
                                <div className="text-muted-foreground flex h-[190px] w-[190px] items-center justify-center">
                                    <RefreshCw className="text-primary h-6 w-6 animate-spin" />
                                </div>
                            )}
                        </div>

                        {/* Fallback 6-digit Manual Code */}
                        <div className="bg-muted/70 border-border flex items-center justify-between rounded-xl border p-3">
                            <div>
                                <div className="text-muted-foreground text-[11px] font-medium">
                                    {t(
                                        'devices.backupCodeTitle',
                                        'Zaxira 6 xonali ulanish kodi:',
                                    )}
                                </div>
                                <div className="text-primary font-mono text-2xl font-extrabold tracking-widest">
                                    {activePairingDevice.pairing_code}
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 gap-1.5 text-xs"
                                onClick={copyPairingCode}
                            >
                                {copied ? (
                                    <>
                                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                                        {t('devices.copied', 'Nusxalandi')}
                                    </>
                                ) : (
                                    <>
                                        <Copy className="h-3.5 w-3.5" />
                                        {t('devices.copy', 'Nusxa olish')}
                                    </>
                                )}
                            </Button>
                        </div>

                        {/* Visual Onboarding Instructions */}
                        <div className="bg-secondary/40 border-border/60 space-y-1.5 rounded-xl border p-3 text-xs">
                            <p className="text-foreground flex items-center gap-1.5 font-semibold">
                                <Smartphone className="text-primary h-4 w-4" />{' '}
                                {t(
                                    'devices.androidSteps',
                                    'Android telefonda bajariladigan amallar:',
                                )}
                            </p>
                            <ol className="text-muted-foreground list-inside list-decimal space-y-1 text-[11px]">
                                <li>
                                    {t(
                                        'devices.qrStep1',
                                        'Telefonda Agent1Call ilovasini oching.',
                                    )}{' '}
                                    (
                                    {t(
                                        'devices.qrStep1NotInstalled',
                                        'Hali o\x27rnatilmagan bo\x27lsa:',
                                    )}{' '}
                                    <a
                                        href="/downloads/app"
                                        download="1call-agent.apk"
                                        className="text-primary font-semibold underline hover:opacity-80"
                                    >
                                        {t(
                                            'devices.qrStep1Download',
                                            'APK ni yuklab oling',
                                        )}
                                    </a>
                                    )
                                </li>
                                <li>
                                    {t(
                                        'devices.qrStep2',
                                        '"QR-kodni skanerlash" tugmasini bosing va kamerani ushbu QR-kodga qarating.',
                                    )}
                                </li>
                                <li>
                                    {t(
                                        'devices.qrStep3',
                                        'Qurilma avtomatik ulanadi va audio yozish uchun ruxsatlar faollashadi.',
                                    )}
                                </li>
                            </ol>
                        </div>

                        {/* Android 13/14/15 Restricted Setting Helper */}
                        <div className="space-y-1 rounded-xl border border-amber-500/25 bg-amber-500/10 p-2.5 text-xs">
                            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-800 dark:text-amber-300">
                                <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                                <span>
                                    {t(
                                        'devices.restrictedModalTip',
                                        'Android 13+ da ruxsat berishda qiyinchilik bo\x27ldimi?',
                                    )}
                                </span>
                            </div>
                            <p className="text-muted-foreground text-[10px] leading-relaxed">
                                {t(
                                    'devices.restrictedModalHint',
                                    'Ilova ustiga 2 soniya bosib turing -> ⓘ (Ilova haqida) -> Yuqoridagi 3 nuqta (⋮) -> "Разрешить ограниченные настройки" (Allow restricted settings). So\x27ng Accessibility xizmatini yoqing.',
                                )}
                            </p>
                        </div>

                        <Button
                            className="h-9 w-full text-xs font-semibold"
                            onClick={() => {
                                setShowPairModal(false);
                                setSelectedPairingDevice(null);
                            }}
                        >
                            {t('devices.closeBtn', 'Tushunarli / Yopish')}
                        </Button>
                    </div>
                </div>
            )}

            {/* Edit Device Modal */}
            {editingDevice && (
                <div className="bg-background/80 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
                    <form
                        onSubmit={handleUpdate}
                        className="bg-card border-border w-full max-w-md space-y-4 rounded-2xl border p-6 shadow-xl"
                    >
                        <h3 className="text-lg font-bold">
                            {t(
                                'devices.editDeviceModalTitle',
                                'Telefon parametrlarini tahrirlash',
                            )}
                        </h3>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold">
                                {t('devices.name', 'Qurilma nomi')}
                            </label>
                            <Input
                                value={data.name}
                                onChange={(e) =>
                                    setData('name', e.target.value)
                                }
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold">
                                {t(
                                    'devices.dualSim',
                                    'Korporativ SIM Slot (Dual-SIM)',
                                )}
                            </label>
                            <select
                                value={data.selected_sim_slot}
                                onChange={(e) =>
                                    setData('selected_sim_slot', e.target.value)
                                }
                                className="border-input h-9 w-full rounded-md border bg-transparent px-3 text-xs"
                            >
                                <option value="">
                                    {t(
                                        'devices.bothSimsRecord',
                                        'Ikkala SIM kartani ham yozish',
                                    )}
                                </option>
                                <option value="1">
                                    {t(
                                        'devices.sim1Only',
                                        'Faqat SIM 1 (SIM 2 shaxsiy deb hisoblanadi)',
                                    )}
                                </option>
                                <option value="2">
                                    {t(
                                        'devices.sim2Only',
                                        'Faqat SIM 2 (SIM 1 shaxsiy deb hisoblanadi)',
                                    )}
                                </option>
                            </select>
                            <p className="text-muted-foreground text-[11px]">
                                {t(
                                    'devices.dualSimDesc',
                                    'Shaxsiy SIM orqali amalga oshirilgan suhbatlar serverga yuklanmaydi va yozilmaydi.',
                                )}
                            </p>
                        </div>

                        <div className="border-border space-y-3 border-t pt-3">
                            <div className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                                {t(
                                    'devices.simNumbersTitle',
                                    'SIM Kartalar va Operator Raqamlari',
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <label className="text-foreground/80 text-[11px] font-medium">
                                        SIM 1 Raqami
                                    </label>
                                    <Input
                                        placeholder="+998 90 123 45 67"
                                        value={data.sim1_number}
                                        onChange={(e) =>
                                            setData(
                                                'sim1_number',
                                                e.target.value,
                                            )
                                        }
                                        className="font-mono text-xs"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-foreground/80 text-[11px] font-medium">
                                        SIM 1 Operator (Nomi)
                                    </label>
                                    <Input
                                        placeholder="Beeline / Asosiy"
                                        value={data.sim1_carrier}
                                        onChange={(e) =>
                                            setData(
                                                'sim1_carrier',
                                                e.target.value,
                                            )
                                        }
                                        className="text-xs"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <label className="text-foreground/80 text-[11px] font-medium">
                                        SIM 2 Raqami
                                    </label>
                                    <Input
                                        placeholder="+998 93 987 65 43"
                                        value={data.sim2_number}
                                        onChange={(e) =>
                                            setData(
                                                'sim2_number',
                                                e.target.value,
                                            )
                                        }
                                        className="font-mono text-xs"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-foreground/80 text-[11px] font-medium">
                                        SIM 2 Operator (Nomi)
                                    </label>
                                    <Input
                                        placeholder="Ucell / Qo'shimcha"
                                        value={data.sim2_carrier}
                                        onChange={(e) =>
                                            setData(
                                                'sim2_carrier',
                                                e.target.value,
                                            )
                                        }
                                        className="text-xs"
                                    />
                                </div>
                            </div>
                            <p className="text-muted-foreground text-[11px]">
                                Ushbu raqamlar qo'ng'iroqlar jurnalida qaysi SIM
                                va operator raqami orqali gaplashilganini
                                ko'rsatish uchun xizmat qiladi.
                            </p>
                        </div>

                        <div className="flex gap-2 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                className="flex-1"
                                onClick={() => setEditingDevice(null)}
                            >
                                {t('devices.cancel', 'Bekor qilish')}
                            </Button>
                            <Button
                                type="submit"
                                className="flex-1"
                                disabled={processing}
                            >
                                {t('devices.save', 'Saqlash')}
                            </Button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
