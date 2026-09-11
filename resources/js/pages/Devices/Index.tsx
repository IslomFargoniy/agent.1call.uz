import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Head, useForm, router } from "@inertiajs/react";
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
} from "lucide-react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DeviceItem {
    id: number;
    name: string;
    model?: string;
    device_uid: string;
    selected_sim_slot?: number;
    accessibility_service_enabled: boolean;
    battery_level?: number;
    pairing_code?: string;
    is_paired: boolean;
    last_seen_at?: string;
    user?: { id: number; name: string };
    user_id?: number;
}

interface DevicesProps {
    devices: DeviceItem[];
    operators: { id: number; name: string }[];
    quota: {
        allowed: number;
        paired: number;
    };
    tenant_uuid?: string;
}

export default function DevicesIndex({ devices, operators, quota, tenant_uuid }: DevicesProps) {
    const { t } = useTranslation();
    const [editingDevice, setEditingDevice] = useState<DeviceItem | null>(null);
    const [selectedPairingDevice, setSelectedPairingDevice] = useState<DeviceItem | null>(null);
    const [showPairModal, setShowPairModal] = useState(false);
    const [qrSvg, setQrSvg] = useState<string>("");
    const [copied, setCopied] = useState(false);

    const { data, setData, put, processing, reset } = useForm({
        name: "",
        user_id: "",
        selected_sim_slot: "",
    });

    const activePairingDevice =
        selectedPairingDevice || devices.find((d) => !d.is_paired && d.pairing_code);

    useEffect(() => {
        if (!activePairingDevice?.pairing_code) {
            setQrSvg("");
            return;
        }

        const serverUrl = typeof window !== "undefined" ? window.location.origin : "https://agent.1call.uz";
        const payload = JSON.stringify({
            app: "1call-agent",
            v: 1,
            server: serverUrl,
            tenant_uuid: tenant_uuid || "",
            pairing_code: activePairingDevice.pairing_code,
            name: activePairingDevice.name || "Android Telefon",
        });

        QRCode.toString(payload, {
            type: "svg",
            margin: 1,
            errorCorrectionLevel: "M",
            color: {
                dark: "#0f172a",
                light: "#ffffff",
            },
        })
            .then((svg) => setQrSvg(svg))
            .catch((err) => {
                console.error("QR code generation error:", err);
                setQrSvg("");
            });
    }, [activePairingDevice?.id, activePairingDevice?.pairing_code, tenant_uuid]);

    const openEdit = (device: DeviceItem) => {
        setEditingDevice(device);
        setData({
            name: device.name,
            user_id: device.user_id ? String(device.user_id) : "",
            selected_sim_slot: device.selected_sim_slot ? String(device.selected_sim_slot) : "",
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
        if (confirm(t("devices.deleteConfirm", "Haqiqatan ham \"{{name}}\" qurilmasini o'chirmoqchimisiz?", { name: device.name }))) {
            router.delete(`/devices/${device.id}`);
        }
    };

    const generateCode = () => {
        router.post("/devices/pair-code", {}, {
            onSuccess: () => {
                setSelectedPairingDevice(null);
                setShowPairModal(true);
            },
        });
    };

    const copyPairingCode = () => {
        if (activePairingDevice?.pairing_code) {
            navigator.clipboard.writeText(activePairingDevice.pairing_code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            <Head title={t("devices.title", "Android Telefonlar Boshqaruvi")} />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">{t("devices.title", "Ulangan Telefonlar")}</h2>
                    <p className="text-sm text-muted-foreground">
                        {t("devices.subtitle", "Kompaniya xodimlarining mobil telefonlari va monitoring agentlari")}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <a
                        href="/downloads/app"
                        download="1call-agent.apk"
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3 gap-1.5"
                    >
                        <Download className="h-4 w-4 text-primary" /> {t("devices.downloadApk", "1Call Agent APK")}
                    </a>
                    <Button onClick={generateCode} size="sm" className="h-9 gap-1.5">
                        <Plus className="h-4 w-4" /> {t("devices.addDevice", "Yangi telefon ulash")}
                    </Button>
                </div>
            </div>

            {/* Quota Indicator Card */}
            <div className="bg-card p-5 rounded-xl border border-border flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
                <div className="flex items-center gap-3">
                    <Smartphone className="h-6 w-6 text-primary" />
                    <div>
                        <h4 className="font-semibold text-sm">
                            {t("devices.activeDevicesQuota", "Faol telefonlar: {{paired}} / {{allowed}} ta", { paired: quota.paired, allowed: quota.allowed })}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                            {quota.paired >= quota.allowed
                                ? t("devices.limitReached", "Mavjud limit tugadi. Yangi telefon ulash uchun tarifingizni kengaytiring.")
                                : t("devices.remainingQuota", "Yana {{count}} ta telefon ulash imkoniyati mavjud.", { count: quota.allowed - quota.paired })}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-64">
                    <div className="flex-1 bg-secondary h-2.5 rounded-full overflow-hidden">
                        <div
                            className="bg-primary h-full rounded-full transition-all"
                            style={{ width: `${Math.min(100, (quota.paired / quota.allowed) * 100)}%` }}
                        />
                    </div>
                    <span className="text-xs font-mono font-semibold">{quota.paired}/{quota.allowed}</span>
                </div>
            </div>

            {/* Devices Table */}
            <div className="bg-card rounded-xl border border-border shadow-xs overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-muted/50 border-b border-border text-muted-foreground text-xs uppercase font-medium">
                        <tr>
                            <th className="py-3 px-4">{t("devices.name", "Qurilma nomi")}</th>
                            <th className="py-3 px-4">{t("devices.assignedOperator", "Mas'ul Operator")}</th>
                            <th className="py-3 px-4">{t("devices.simSlot", "SIM Slot")}</th>
                            <th className="py-3 px-4">Accessibility</th>
                            <th className="py-3 px-4">{t("devices.batteryLevel", "Batareya")}</th>
                            <th className="py-3 px-4">{t("devices.statusLastSeen", "Holat / Oxirgi faollik")}</th>
                            <th className="py-3 px-4 text-right">{t("devices.actions", "Amallar")}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {devices.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="py-8 text-center text-muted-foreground text-sm">
                                    {t("devices.noDevices", "Hozircha hech qanday telefon ulanmagan. \"Yangi telefon ulash\" tugmasini bosing.")}
                                </td>
                            </tr>
                        ) : (
                            devices.map((device) => (
                                <tr key={device.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="py-3.5 px-4">
                                        <div className="font-semibold">{device.name}</div>
                                        <div className="text-xs text-muted-foreground font-mono">{device.model || device.device_uid}</div>
                                    </td>
                                    <td className="py-3.5 px-4 text-xs font-medium">
                                        {device.user?.name || <span className="text-muted-foreground italic">{t("devices.unassigned", "Biriktirilmagan")}</span>}
                                    </td>
                                    <td className="py-3.5 px-4 text-xs">
                                        <span className="bg-secondary px-2 py-0.5 rounded text-secondary-foreground font-medium">
                                            {device.selected_sim_slot
                                                ? t("devices.onlySim", "Faqat SIM {{slot}}", { slot: device.selected_sim_slot })
                                                : t("devices.bothSims", "Ikkala SIM")}
                                        </span>
                                    </td>
                                    <td className="py-3.5 px-4">
                                        {device.accessibility_service_enabled ? (
                                            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                                                <CheckCircle2 className="h-4 w-4" /> {t("devices.active", "Faol")}
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium">
                                                <XCircle className="h-4 w-4" /> {t("devices.disabled", "O'chirilgan")}
                                            </div>
                                        )}
                                    </td>
                                    <td className="py-3.5 px-4 text-xs">
                                        {device.battery_level !== undefined && device.battery_level !== null ? (
                                            <div className="flex items-center gap-1.5 font-mono">
                                                <Battery className="h-4 w-4 text-muted-foreground" />
                                                <span>{device.battery_level}%</span>
                                            </div>
                                        ) : (
                                            "—"
                                        )}
                                    </td>
                                    <td className="py-3.5 px-4 text-xs">
                                        {device.is_paired ? (
                                            <div className="text-muted-foreground">
                                                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                                                    <CheckCircle2 className="h-3 w-3" /> {t("devices.paired", "Ulangan")}
                                                </span>
                                                {device.last_seen_at && (
                                                    <span className="block text-[11px] font-mono">
                                                        {new Date(device.last_seen_at).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })}
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="space-y-1">
                                                <span className="inline-block text-[11px] bg-amber-500/10 text-amber-700 dark:text-amber-300 font-mono px-2 py-0.5 rounded font-semibold">
                                                    {t("devices.pairingCode", "Kod: {{code}}", { code: device.pairing_code })}
                                                </span>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-6 px-2 text-[11px] font-semibold gap-1 border-primary/30 text-primary hover:bg-primary/10 rounded-md"
                                                    onClick={() => {
                                                        setSelectedPairingDevice(device);
                                                        setShowPairModal(true);
                                                    }}
                                                >
                                                    <QrCode className="h-3 w-3" />
                                                    {t("devices.scanQrBtn", "QR Kod")}
                                                </Button>
                                            </div>
                                        )}
                                    </td>
                                    <td className="py-3.5 px-4 text-right">
                                        <div className="flex justify-end gap-1">
                                            {!device.is_paired && device.pairing_code && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-primary hover:bg-primary/10"
                                                    title={t("devices.scanQrCode", "QR-kodni skanerlash")}
                                                    onClick={() => {
                                                        setSelectedPairingDevice(device);
                                                        setShowPairModal(true);
                                                    }}
                                                >
                                                    <QrCode className="h-4 w-4" />
                                                </Button>
                                            )}
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => openEdit(device)}>
                                                <Edit3 className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(device)}>
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pairing Modal with QR Code */}
            {showPairModal && activePairingDevice?.pairing_code && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                    <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5">
                        <div className="text-center space-y-1.5">
                            <div className="inline-flex p-2.5 rounded-full bg-primary/10 text-primary mb-1">
                                <QrCode className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-bold tracking-tight">{t("devices.pairModalTitle", "Android Telefonni Ulash")}</h3>
                            <div className="inline-block bg-muted px-2.5 py-0.5 rounded-full text-xs font-semibold text-muted-foreground">
                                {activePairingDevice.name}
                            </div>
                        </div>

                        {/* High-contrast QR Code Card */}
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-neutral-200 flex items-center justify-center mx-auto w-fit">
                            {qrSvg ? (
                                <div
                                    className="w-[210px] h-[210px] flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
                                    dangerouslySetInnerHTML={{ __html: qrSvg }}
                                />
                            ) : (
                                <div className="w-[210px] h-[210px] flex items-center justify-center text-muted-foreground">
                                    <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                                </div>
                            )}
                        </div>

                        {/* Fallback 6-digit Manual Code */}
                        <div className="bg-muted/70 border border-border rounded-xl p-3 flex items-center justify-between">
                            <div>
                                <div className="text-[11px] text-muted-foreground font-medium">{t("devices.backupCodeTitle", "Zaxira 6 xonali ulanish kodi:")}</div>
                                <div className="text-2xl font-mono font-extrabold tracking-widest text-primary">
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
                                        {t("devices.copied", "Nusxalandi")}
                                    </>
                                ) : (
                                    <>
                                        <Copy className="h-3.5 w-3.5" />
                                        {t("devices.copy", "Nusxa olish")}
                                    </>
                                )}
                            </Button>
                        </div>

                        {/* Visual Onboarding Instructions */}
                        <div className="bg-secondary/40 border border-border/60 rounded-xl p-3.5 text-xs space-y-2">
                            <p className="font-semibold text-foreground flex items-center gap-1.5">
                                <Smartphone className="h-4 w-4 text-primary" /> {t("devices.androidSteps", "Android telefonda bajariladigan amallar:")}
                            </p>
                            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                                <li>
                                    {t("devices.qrStep1", "Telefonda 1Call Agent ilovasini oching.")} ({t("devices.qrStep1NotInstalled", "Hali o'rnatilmagan bo'lsa:")}{" "}
                                    <a
                                        href="/downloads/app"
                                        download="1call-agent.apk"
                                        className="text-primary underline font-semibold hover:opacity-80"
                                    >
                                        {t("devices.qrStep1Download", "APK ni yuklab oling")}
                                    </a>)
                                </li>
                                <li>{t("devices.qrStep2", "\"QR-kodni skanerlash\" tugmasini bosing va kamerani ushbu QR-kodga qarating.")}</li>
                                <li>{t("devices.qrStep3", "Qurilma avtomatik ulanadi va audio yozish uchun ruxsatlar faollashadi.")}</li>
                            </ol>
                        </div>

                        <Button
                            className="w-full h-10 font-semibold"
                            onClick={() => {
                                setShowPairModal(false);
                                setSelectedPairingDevice(null);
                            }}
                        >
                            {t("devices.closeBtn", "Tushunarli / Yopish")}
                        </Button>
                    </div>
                </div>
            )}

            {/* Edit Device Modal */}
            {editingDevice && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <form onSubmit={handleUpdate} className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4">
                        <h3 className="text-lg font-bold">{t("devices.editDeviceModalTitle", "Telefon parametrlarini tahrirlash")}</h3>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold">{t("devices.name", "Qurilma nomi")}</label>
                            <Input
                                value={data.name}
                                onChange={(e) => setData("name", e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold">{t("devices.assignedOperator", "Biriktirilgan Operator")}</label>
                            <select
                                value={data.user_id}
                                onChange={(e) => setData("user_id", e.target.value)}
                                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-xs"
                            >
                                <option value="">{t("devices.unassigned", "Biriktirilmagan")}</option>
                                {operators.map((op) => (
                                    <option key={op.id} value={op.id}>{op.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold">{t("devices.dualSim", "Korporativ SIM Slot (Dual-SIM)")}</label>
                            <select
                                value={data.selected_sim_slot}
                                onChange={(e) => setData("selected_sim_slot", e.target.value)}
                                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-xs"
                            >
                                <option value="">{t("devices.bothSimsRecord", "Ikkala SIM kartani ham yozish")}</option>
                                <option value="1">{t("devices.sim1Only", "Faqat SIM 1 (SIM 2 shaxsiy deb hisoblanadi)")}</option>
                                <option value="2">{t("devices.sim2Only", "Faqat SIM 2 (SIM 1 shaxsiy deb hisoblanadi)")}</option>
                            </select>
                            <p className="text-[11px] text-muted-foreground">
                                {t("devices.dualSimDesc", "Shaxsiy SIM orqali amalga oshirilgan suhbatlar serverga yuklanmaydi va yozilmaydi.")}
                            </p>
                        </div>

                        <div className="flex gap-2 pt-2">
                            <Button type="button" variant="outline" className="flex-1" onClick={() => setEditingDevice(null)}>
                                {t("devices.cancel", "Bekor qilish")}
                            </Button>
                            <Button type="submit" className="flex-1" disabled={processing}>
                                {t("devices.save", "Saqlash")}
                            </Button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
