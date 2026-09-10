import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
    const [editingDevice, setEditingDevice] = useState<DeviceItem | null>(null);
    const [showPairModal, setShowPairModal] = useState(false);

    const { data, setData, put, processing, reset } = useForm({
        name: '',
        user_id: '',
        selected_sim_slot: '',
    });

    const openEdit = (device: DeviceItem) => {
        setEditingDevice(device);
        setData({
            name: device.name,
            user_id: device.user_id ? String(device.user_id) : '',
            selected_sim_slot: device.selected_sim_slot ? String(device.selected_sim_slot) : '',
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
        if (confirm(`Haqiqatan ham "${device.name}" qurilmasini o'chirmoqchimisiz?`)) {
            router.delete(`/devices/${device.id}`);
        }
    };

    const generateCode = () => {
        router.post('/devices/pair-code', {}, {
            onSuccess: () => setShowPairModal(true),
        });
    };

    const pendingPairingCode = devices.find((d) => !d.is_paired && d.pairing_code)?.pairing_code;

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            <Head title="Telefonlar va Qurilmalar" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Ulangan Telefonlar</h2>
                    <p className="text-sm text-muted-foreground">
                        Kompaniya xodimlarining mobil telefonlari va monitoring agentlari
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Button onClick={generateCode} size="sm" className="h-9">
                        <Plus className="h-4 w-4 mr-1.5" /> Yangi telefon ulash
                    </Button>
                </div>
            </div>

            {/* Quota Indicator Card */}
            <div className="bg-card p-5 rounded-xl border border-border flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
                <div className="flex items-center gap-3">
                    <Smartphone className="h-6 w-6 text-primary" />
                    <div>
                        <h4 className="font-semibold text-sm">Faol telefonlar: {quota.paired} / {quota.allowed} ta</h4>
                        <p className="text-xs text-muted-foreground">
                            {quota.paired >= quota.allowed
                                ? "Mavjud limit tugadi. Yangi telefon ulash uchun tarifingizni kengaytiring."
                                : `Yana ${quota.allowed - quota.paired} ta telefon ulash imkoniyati mavjud.`}
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
                            <th className="py-3 px-4">Qurilma nomi</th>
                            <th className="py-3 px-4">Mas'ul Operator</th>
                            <th className="py-3 px-4">SIM Slot</th>
                            <th className="py-3 px-4">Accessibility</th>
                            <th className="py-3 px-4">Batareya</th>
                            <th className="py-3 px-4">Holat / Oxirgi faollik</th>
                            <th className="py-3 px-4 text-right">Amallar</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {devices.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="py-8 text-center text-muted-foreground text-sm">
                                    Hozircha hech qanday telefon ulanmagan. "Yangi telefon ulash" tugmasini bosing.
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
                                        {device.user?.name || <span className="text-muted-foreground italic">Biriktirilmagan</span>}
                                    </td>
                                    <td className="py-3.5 px-4 text-xs">
                                        <span className="bg-secondary px-2 py-0.5 rounded text-secondary-foreground font-medium">
                                            {device.selected_sim_slot ? `Faqat SIM ${device.selected_sim_slot}` : 'Ikkala SIM'}
                                        </span>
                                    </td>
                                    <td className="py-3.5 px-4">
                                        {device.accessibility_service_enabled ? (
                                            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                                                <CheckCircle2 className="h-4 w-4" /> Faol
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium">
                                                <XCircle className="h-4 w-4" /> O'chirilgan
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
                                            '—'
                                        )}
                                    </td>
                                    <td className="py-3.5 px-4 text-xs text-muted-foreground">
                                        {device.is_paired ? (
                                            <div>
                                                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1.5" />
                                                Ulangan • {device.last_seen_at ? new Date(device.last_seen_at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }) : 'Yaqinda'}
                                            </div>
                                        ) : (
                                            <div className="text-amber-600 font-mono font-medium">
                                                Kod: {device.pairing_code} (Kutilmoqda)
                                            </div>
                                        )}
                                    </td>
                                    <td className="py-3.5 px-4 text-right">
                                        <div className="flex justify-end gap-1">
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

            {/* Pairing Modal */}
            {showPairModal && pendingPairingCode && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-xl space-y-5">
                        <div className="text-center space-y-2">
                            <h3 className="text-xl font-bold">Android Ilovani Ulash</h3>
                            <p className="text-xs text-muted-foreground">
                                Android telefonda <b>agent.1call.uz</b> ilovasini oching va quyidagi 6 xonali ulanish kodini kiriting:
                            </p>
                        </div>

                        <div className="bg-muted p-5 rounded-xl text-center">
                            <span className="text-3xl font-mono font-extrabold tracking-widest text-primary">
                                {pendingPairingCode}
                            </span>
                        </div>

                        <div className="space-y-2 text-xs text-muted-foreground bg-secondary/50 p-3.5 rounded-lg">
                            <p className="font-semibold text-foreground">Ko'rsatma:</p>
                            <ol className="list-decimal list-inside space-y-1">
                                <li>Ilovada "Ulanish kodini kiritish" tugmasini bosing.</li>
                                <li>Kod kiritilgach, ilova avtomatik ushbu kompaniya bilan sinxronlashadi.</li>
                                <li>Accessibility xizmatiga ruxsat berishni unutmang.</li>
                            </ol>
                        </div>

                        <Button className="w-full" onClick={() => setShowPairModal(false)}>
                            Tushunarli / Yopish
                        </Button>
                    </div>
                </div>
            )}

            {/* Edit Device Modal */}
            {editingDevice && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <form onSubmit={handleUpdate} className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4">
                        <h3 className="text-lg font-bold">Qurilma sozlamalari</h3>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold">Qurilma nomi</label>
                            <Input
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold">Biriktirilgan Operator</label>
                            <select
                                value={data.user_id}
                                onChange={(e) => setData('user_id', e.target.value)}
                                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-xs"
                            >
                                <option value="">Biriktirilmagan</option>
                                {operators.map((op) => (
                                    <option key={op.id} value={op.id}>{op.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold">Korporativ SIM Slot (Dual-SIM)</label>
                            <select
                                value={data.selected_sim_slot}
                                onChange={(e) => setData('selected_sim_slot', e.target.value)}
                                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-xs"
                            >
                                <option value="">Ikkala SIM kartani ham yozish</option>
                                <option value="1">Faqat SIM 1 (SIM 2 shaxsiy deb hisoblanadi)</option>
                                <option value="2">Faqat SIM 2 (SIM 1 shaxsiy deb hisoblanadi)</option>
                            </select>
                            <p className="text-[11px] text-muted-foreground">
                                Shaxsiy SIM orqali amalga oshirilgan suhbatlar serverga yuklanmaydi va yozilmaydi.
                            </p>
                        </div>

                        <div className="flex gap-2 pt-2">
                            <Button type="button" variant="outline" className="flex-1" onClick={() => setEditingDevice(null)}>
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
