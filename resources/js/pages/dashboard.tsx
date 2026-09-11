import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Head, Link } from '@inertiajs/react';
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

interface CallItem {
    id: number;
    phone_number: string;
    direction: 'inbound' | 'outbound';
    duration_seconds: number;
    call_timestamp: string;
    recording_status: string;
    recording_path?: string;
    device?: { id: number; name: string; model?: string };
    user?: { id: number; name: string };
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

export default function Dashboard({ tenant, stats, recent_calls }: DashboardProps) {
    const { t } = useTranslation();
    const [liveRinging, setLiveRinging] = useState<any | null>(null);
    const [callsList, setCallsList] = useState<CallItem[]>(recent_calls || []);

    useEffect(() => {
        const echo = getEcho();
        if (!echo) return;

        // Listen for ringing and call logged events
        const channel = echo.private('tenant.1'); // replaced dynamically or listening
        
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
    }, []);

    const formatDuration = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}m ${s}s`;
    };

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            <Head title={t('dashboard.title', 'Bosh sahifa - Jonli Monitoring')} />

            {/* Trial & Grace Period Alert Banner */}
            {tenant?.is_trial && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                        <div>
                            <span className="font-semibold text-amber-900 dark:text-amber-200">{t('dashboard.trialActive', '14 kunlik Bepul Sinov Davri faol.')}</span>
                            <p className="text-xs text-amber-700 dark:text-amber-300">
                                {t('dashboard.trialEndsOn', 'Sinov muddati tugash sanasi: {{date}}. Barcha imkoniyatlar to\'liq ochiq.', { date: new Date(tenant.trial_ends_at || '').toLocaleDateString('uz-UZ') })}
                            </p>
                        </div>
                    </div>
                    <Button asChild size="sm" variant="default" className="bg-amber-600 hover:bg-amber-700 text-white">
                        <Link href="/billing">{t('dashboard.selectTariff', 'Tarif tanlash')}</Link>
                    </Button>
                </div>
            )}

            {tenant?.is_grace_period && (
                <div className="bg-red-500/15 border border-red-500/40 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
                        <div>
                            <span className="font-semibold text-red-900 dark:text-red-200">{t('dashboard.gracePeriodActive', 'Imtiyozli davr (3 kunlik Grace Period)!')}</span>
                            <p className="text-xs text-red-700 dark:text-red-300">
                                {t('dashboard.gracePeriodDesc', 'Obuna muddati tugadi. Xizmat to\'xtatilmasligi uchun obunani yangilang.')}
                            </p>
                        </div>
                    </div>
                    <Button asChild size="sm" variant="destructive">
                        <Link href="/billing">{t('dashboard.makePayment', 'To\'lov qilish')}</Link>
                    </Button>
                </div>
            )}

            {/* Live Call Ringing Floating Banner */}
            {liveRinging && (
                <div className="bg-primary text-primary-foreground p-4 rounded-xl shadow-lg border border-primary/20 flex items-center justify-between animate-pulse">
                    <div className="flex items-center gap-3">
                        <BellRing className="h-6 w-6 animate-bounce" />
                        <div>
                            <span className="font-bold text-sm">{t('dashboard.liveCallRinging', "Jonli qo'ng'iroq kelmoqda!")}</span>
                            <p className="text-xs opacity-90">
                                {t('dashboard.liveCallDetails', 'Raqam: {{number}} | Qurilma: {{device}}', { number: liveRinging.phone_number, device: liveRinging.device_name })}
                            </p>
                        </div>
                    </div>
                    <span className="text-xs font-mono bg-primary-foreground/20 px-2.5 py-1 rounded-full">
                        {liveRinging.direction === 'inbound' ? t('calls.inbound', 'Kiruvchi') : t('calls.outbound', 'Chiquvchi')}
                    </span>
                </div>
            )}

            {/* KPI Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-card p-5 rounded-xl border border-border shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('dashboard.todayCalls', "Bugungi qo'ng'iroqlar")}</p>
                        <h3 className="text-2xl font-bold mt-1">{stats.today_calls}</h3>
                    </div>
                    <div className="p-3 bg-primary/10 text-primary rounded-xl">
                        <PhoneCall className="h-5 w-5" />
                    </div>
                </div>

                <div className="bg-card p-5 rounded-xl border border-border shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('dashboard.answeredCalls', 'Suhbat qurildi')}</p>
                        <h3 className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">{stats.answered_calls}</h3>
                    </div>
                    <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl">
                        <PhoneIncoming className="h-5 w-5" />
                    </div>
                </div>

                <div className="bg-card p-5 rounded-xl border border-border shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('dashboard.missedCalls', 'Javobsiz qolgan')}</p>
                        <h3 className="text-2xl font-bold mt-1 text-red-600 dark:text-red-400">{stats.missed_calls}</h3>
                    </div>
                    <div className="p-3 bg-red-500/10 text-red-600 rounded-xl">
                        <PhoneMissed className="h-5 w-5" />
                    </div>
                </div>

                <div className="bg-card p-5 rounded-xl border border-border shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('dashboard.talkTime', 'Suhbat vaqti')}</p>
                        <h3 className="text-2xl font-bold mt-1">{stats.total_duration_minutes} {t('dashboard.minutes', 'daq')}</h3>
                    </div>
                    <div className="p-3 bg-blue-500/10 text-blue-600 rounded-xl">
                        <Clock className="h-5 w-5" />
                    </div>
                </div>
            </div>

            {/* Device Quota Usage Card */}
            {tenant && (
                <div className="bg-card p-5 rounded-xl border border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Smartphone className="h-6 w-6 text-muted-foreground" />
                        <div>
                            <h4 className="font-semibold text-sm">{t('dashboard.connectedDevices', 'Ulangan telefonlar: {{paired}} / {{allowed}} ta', { paired: tenant.paired_devices_count, allowed: tenant.allowed_devices_count })}</h4>
                            <p className="text-xs text-muted-foreground">{t('dashboard.devicesQuotaDesc', "Qurilmalar tarif bo'yicha ruxsat etilgan limit doirasida")}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="w-48 bg-secondary h-2.5 rounded-full overflow-hidden">
                            <div
                                className="bg-primary h-full rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(100, stats.device_usage_percent)}%` }}
                            />
                        </div>
                        <Button asChild variant="outline" size="sm">
                            <Link href="/devices">{t('dashboard.devicesList', "Qurilmalar ro'yxati")}</Link>
                        </Button>
                    </div>
                </div>
            )}

            {/* Recent Calls Feed */}
            <div className="bg-card rounded-xl border border-border shadow-xs overflow-hidden">
                <div className="p-5 border-b border-border flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-primary" />
                        <h3 className="font-semibold text-base">{t('dashboard.recentCalls', "So'nggi qo'ng'iroqlar oqimi")}</h3>
                    </div>
                    <Button asChild variant="ghost" size="sm">
                        <Link href="/calls">{t('dashboard.viewAllCalls', "Barchasini ko'rish")} →</Link>
                    </Button>
                </div>

                <div className="divide-y divide-border">
                    {callsList.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground text-sm">
                            {t('dashboard.noCallsToday', 'Hozircha hech qanday qo\'ng\'iroq qayd etilmadi.')}
                        </div>
                    ) : (
                        callsList.map((call) => (
                            <div key={call.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-muted/40 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${
                                        call.duration_seconds > 0
                                            ? 'bg-emerald-500/10 text-emerald-600'
                                            : 'bg-red-500/10 text-red-600'
                                    }`}>
                                        {call.direction === 'inbound' ? (
                                            call.duration_seconds > 0 ? <PhoneIncoming className="h-4 w-4" /> : <PhoneMissed className="h-4 w-4" />
                                        ) : (
                                            <PhoneCall className="h-4 w-4" />
                                        )}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-sm font-mono">{call.phone_number}</span>
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                                call.duration_seconds > 0
                                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                                    : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'
                                            }`}>
                                                {call.duration_seconds > 0 ? formatDuration(call.duration_seconds) : t('calls.missed', 'Javobsiz')}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                            <span>{call.device?.name || t("calls.device", "Telefon")}</span>
                                            {call.user && <span>• {t("calls.operator", "Operator")}: {call.user.name}</span>}
                                            <span>• {new Date(call.call_timestamp).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </div>
                                </div>

                                {call.duration_seconds > 0 && call.recording_status === 'uploaded' && (
                                    <WaveformPlayer
                                        callId={call.id}
                                        durationSeconds={call.duration_seconds}
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
