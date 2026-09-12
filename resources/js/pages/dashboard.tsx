import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    PhoneCall,
    PhoneIncoming,
    PhoneMissed,
    Clock,
    Smartphone,
    AlertTriangle,
    CheckCircle2,
    Activity,
    BellRing,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WaveformPlayer } from '@/components/waveform-player';
import { getEcho } from '@/lib/echo';
import { formatDate, formatTime } from '@/lib/datetime';

interface CallItem {
    id: number;
    phone_number: string;
    direction: 'inbound' | 'outbound';
    duration_seconds: number;
    call_timestamp: string;
    recording_status: string;
    recording_path?: string;
    device?: { id: number; name: string; model?: string };
    tenant?: { id: number; name: string };
}

interface DashboardProps {
    tenant?: {
        name: string;
        is_trial: boolean;
        is_grace_period: boolean;
        subscription_expires_at?: string;
        trial_ends_at?: string;
        allowed_devices_count: number;
        paired_devices_count: number;
    };
    stats: {
        today_calls: number;
        answered_calls: number;
        missed_calls: number;
        total_duration_minutes: number;
        device_usage_percent: number;
    };
    recent_calls: CallItem[];
}

export default function Dashboard({
    tenant,
    stats,
    recent_calls,
}: DashboardProps) {
    const { auth } = usePage<any>().props;
    const tenantId = auth?.user?.tenant_id;
    const { t } = useTranslation();
    const [liveRinging, setLiveRinging] = useState<any | null>(null);
    const [callsList, setCallsList] = useState<CallItem[]>(recent_calls || []);

    useEffect(() => {
        const echo = getEcho();
        if (!echo || !tenantId) return;

        // Listen for ringing and call logged events
        const channel = echo.private(`tenant.${tenantId}`);

        channel.listen('.call.ringing', (e: any) => {
            setLiveRinging(e.callData);
            setTimeout(() => setLiveRinging(null), 15000); // clear after 15s
        });

        channel.listen('.call.logged', (e: any) => {
            setLiveRinging(null);
            if (e.call) {
                setCallsList((prev) => [e.call, ...prev.slice(0, 9)]);
            }
        });

        return () => {
            channel.stopListening('.call.ringing');
            channel.stopListening('.call.logged');
        };
    }, [tenantId]);

    const formatDuration = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}m ${s}s`;
    };

    return (
        <div className="mx-auto max-w-7xl space-y-6 p-6">
            <Head
                title={t('dashboard.title', 'Bosh sahifa - Jonli Monitoring')}
            />

            {/* Trial & Grace Period Alert Banner */}
            {tenant?.is_trial && (
                <div className="flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
                        <div>
                            <span className="font-semibold text-amber-900 dark:text-amber-200">
                                {t(
                                    'dashboard.trialActive',
                                    '14 kunlik Bepul Sinov Davri faol.',
                                )}
                            </span>
                            <p className="text-xs text-amber-700 dark:text-amber-300">
                                {t(
                                    'dashboard.trialEndsOn',
                                    "Sinov muddati tugash sanasi: {{date}}. Barcha imkoniyatlar to'liq ochiq.",
                                    { date: formatDate(tenant.trial_ends_at) },
                                )}
                            </p>
                        </div>
                    </div>
                    <Button
                        asChild
                        size="sm"
                        variant="default"
                        className="bg-amber-600 text-white hover:bg-amber-700"
                    >
                        <Link href="/billing">
                            {t('dashboard.selectTariff', 'Tarif tanlash')}
                        </Link>
                    </Button>
                </div>
            )}

            {tenant?.is_grace_period && (
                <div className="flex items-center justify-between rounded-xl border border-red-500/40 bg-red-500/15 p-4">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 shrink-0 text-red-500" />
                        <div>
                            <span className="font-semibold text-red-900 dark:text-red-200">
                                {t(
                                    'dashboard.gracePeriodActive',
                                    'Imtiyozli davr (3 kunlik Grace Period)!',
                                )}
                            </span>
                            <p className="text-xs text-red-700 dark:text-red-300">
                                {t(
                                    'dashboard.gracePeriodDesc',
                                    "Obuna muddati tugadi. Xizmat to'xtatilmasligi uchun obunani yangilang.",
                                )}
                            </p>
                        </div>
                    </div>
                    <Button asChild size="sm" variant="destructive">
                        <Link href="/billing">
                            {t('dashboard.makePayment', "To'lov qilish")}
                        </Link>
                    </Button>
                </div>
            )}

            {/* Live Call Ringing Floating Banner */}
            {liveRinging && (
                <div className="bg-primary text-primary-foreground border-primary/20 flex animate-pulse items-center justify-between rounded-xl border p-4 shadow-lg">
                    <div className="flex items-center gap-3">
                        <BellRing className="h-6 w-6 animate-bounce" />
                        <div>
                            <span className="text-sm font-bold">
                                {t(
                                    'dashboard.liveCallRinging',
                                    "Jonli qo'ng'iroq kelmoqda!",
                                )}
                            </span>
                            <p className="text-xs opacity-90">
                                {t(
                                    'dashboard.liveCallDetails',
                                    'Raqam: {{number}} | Qurilma: {{device}}',
                                    {
                                        number: liveRinging.phone_number,
                                        device: liveRinging.device_name,
                                    },
                                )}
                            </p>
                        </div>
                    </div>
                    <span className="bg-primary-foreground/20 rounded-full px-2.5 py-1 font-mono text-xs">
                        {liveRinging.direction === 'inbound'
                            ? t('calls.inbound', 'Kiruvchi')
                            : t('calls.outbound', 'Chiquvchi')}
                    </span>
                </div>
            )}

            {/* KPI Metric Cards */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="bg-card border-border flex items-center justify-between rounded-xl border p-5 shadow-xs">
                    <div>
                        <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                            {t('dashboard.todayCalls', "Bugungi qo'ng'iroqlar")}
                        </p>
                        <h3 className="mt-1 text-2xl font-bold">
                            {stats.today_calls}
                        </h3>
                    </div>
                    <div className="bg-primary/10 text-primary rounded-xl p-3">
                        <PhoneCall className="h-5 w-5" />
                    </div>
                </div>

                <div className="bg-card border-border flex items-center justify-between rounded-xl border p-5 shadow-xs">
                    <div>
                        <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                            {t('dashboard.answeredCalls', 'Suhbat qurildi')}
                        </p>
                        <h3 className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                            {stats.answered_calls}
                        </h3>
                    </div>
                    <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-600">
                        <PhoneIncoming className="h-5 w-5" />
                    </div>
                </div>

                <div className="bg-card border-border flex items-center justify-between rounded-xl border p-5 shadow-xs">
                    <div>
                        <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                            {t('dashboard.missedCalls', 'Javobsiz qolgan')}
                        </p>
                        <h3 className="mt-1 text-2xl font-bold text-red-600 dark:text-red-400">
                            {stats.missed_calls}
                        </h3>
                    </div>
                    <div className="rounded-xl bg-red-500/10 p-3 text-red-600">
                        <PhoneMissed className="h-5 w-5" />
                    </div>
                </div>

                <div className="bg-card border-border flex items-center justify-between rounded-xl border p-5 shadow-xs">
                    <div>
                        <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                            {t('dashboard.talkTime', 'Suhbat vaqti')}
                        </p>
                        <h3 className="mt-1 text-2xl font-bold">
                            {stats.total_duration_minutes}{' '}
                            {t('dashboard.minutes', 'daq')}
                        </h3>
                    </div>
                    <div className="rounded-xl bg-blue-500/10 p-3 text-blue-600">
                        <Clock className="h-5 w-5" />
                    </div>
                </div>
            </div>

            {/* Device Quota Usage Card */}
            {tenant && (
                <div className="bg-card border-border flex flex-col justify-between gap-4 rounded-xl border p-5 md:flex-row md:items-center">
                    <div className="flex items-center gap-3">
                        <Smartphone className="text-muted-foreground h-6 w-6" />
                        <div>
                            <h4 className="text-sm font-semibold">
                                {t(
                                    'dashboard.connectedDevices',
                                    'Ulangan telefonlar: {{paired}} / {{allowed}} ta',
                                    {
                                        paired: tenant.paired_devices_count,
                                        allowed: tenant.allowed_devices_count,
                                    },
                                )}
                            </h4>
                            <p className="text-muted-foreground text-xs">
                                {t(
                                    'dashboard.devicesQuotaDesc',
                                    "Qurilmalar tarif bo'yicha ruxsat etilgan limit doirasida",
                                )}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="bg-secondary h-2.5 w-48 overflow-hidden rounded-full">
                            <div
                                className="bg-primary h-full rounded-full transition-all duration-500"
                                style={{
                                    width: `${Math.min(100, stats.device_usage_percent)}%`,
                                }}
                            />
                        </div>
                        <Button asChild variant="outline" size="sm">
                            <Link href="/devices">
                                {t(
                                    'dashboard.devicesList',
                                    "Qurilmalar ro'yxati",
                                )}
                            </Link>
                        </Button>
                    </div>
                </div>
            )}

            {/* Recent Calls Feed */}
            <div className="bg-card border-border overflow-hidden rounded-xl border shadow-xs">
                <div className="border-border flex items-center justify-between border-b p-5">
                    <div className="flex items-center gap-2">
                        <Activity className="text-primary h-4 w-4" />
                        <h3 className="text-base font-semibold">
                            {t(
                                'dashboard.recentCalls',
                                "So'nggi qo'ng'iroqlar oqimi",
                            )}
                        </h3>
                    </div>
                    <Button asChild variant="ghost" size="sm">
                        <Link href="/calls">
                            {t('dashboard.viewAllCalls', "Barchasini ko'rish")}{' '}
                            →
                        </Link>
                    </Button>
                </div>

                <div className="divide-border divide-y">
                    {callsList.length === 0 ? (
                        <div className="text-muted-foreground p-8 text-center text-sm">
                            {t(
                                'dashboard.noCallsToday',
                                "Hozircha hech qanday qo'ng'iroq qayd etilmadi.",
                            )}
                        </div>
                    ) : (
                        callsList.map((call) => (
                            <div
                                key={call.id}
                                className="hover:bg-muted/40 flex flex-col justify-between gap-3 p-4 transition-colors md:flex-row md:items-center"
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`rounded-lg p-2 ${
                                            call.duration_seconds > 0
                                                ? 'bg-emerald-500/10 text-emerald-600'
                                                : 'bg-red-500/10 text-red-600'
                                        }`}
                                    >
                                        {call.direction === 'inbound' ? (
                                            call.duration_seconds > 0 ? (
                                                <PhoneIncoming className="h-4 w-4" />
                                            ) : (
                                                <PhoneMissed className="h-4 w-4" />
                                            )
                                        ) : (
                                            <PhoneCall className="h-4 w-4" />
                                        )}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-sm font-semibold">
                                                {call.phone_number}
                                            </span>
                                            <span
                                                className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                                                    call.duration_seconds > 0
                                                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                                        : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'
                                                }`}
                                            >
                                                {call.duration_seconds > 0
                                                    ? formatDuration(
                                                          call.duration_seconds,
                                                      )
                                                    : t(
                                                          'calls.missed',
                                                          'Javobsiz',
                                                      )}
                                            </span>
                                        </div>
                                        <div className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-2 text-xs">
                                            {call.tenant?.name && (
                                                <span className="bg-primary/10 text-primary border-primary/20 inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-medium">
                                                    {call.tenant.name}
                                                </span>
                                            )}
                                            <span>
                                                {call.device?.name ||
                                                    t(
                                                        'calls.device',
                                                        'Telefon',
                                                    )}
                                            </span>
                                            <span>
                                                •{' '}
                                                {formatTime(
                                                    call.call_timestamp,
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {call.duration_seconds > 0 &&
                                    call.recording_status === 'uploaded' && (
                                        <WaveformPlayer
                                            callId={call.id}
                                            durationSeconds={
                                                call.duration_seconds
                                            }
                                            phoneNumber={call.phone_number}
                                        />
                                    )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
