import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import {
    Share2,
    CheckCircle2,
    XCircle,
    Activity,
    ExternalLink,
    RefreshCw,
    UserCheck,
    Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AmoCrmLogo, MoySkladLogo } from '@/components/brand-logos';

interface IntegrationsProps {
    amoCrm?: {
        is_active: boolean;
        subdomain: string;
        settings?: any;
    };
    moySklad?: {
        is_active: boolean;
        login: string;
        settings?: any;
    };
    operators: { id: number; name: string; phone_number?: string }[];
    mappings: { id: number; tenant_integration_id: number; user_id: number; external_user_id: string; external_user_name?: string; user?: { name: string } }[];
    recentLogs: { id: number; crm_type: string; call_id?: number; status: string; error_message?: string; created_at: string }[];
    widgetDownloadUrl?: string;
    moySkladDescriptorUrl?: string;
}

export default function IntegrationsIndex({
    amoCrm,
    moySklad,
    operators,
    mappings,
    recentLogs,
    widgetDownloadUrl = '/downloads/amocrm-widget.zip',
    moySkladDescriptorUrl = '/downloads/moysklad-app.xml',
}: IntegrationsProps) {
    // amoCRM Form
    const amoForm = useForm({
        subdomain: amoCrm?.subdomain || '',
        client_id: '',
        client_secret: '',
        create_task_on_missed: amoCrm?.settings?.create_task_on_missed ?? true,
    });

    // MoySklad Form
    const moyForm = useForm({
        login: moySklad?.login || '',
        password: '',
        token: '',
    });

    const submitAmo = (e: React.FormEvent) => {
        e.preventDefault();
        amoForm.post('/integrations/amocrm');
    };

    const submitMoy = (e: React.FormEvent) => {
        e.preventDefault();
        moyForm.post('/integrations/moysklad');
    };

    return (
        <div className="p-6 space-y-8 max-w-6xl mx-auto">
            <Head title="CRM Integratsiyalari (amoCRM & MoySklad)" />

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">CRM & ERP Integratsiyalari</h2>
                    <p className="text-sm text-muted-foreground">
                        Telefoniya qo'ng'iroqlari va audio yozuvlarini amoCRM va MoySklad tizimlari bilan avtomatik sinxronlash
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* amoCRM Integration Card */}
                <div className="bg-card p-6 rounded-2xl border border-border shadow-xs space-y-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/10 rounded-xl">
                                <AmoCrmLogo className="h-7" />
                            </div>
                        </div>

                        {amoCrm?.is_active ? (
                            <span className="flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 px-2.5 py-1 rounded-full font-semibold">
                                <CheckCircle2 className="h-3.5 w-3.5" /> Ulangan
                            </span>
                        ) : (
                            <span className="flex items-center gap-1 text-xs bg-secondary text-muted-foreground px-2.5 py-1 rounded-full font-medium">
                                <XCircle className="h-3.5 w-3.5" /> Ulanmagan
                            </span>
                        )}
                    </div>

                    <p className="text-xs text-muted-foreground">
                        Leadlar, kontaktlar, qo‘ng‘iroq kartochkalari va MP3/AAC audio yozuvlarini amoCRM bilan to‘liq sinxronlashtirish.
                    </p>

                    <form onSubmit={submitAmo} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold">Subdomain (masalan: kompaniya):</label>
                            <Input
                                placeholder="mycompany"
                                value={amoForm.data.subdomain}
                                onChange={(e) => amoForm.setData('subdomain', e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold">Integratsiya ID (Client ID):</label>
                            <Input
                                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                                value={amoForm.data.client_id}
                                onChange={(e) => amoForm.setData('client_id', e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold">Maxfiy kalit (Client Secret):</label>
                            <Input
                                type="password"
                                placeholder="••••••••••••••••"
                                value={amoForm.data.client_secret}
                                onChange={(e) => amoForm.setData('client_secret', e.target.value)}
                                required
                            />
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                            <input
                                type="checkbox"
                                id="taskOnMissed"
                                checked={amoForm.data.create_task_on_missed}
                                onChange={(e) => amoForm.setData('create_task_on_missed', e.target.checked)}
                                className="rounded text-primary focus:ring-primary h-4 w-4"
                            />
                            <label htmlFor="taskOnMissed" className="text-xs">
                                Javobsiz qo'ng'iroqlarda avtomatik vazifa (Task) yaratish
                            </label>
                        </div>

                        <Button type="submit" className="w-full" disabled={amoForm.processing}>
                            {amoForm.processing ? 'Ulanmoqda...' : 'amoCRM bilan ulash (OAuth2)'}
                        </Button>
                    </form>

                    <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">amoCRM vidjet moduli:</span>
                        <a
                            href={widgetDownloadUrl}
                            download
                            className="inline-flex items-center gap-1.5 text-primary hover:underline font-medium"
                        >
                            <Download className="h-3.5 w-3.5" /> Vidjetni yuklab olish (.zip)
                        </a>
                    </div>
                </div>

                {/* MoySklad Integration Card */}
                <div className="bg-card p-6 rounded-2xl border border-border shadow-xs space-y-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-500/10 rounded-xl">
                                <MoySkladLogo className="h-7" />
                            </div>
                        </div>

                        {moySklad?.is_active ? (
                            <span className="flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 px-2.5 py-1 rounded-full font-semibold">
                                <CheckCircle2 className="h-3.5 w-3.5" /> Ulangan
                            </span>
                        ) : (
                            <span className="flex items-center gap-1 text-xs bg-secondary text-muted-foreground px-2.5 py-1 rounded-full font-medium">
                                <XCircle className="h-3.5 w-3.5" /> Ulanmagan
                            </span>
                        )}
                    </div>

                    <p className="text-xs text-muted-foreground">
                        Phone API 1.0, mijozlar (kontragentlar) kartasi, yangi qo‘ng‘iroqlarda bildirishnomalar va audio fayllar.
                    </p>

                    <form onSubmit={submitMoy} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold">Login yoki Email:</label>
                            <Input
                                placeholder="admin@company"
                                value={moyForm.data.login}
                                onChange={(e) => moyForm.setData('login', e.target.value)}
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold">Parol:</label>
                            <Input
                                type="password"
                                placeholder="••••••••••••••••"
                                value={moyForm.data.password}
                                onChange={(e) => moyForm.setData('password', e.target.value)}
                            />
                        </div>

                        <div className="relative flex py-1 items-center">
                            <div className="flex-grow border-t border-border"></div>
                            <span className="flex-shrink mx-2 text-[10px] text-muted-foreground uppercase">Yoki API Token</span>
                            <div className="flex-grow border-t border-border"></div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold">MoySklad Access Token:</label>
                            <Input
                                placeholder="Token orqali ulanish..."
                                value={moyForm.data.token}
                                onChange={(e) => moyForm.setData('token', e.target.value)}
                            />
                        </div>

                        <Button type="submit" className="w-full" disabled={moyForm.processing}>
                            {moyForm.processing ? 'Tekshirilmoqda...' : 'MoySklad bilan sinab ko\'rish'}
                        </Button>
                    </form>

                    <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">MoySklad integratsiya deskriptori:</span>
                        <a
                            href={moySkladDescriptorUrl}
                            download
                            className="inline-flex items-center gap-1.5 text-primary hover:underline font-medium"
                        >
                            <Download className="h-3.5 w-3.5" /> Ilova deskriptori (.xml)
                        </a>
                    </div>
                </div>
            </div>

            {/* Sync Logs */}
            <div className="bg-card rounded-2xl border border-border shadow-xs overflow-hidden">
                <div className="p-5 border-b border-border flex items-center justify-between">
                    <h3 className="font-semibold text-base flex items-center gap-2">
                        <Activity className="h-4 w-4 text-primary" /> So'nggi sinxronizatsiya loglari
                    </h3>
                </div>

                <table className="w-full text-left text-sm">
                    <thead className="bg-muted/50 border-b border-border text-muted-foreground text-xs uppercase font-medium">
                        <tr>
                            <th className="py-3 px-4">Tizim</th>
                            <th className="py-3 px-4">Qo'ng'iroq ID</th>
                            <th className="py-3 px-4">Holati</th>
                            <th className="py-3 px-4">Xabar / Xatolik</th>
                            <th className="py-3 px-4 text-right">Vaqt</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-xs">
                        {recentLogs.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="py-6 text-center text-muted-foreground">
                                    Hozircha hech qanday sinxronizatsiya logi mavjud emas.
                                </td>
                            </tr>
                        ) : (
                            recentLogs.map((log) => (
                                <tr key={log.id}>
                                    <td className="py-3 px-4 font-semibold uppercase">{log.crm_type}</td>
                                    <td className="py-3 px-4 font-mono">#{log.call_id || '—'}</td>
                                    <td className="py-3 px-4">
                                        <span className={`px-2 py-0.5 rounded-full font-semibold ${
                                            log.status === 'success' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'
                                        }`}>
                                            {log.status}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-muted-foreground font-mono">{log.error_message || 'OK'}</td>
                                    <td className="py-3 px-4 text-right text-muted-foreground">{new Date(log.created_at).toLocaleTimeString('uz-UZ')}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
