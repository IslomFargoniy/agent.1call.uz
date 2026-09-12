import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Head, router } from '@inertiajs/react';
import {
    PhoneCall,
    PhoneIncoming,
    PhoneMissed,
    Download,
    Search,
    Filter,
    Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { WaveformPlayer } from '@/components/waveform-player';
import { PaginationNav } from '@/components/ui/pagination-nav';
import { formatDateTime } from '@/lib/datetime';

interface CallRecord {
    id: number;
    phone_number: string;
    direction: 'inbound' | 'outbound';
    duration_seconds: number;
    sim_slot?: number;
    sim_phone_number?: string;
    sim_operator_name?: string;
    recording_status: string;
    recording_path?: string;
    call_timestamp: string;
    device?: { id: number; name: string; model?: string; sim_slots_info?: any };
    tenant?: { id: number; name: string };
}

interface CallsProps {
    calls: {
        data: CallRecord[];
        links: { url: string | null; label: string; active: boolean }[];
        total: number;
        current_page: number;
        last_page: number;
    };
    filters: {
        search?: string;
        direction?: string;
        status?: string;
        start_date?: string;
        end_date?: string;
        device_id?: string;
        tenant_id?: string;
    };
    devices: { id: number; name: string; tenant?: { id: number; name: string } }[];
    tenants?: { id: number; name: string }[];
    canDownload: boolean;
}

export default function CallsIndex({ calls, filters, devices, tenants = [], canDownload }: CallsProps) {
    const { auth, superadmin } = usePage<any>().props;
    const isSuperAdmin = auth?.user?.role === "superadmin";
    const isAllTenants = isSuperAdmin && !superadmin?.selected_tenant;
    const { t } = useTranslation();
    const [search, setSearch] = useState(filters.search || '');
    const [direction, setDirection] = useState(filters.direction || '');
    const [status, setStatus] = useState(filters.status || '');
    const [deviceId, setDeviceId] = useState(filters.device_id || '');
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');

    const applyFilters = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        router.get('/calls', {
            search: search || undefined,
            direction: direction || undefined,
            status: status || undefined,
            device_id: deviceId || undefined,
            start_date: startDate || undefined,
            end_date: endDate || undefined,
            tenant_id: tenantId || undefined,
        }, { preserveState: true });
    };

    const resetFilters = () => {
        setSearch('');
        setDirection('');
        setStatus('');
        setDeviceId('');
        setStartDate('');
        setEndDate('');
        setTenantId('');
        router.get('/calls');
    };

    const formatDuration = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}m ${s}s`;
    };

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            <Head title={t('calls.title', "Qo'ng'iroqlar jurnali")} />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">{t('calls.title', "Qo'ng'iroqlar jurnali")}</h2>
                    <p className="text-sm text-muted-foreground">
                        {t('calls.totalCalls', 'Jami qayd etilgan: {{count}} ta qo\'ng\'iroq', { count: calls.total })}
                    </p>
                </div>
            </div>

            {/* Filters Bar */}
            <form onSubmit={applyFilters} className={`bg-card p-4 rounded-xl border border-border grid grid-cols-1 md:grid-cols-4 ${tenants && tenants.length > 0 ? "lg:grid-cols-8" : "lg:grid-cols-7"} gap-3 shadow-xs`}>
                {tenants && tenants.length > 0 && (
                    <div>
                        <select
                            value={tenantId}
                            onChange={(e) => setTenantId(e.target.value)}
                            className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                            <option value="">{t("calls.allTenants", "Barcha kompaniyalar")}</option>
                            {tenants.map((ten) => (
                                <option key={ten.id} value={ten.id}>{ten.name}</option>
                            ))}
                        </select>
                    </div>
                )}
                <div className="lg:col-span-2 relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={t('calls.searchPlaceholder', 'Telefon raqam...')}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 h-9 text-xs"
                    />
                </div>

                <div>
                    <select
                        value={direction}
                        onChange={(e) => setDirection(e.target.value)}
                        className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                        <option value="">{t('calls.allDirections', "Barcha yo'nalishlar")}</option>
                        <option value="inbound">{t('calls.inbound', 'Kiruvchi')}</option>
                        <option value="outbound">{t('calls.outbound', 'Chiquvchi')}</option>
                    </select>
                </div>

                <div>
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                        <option value="">{t('calls.allStatuses', 'Barcha holatlar')}</option>
                        <option value="answered">{t('calls.answered', 'Suhbat qurildi')}</option>
                        <option value="missed">{t('calls.missed', 'Javobsiz')}</option>
                    </select>
                </div>

                <div>
                    <select
                        value={deviceId}
                        onChange={(e) => setDeviceId(e.target.value)}
                        className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                        <option value="">{t('calls.allDevices', 'Barcha telefonlar')}</option>
                        {devices.map((d) => (
                            <option key={d.id} value={d.id}>{d.name}{isAllTenants && d.tenant?.name ? ` (${d.tenant.name})` : ""}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="h-9 text-xs"
                    />
                </div>

                <div className="flex gap-2">
                    <Button type="submit" size="sm" className="h-9 flex-1 text-xs">
                        <Filter className="h-3.5 w-3.5 mr-1" /> {t('calls.search', 'Izlash')}
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={resetFilters} className="h-9 text-xs">
                        {t('calls.reset', 'Tozalash')}
                    </Button>
                </div>
            </form>

            {/* Calls Table */}
            <div className="bg-card rounded-xl border border-border shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-muted/50 border-b border-border text-muted-foreground text-xs uppercase font-medium">
                            <tr>
                                <th className="py-3 px-4 w-12 text-center">№</th>
                                <th className="py-3 px-4">{t('calls.directionNumber', "Yo'nalish / Raqam")}</th>
                                {isAllTenants && <th className="py-3 px-4">{t('calls.company', 'Kompaniya')}</th>}
                                <th className="py-3 px-4">{t('calls.deviceSim', 'Qurilma / SIM')}</th>
                                <th className="py-3 px-4">{t('calls.time', 'Vaqti')}</th>
                                <th className="py-3 px-4">{t('calls.audioRecording', 'Audio yozuv')}</th>
                                {canDownload && <th className="py-3 px-4 text-right">{t('calls.download', 'Yuklab olish')}</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {calls.data.length === 0 ? (
                                <tr>
                                    <td colSpan={canDownload ? (isAllTenants ? 7 : 6) : (isAllTenants ? 6 : 5)} className="py-8 text-center text-muted-foreground text-sm">
                                        {t('calls.noCallsFound', "Ko'rsatilgan filtrlar bo'yicha hech qanday qo'ng'iroq topilmadi.")}
                                    </td>
                                </tr>
                            ) : (
                                calls.data.map((call, idx) => (
                                    <tr key={call.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="py-3.5 px-4 text-center font-mono text-xs text-muted-foreground">
                                            {((calls.current_page - 1) * (calls.per_page || 10)) + idx + 1}
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <div className="flex items-center gap-2.5">
                                                <div className={`p-1.5 rounded-md ${
                                                    call.duration_seconds > 0
                                                        ? 'bg-emerald-500/10 text-emerald-600'
                                                        : 'bg-red-500/10 text-red-600'
                                                }`}>
                                                    {call.direction === 'inbound' ? (
                                                        call.duration_seconds > 0 ? <PhoneIncoming className="h-3.5 w-3.5" /> : <PhoneMissed className="h-3.5 w-3.5" />
                                                    ) : (
                                                        <PhoneCall className="h-3.5 w-3.5" />
                                                    )}
                                                </div>
                                                <div>
                                                    <span className="font-semibold font-mono text-sm">{call.phone_number}</span>
                                                    <div className="text-[11px] text-muted-foreground">
                                                        {call.duration_seconds > 0 ? formatDuration(call.duration_seconds) : t('calls.missed', 'Javobsiz')}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        {isAllTenants && (
                                            <td className="py-3.5 px-4 text-xs">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                                                    {call.tenant?.name || "-"}
                                                </span>
                                            </td>
                                        )}
                                        <td className="py-3.5 px-4 text-xs">
                                            <div className="flex flex-col gap-0.5">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <span className="font-medium text-foreground">{call.device?.name || t('calls.device', 'Telefon')}</span>
                                                    {call.sim_slot && (
                                                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                                                            call.sim_slot === 1 
                                                                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' 
                                                                : 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                                                        }`}>
                                                            SIM {call.sim_slot}
                                                        </span>
                                                    )}
                                                </div>
                                                {(call.sim_phone_number || call.sim_operator_name) ? (
                                                    <div className="text-[11px] font-mono text-muted-foreground flex items-center gap-1">
                                                        {call.sim_operator_name && (
                                                            <span className="font-sans font-medium text-foreground/80">{call.sim_operator_name}:</span>
                                                        )}
                                                        {call.sim_phone_number && (
                                                            <span>{call.sim_phone_number}</span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <a
                                                        href="/devices"
                                                        className="text-[10px] text-amber-500 hover:text-amber-600 hover:underline inline-flex items-center gap-0.5"
                                                        title="Telefonlar sahifasida ushbu qurilmaga SIM raqam kiritishingiz mumkin"
                                                    >
                                                        <span>Raqam kiritilmagan</span>
                                                    </a>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4 text-xs text-muted-foreground font-mono">
                                            {formatDateTime(call.call_timestamp)}
                                        </td>
                                        <td className="py-3.5 px-4">
                                            {call.duration_seconds > 0 && call.recording_status === 'uploaded' ? (
                                                <WaveformPlayer
                                                    callId={call.id}
                                                    durationSeconds={call.duration_seconds}
                                                    phoneNumber={call.phone_number}
                                                />
                                            ) : (
                                                <span className="text-xs text-muted-foreground italic">
                                                    {call.duration_seconds === 0 ? t("calls.noRecording", "Yozuv yo'q (0s)") : t("calls.audioPending", "Audio kutilmoqda")}
                                                </span>
                                            )}
                                        </td>
                                        {canDownload && (
                                            <td className="py-3.5 px-4 text-right">
                                                {call.duration_seconds > 0 && call.recording_status === 'uploaded' && (
                                                    <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                                        <a href={`/calls/${call.id}/download`} title={t("calls.download", "Yuklab olish")}>
                                                            <Download className="h-4 w-4" />
                                                        </a>
                                                    </Button>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <PaginationNav
                    links={calls.links}
                    current_page={calls.current_page}
                    last_page={calls.last_page}
                    from={calls.from}
                    to={calls.to}
                    total={calls.total}
                    per_page={calls.per_page}
                />
            </div>
        </div>
    );
}
