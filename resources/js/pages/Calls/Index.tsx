import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Head, router, usePage } from '@inertiajs/react';
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
        per_page?: number;
        from?: number | null;
        to?: number | null;
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
    devices: {
        id: number;
        name: string;
        tenant?: { id: number; name: string };
    }[];
    tenants?: { id: number; name: string }[];
    canDownload: boolean;
}

export default function CallsIndex({
    calls,
    filters,
    devices,
    tenants = [],
    canDownload,
}: CallsProps) {
    const { auth, superadmin } = usePage<any>().props;
    const isSuperAdmin = auth?.user?.role === 'superadmin';
    const isAllTenants = isSuperAdmin && !superadmin?.selected_tenant;
    const { t } = useTranslation();
    const [search, setSearch] = useState(filters.search || '');
    const [direction, setDirection] = useState(filters.direction || '');
    const [status, setStatus] = useState(filters.status || '');
    const [deviceId, setDeviceId] = useState(filters.device_id || '');
    const [tenantId, setTenantId] = useState(filters.tenant_id || '');
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');

    const applyFilters = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        router.get(
            '/calls',
            {
                search: search || undefined,
                direction: direction || undefined,
                status: status || undefined,
                device_id: deviceId || undefined,
                start_date: startDate || undefined,
                end_date: endDate || undefined,
                tenant_id: tenantId || undefined,
            },
            { preserveState: true },
        );
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
        <div className="mx-auto max-w-7xl space-y-6 p-6">
            <Head title={t('calls.title', "Qo'ng'iroqlar jurnali")} />

            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">
                        {t('calls.title', "Qo'ng'iroqlar jurnali")}
                    </h2>
                    <p className="text-muted-foreground text-sm">
                        {t(
                            'calls.totalCalls',
                            "Jami qayd etilgan: {{count}} ta qo'ng'iroq",
                            { count: calls.total },
                        )}
                    </p>
                </div>
            </div>

            {/* Filters Bar */}
            <form
                onSubmit={applyFilters}
                className={`bg-card border-border grid grid-cols-1 rounded-xl border p-4 md:grid-cols-4 ${tenants && tenants.length > 0 ? 'lg:grid-cols-8' : 'lg:grid-cols-7'} gap-3 shadow-xs`}
            >
                {tenants && tenants.length > 0 && (
                    <div>
                        <select
                            value={tenantId}
                            onChange={(e) => setTenantId(e.target.value)}
                            className="border-input focus-visible:ring-ring h-9 w-full rounded-md border bg-transparent px-3 py-1 text-xs shadow-xs focus-visible:ring-1 focus-visible:outline-none"
                        >
                            <option value="">
                                {t('calls.allTenants', 'Barcha kompaniyalar')}
                            </option>
                            {tenants.map((ten) => (
                                <option key={ten.id} value={ten.id}>
                                    {ten.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
                <div className="relative lg:col-span-2">
                    <Search className="text-muted-foreground absolute top-2.5 left-3 h-4 w-4" />
                    <Input
                        placeholder={t(
                            'calls.searchPlaceholder',
                            'Telefon raqam...',
                        )}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="h-9 pl-9 text-xs"
                    />
                </div>

                <div>
                    <select
                        value={direction}
                        onChange={(e) => setDirection(e.target.value)}
                        className="border-input focus-visible:ring-ring h-9 w-full rounded-md border bg-transparent px-3 py-1 text-xs shadow-xs focus-visible:ring-1 focus-visible:outline-none"
                    >
                        <option value="">
                            {t('calls.allDirections', "Barcha yo'nalishlar")}
                        </option>
                        <option value="inbound">
                            {t('calls.inbound', 'Kiruvchi')}
                        </option>
                        <option value="outbound">
                            {t('calls.outbound', 'Chiquvchi')}
                        </option>
                    </select>
                </div>

                <div>
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="border-input focus-visible:ring-ring h-9 w-full rounded-md border bg-transparent px-3 py-1 text-xs shadow-xs focus-visible:ring-1 focus-visible:outline-none"
                    >
                        <option value="">
                            {t('calls.allStatuses', 'Barcha holatlar')}
                        </option>
                        <option value="answered">
                            {t('calls.answered', 'Suhbat qurildi')}
                        </option>
                        <option value="missed">
                            {t('calls.missed', 'Javobsiz')}
                        </option>
                    </select>
                </div>

                <div>
                    <select
                        value={deviceId}
                        onChange={(e) => setDeviceId(e.target.value)}
                        className="border-input focus-visible:ring-ring h-9 w-full rounded-md border bg-transparent px-3 py-1 text-xs shadow-xs focus-visible:ring-1 focus-visible:outline-none"
                    >
                        <option value="">
                            {t('calls.allDevices', 'Barcha telefonlar')}
                        </option>
                        {devices.map((d) => (
                            <option key={d.id} value={d.id}>
                                {d.name}
                                {isAllTenants && d.tenant?.name
                                    ? ` (${d.tenant.name})`
                                    : ''}
                            </option>
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
                    <Button
                        type="submit"
                        size="sm"
                        className="h-9 flex-1 text-xs"
                    >
                        <Filter className="mr-1 h-3.5 w-3.5" />{' '}
                        {t('calls.search', 'Izlash')}
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={resetFilters}
                        className="h-9 text-xs"
                    >
                        {t('calls.reset', 'Tozalash')}
                    </Button>
                </div>
            </form>

            {/* Calls Table */}
            <div className="bg-card border-border overflow-hidden rounded-xl border shadow-xs">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-muted/50 border-border text-muted-foreground border-b text-xs font-medium uppercase">
                            <tr>
                                <th className="w-12 px-4 py-3 text-center">
                                    №
                                </th>
                                <th className="px-4 py-3">
                                    {t(
                                        'calls.directionNumber',
                                        "Yo'nalish / Raqam",
                                    )}
                                </th>
                                {isAllTenants && (
                                    <th className="px-4 py-3">
                                        {t('calls.company', 'Kompaniya')}
                                    </th>
                                )}
                                <th className="px-4 py-3">
                                    {t('calls.deviceSim', 'Qurilma / SIM')}
                                </th>
                                <th className="px-4 py-3">
                                    {t('calls.time', 'Vaqti')}
                                </th>
                                <th className="px-4 py-3">
                                    {t('calls.audioRecording', 'Audio yozuv')}
                                </th>
                                {canDownload && (
                                    <th className="px-4 py-3 text-right">
                                        {t('calls.download', 'Yuklab olish')}
                                    </th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-border divide-y">
                            {calls.data.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={
                                            canDownload
                                                ? isAllTenants
                                                    ? 7
                                                    : 6
                                                : isAllTenants
                                                  ? 6
                                                  : 5
                                        }
                                        className="text-muted-foreground py-8 text-center text-sm"
                                    >
                                        {t(
                                            'calls.noCallsFound',
                                            "Ko'rsatilgan filtrlar bo'yicha hech qanday qo'ng'iroq topilmadi.",
                                        )}
                                    </td>
                                </tr>
                            ) : (
                                calls.data.map((call, idx) => (
                                    <tr
                                        key={call.id}
                                        className="hover:bg-muted/30 transition-colors"
                                    >
                                        <td className="text-muted-foreground px-4 py-3.5 text-center font-mono text-xs">
                                            {(calls.current_page - 1) *
                                                (calls.per_page || 10) +
                                                idx +
                                                1}
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <div className="flex items-center gap-2.5">
                                                <div
                                                    className={`rounded-md p-1.5 ${
                                                        call.duration_seconds >
                                                        0
                                                            ? 'bg-emerald-500/10 text-emerald-600'
                                                            : 'bg-red-500/10 text-red-600'
                                                    }`}
                                                >
                                                    {call.direction ===
                                                    'inbound' ? (
                                                        call.duration_seconds >
                                                        0 ? (
                                                            <PhoneIncoming className="h-3.5 w-3.5" />
                                                        ) : (
                                                            <PhoneMissed className="h-3.5 w-3.5" />
                                                        )
                                                    ) : (
                                                        <PhoneCall className="h-3.5 w-3.5" />
                                                    )}
                                                </div>
                                                <div>
                                                    <span className="font-mono text-sm font-semibold">
                                                        {call.phone_number}
                                                    </span>
                                                    <div className="text-muted-foreground text-[11px]">
                                                        {call.duration_seconds >
                                                        0
                                                            ? formatDuration(
                                                                  call.duration_seconds,
                                                              )
                                                            : t(
                                                                  'calls.missed',
                                                                  'Javobsiz',
                                                              )}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        {isAllTenants && (
                                            <td className="px-4 py-3.5 text-xs">
                                                <span className="bg-primary/10 text-primary border-primary/20 inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium">
                                                    {call.tenant?.name || '-'}
                                                </span>
                                            </td>
                                        )}
                                        <td className="px-4 py-3.5 text-xs">
                                            <div className="flex flex-col gap-0.5">
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    <span className="text-foreground font-medium">
                                                        {call.device?.name ||
                                                            t(
                                                                'calls.device',
                                                                'Telefon',
                                                            )}
                                                    </span>
                                                    {call.sim_slot && (
                                                        <span
                                                            className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                                                                call.sim_slot ===
                                                                1
                                                                    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                                                    : 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                                                            }`}
                                                        >
                                                            SIM {call.sim_slot}
                                                        </span>
                                                    )}
                                                </div>
                                                {call.sim_phone_number ||
                                                call.sim_operator_name ? (
                                                    <div className="text-muted-foreground flex items-center gap-1 font-mono text-[11px]">
                                                        {call.sim_operator_name && (
                                                            <span className="text-foreground/80 font-sans font-medium">
                                                                {
                                                                    call.sim_operator_name
                                                                }
                                                                :
                                                            </span>
                                                        )}
                                                        {call.sim_phone_number && (
                                                            <span>
                                                                {
                                                                    call.sim_phone_number
                                                                }
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <a
                                                        href="/devices"
                                                        className="inline-flex items-center gap-0.5 text-[10px] text-amber-500 hover:text-amber-600 hover:underline"
                                                        title="Telefonlar sahifasida ushbu qurilmaga SIM raqam kiritishingiz mumkin"
                                                    >
                                                        <span>
                                                            Raqam kiritilmagan
                                                        </span>
                                                    </a>
                                                )}
                                            </div>
                                        </td>
                                        <td className="text-muted-foreground px-4 py-3.5 font-mono text-xs">
                                            {formatDateTime(
                                                call.call_timestamp,
                                            )}
                                        </td>
                                        <td className="px-4 py-3.5">
                                            {call.duration_seconds > 0 &&
                                            call.recording_status ===
                                                'uploaded' ? (
                                                <WaveformPlayer
                                                    callId={call.id}
                                                    durationSeconds={
                                                        call.duration_seconds
                                                    }
                                                    phoneNumber={
                                                        call.phone_number
                                                    }
                                                />
                                            ) : (
                                                <span className="text-muted-foreground text-xs italic">
                                                    {call.duration_seconds === 0
                                                        ? t(
                                                              'calls.noRecording',
                                                              "Yozuv yo'q (0s)",
                                                          )
                                                        : t(
                                                              'calls.audioPending',
                                                              'Audio kutilmoqda',
                                                          )}
                                                </span>
                                            )}
                                        </td>
                                        {canDownload && (
                                            <td className="px-4 py-3.5 text-right">
                                                {call.duration_seconds > 0 &&
                                                    call.recording_status ===
                                                        'uploaded' && (
                                                        <Button
                                                            asChild
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-muted-foreground hover:text-foreground h-8 w-8"
                                                        >
                                                            <a
                                                                href={`/calls/${call.id}/download`}
                                                                title={t(
                                                                    'calls.download',
                                                                    'Yuklab olish',
                                                                )}
                                                            >
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
