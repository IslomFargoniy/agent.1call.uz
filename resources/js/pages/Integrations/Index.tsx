import React, {
    Component,
    ErrorInfo,
    ReactNode,
    useState,
    useEffect,
} from 'react';
import { useTranslation } from 'react-i18next';
import { Head, useForm, router } from '@inertiajs/react';
import {
    Share2,
    CheckCircle2,
    XCircle,
    Activity,
    RefreshCw,
    Users,
    AlertCircle,
    Plus,
    Unlink,
    Copy,
    Check,
    ExternalLink,
    HelpCircle,
    Info,
    ShieldCheck,
    Key,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AmoCrmLogo, MoySkladLogo } from '@/components/brand-logos';
import { cn } from '@/lib/utils';
import { formatLogTime } from '@/lib/datetime';

interface IntegrationsProps {
    isAllTenants?: boolean;
    tenant?: { id: number; name: string } | null;
    amoCrm?: {
        id?: number;
        is_active: boolean;
        subdomain: string;
        settings?: any;
    } | null;
    moySklad?: {
        id?: number;
        is_active: boolean;
        login: string;
        settings?: any;
    } | null;
    operators?: { id: number; name: string; phone_number?: string }[];
    mappings?: {
        id: number;
        tenant_integration_id: number;
        user_id: number;
        external_user_id: string;
        external_user_name?: string;
        user?: { name: string };
    }[];
    recentLogs?: {
        id: number;
        crm_type: string;
        call_id?: number;
        status: string;
        error_message?: string;
        created_at?: string;
    }[];
}

class IntegrationsErrorBoundary extends Component<
    { children: ReactNode },
    { hasError: boolean; errorText: string }
> {
    constructor(props: { children: ReactNode }) {
        super(props);
        this.state = { hasError: false, errorText: '' };
    }

    static getDerivedStateFromError(error: Error) {
        return {
            hasError: true,
            errorText: error?.message || "Noma'lum xatolik yuz berdi",
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error(
            'Integrations error caught by boundary:',
            error,
            errorInfo,
        );
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="bg-card border-destructive/30 mx-auto my-12 max-w-4xl space-y-4 rounded-2xl border p-8 text-center shadow-sm">
                    <div className="bg-destructive/10 text-destructive mx-auto flex h-12 w-12 items-center justify-center rounded-full">
                        <AlertCircle className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-bold">
                        Sahifani yuklashda xatolik yuz berdi
                    </h3>
                    <p className="text-muted-foreground mx-auto max-w-md text-sm">
                        {this.state.errorText}
                    </p>
                    <Button
                        onClick={() => window.location.reload()}
                        variant="outline"
                        className="gap-2"
                    >
                        <RefreshCw className="h-4 w-4" /> Sahifani qayta yuklash
                    </Button>
                </div>
            );
        }
        return this.props.children;
    }
}

function IntegrationsContent({
    isAllTenants = false,
    amoCrm = null,
    moySklad = null,
    operators = [],
    mappings = [],
    recentLogs = [],
}: IntegrationsProps) {
    const { t } = useTranslation();
    const safeOperators = Array.isArray(operators) ? operators : [];
    const safeMappings = Array.isArray(mappings) ? mappings : [];
    const safeLogs = Array.isArray(recentLogs) ? recentLogs : [];

    // URL or State Tab Management
    const [activeTab, setActiveTab] = useState<'amocrm' | 'moysklad'>(() => {
        if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            const tabParam = urlParams.get('tab');
            if (tabParam === 'moysklad' || tabParam === 'amocrm') {
                return tabParam;
            }
            if (window.location.hash === '#moysklad') return 'moysklad';
        }
        return 'amocrm';
    });

    const [copiedRedirectUrl, setCopiedRedirectUrl] = useState(false);

    const handleTabChange = (tab: 'amocrm' | 'moysklad') => {
        setActiveTab(tab);
        if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.set('tab', tab);
            window.history.replaceState({}, '', url.toString());
        }
    };

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

    // User Mapping Form
    const mappingForm = useForm({
        tenant_integration_id: '',
        user_id: safeOperators[0]?.id ? String(safeOperators[0].id) : '',
        external_user_id: '',
        external_user_name: '',
    });

    // Update integration ID whenever tab or connections change
    useEffect(() => {
        if (activeTab === 'amocrm') {
            mappingForm.setData(
                'tenant_integration_id',
                amoCrm?.id ? String(amoCrm.id) : '',
            );
        } else {
            mappingForm.setData(
                'tenant_integration_id',
                moySklad?.id ? String(moySklad.id) : '',
            );
        }
    }, [activeTab, amoCrm?.id, moySklad?.id]);

    const submitAmo = (e: React.FormEvent) => {
        e.preventDefault();
        amoForm.post('/integrations/amocrm');
    };

    const submitMoy = (e: React.FormEvent) => {
        e.preventDefault();
        if (
            !moyForm.data.token &&
            (!moyForm.data.login || !moyForm.data.password)
        ) {
            alert(
                t(
                    'integrations.enterTokenOrCredentials',
                    'Iltimos, MoySklad API tokenini yoki Login va Parolni kiriting.',
                ),
            );
            return;
        }
        moyForm.post('/integrations/moysklad');
    };

    const disconnectAmo = () => {
        if (
            confirm(
                t(
                    'integrations.disconnectConfirmAmo',
                    'Haqiqatan ham amoCRM integratsiyasini uzmoqchimisiz?',
                ),
            )
        ) {
            router.delete('/integrations/amocrm');
        }
    };

    const disconnectMoy = () => {
        if (
            confirm(
                t(
                    'integrations.disconnectConfirmMoy',
                    'Haqiqatan ham MoySklad integratsiyasini uzmoqchimisiz?',
                ),
            )
        ) {
            router.delete('/integrations/moysklad');
        }
    };

    const submitMapping = (e: React.FormEvent) => {
        e.preventDefault();
        mappingForm.post('/integrations/user-mapping', {
            onSuccess: () => {
                mappingForm.reset('external_user_id', 'external_user_name');
            },
        });
    };

    const redirectUri =
        typeof window !== 'undefined'
            ? `${window.location.origin}/api/v1/integrations/amocrm/callback`
            : 'https://agent.1call.uz/api/v1/integrations/amocrm/callback';

    const copyRedirectUri = () => {
        navigator.clipboard.writeText(redirectUri);
        setCopiedRedirectUrl(true);
        setTimeout(() => setCopiedRedirectUrl(false), 2000);
    };

    // Filter mappings and logs for active tab
    const amoMappings = safeMappings.filter(
        (m) => amoCrm?.id && m.tenant_integration_id === amoCrm.id,
    );
    const moyMappings = safeMappings.filter(
        (m) => moySklad?.id && m.tenant_integration_id === moySklad.id,
    );

    const amoLogs = safeLogs.filter(
        (l) => l.crm_type?.toLowerCase() === 'amocrm',
    );
    const moyLogs = safeLogs.filter(
        (l) => l.crm_type?.toLowerCase() === 'moysklad',
    );

    const [amoLogPage, setAmoLogPage] = useState(1);
    const [amoPerPage, setAmoPerPage] = useState<'10' | '30' | '50' | 'all'>(
        '10',
    );
    const amoPageSize =
        amoPerPage === 'all' ? Math.max(1, amoLogs.length) : Number(amoPerPage);
    const amoTotalPages =
        amoPerPage === 'all' ? 1 : Math.ceil(amoLogs.length / amoPageSize) || 1;
    const paginatedAmoLogs =
        amoPerPage === 'all'
            ? amoLogs
            : amoLogs.slice(
                  (amoLogPage - 1) * amoPageSize,
                  amoLogPage * amoPageSize,
              );

    const [moyLogPage, setMoyLogPage] = useState(1);
    const [moyPerPage, setMoyPerPage] = useState<'10' | '30' | '50' | 'all'>(
        '10',
    );
    const moyPageSize =
        moyPerPage === 'all' ? Math.max(1, moyLogs.length) : Number(moyPerPage);
    const moyTotalPages =
        moyPerPage === 'all' ? 1 : Math.ceil(moyLogs.length / moyPageSize) || 1;
    const paginatedMoyLogs =
        moyPerPage === 'all'
            ? moyLogs
            : moyLogs.slice(
                  (moyLogPage - 1) * moyPageSize,
                  moyLogPage * moyPageSize,
              );

    return (
        <div className="mx-auto max-w-6xl space-y-8 p-6">
            <Head
                title={t(
                    'integrations.title',
                    'CRM Integratsiyalari (amoCRM & MoySklad)',
                )}
            />

            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">
                        {t('integrations.title', 'CRM & ERP Integratsiyalari')}
                    </h2>
                    <p className="text-muted-foreground text-sm">
                        {t(
                            'integrations.subtitle',
                            "Telefoniya qo'ng'iroqlari va audio yozuvlarini amoCRM va MoySklad tizimlari bilan avtomatik sinxronlash",
                        )}
                    </p>
                </div>
            </div>

            {isAllTenants && (
                <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-amber-700 dark:text-amber-300">
                    <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
                    <div className="space-y-1 text-xs">
                        <p className="text-sm font-semibold">
                            Siz "Barcha kompaniyalar" rejimidasiz
                        </p>
                        <p className="text-muted-foreground">
                            amoCRM yoki MoySklad integratsiyalari har bir
                            kompaniya uchun alohida sozlanadi. Muayyan kompaniya
                            integratsiyasini ulash yoki tahrirlash uchun
                            yuqoridagi menyudan kerakli kompaniyani tanlang.
                        </p>
                    </div>
                </div>
            )}

            {/* 2 Tabs: amoCRM and MoySklad */}
            <div className="border-border/80 flex flex-col gap-4 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="bg-muted/60 dark:bg-muted/30 border-border/80 inline-flex gap-2 rounded-2xl border p-1.5 shadow-xs">
                    {/* amoCRM Tab Button */}
                    <button
                        type="button"
                        onClick={() => handleTabChange('amocrm')}
                        className={cn(
                            'flex cursor-pointer items-center gap-3 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200',
                            activeTab === 'amocrm'
                                ? 'bg-card text-foreground border-border/70 border shadow-xs'
                                : 'text-muted-foreground hover:text-foreground hover:bg-background/50',
                        )}
                    >
                        <div className="flex items-center justify-center rounded-lg bg-blue-500/10 p-1.5">
                            <AmoCrmLogo className="h-5" />
                        </div>
                        <span className="font-bold">amoCRM</span>
                        {amoCrm?.is_active ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500"></span>
                                {t('integrations.connected', 'Ulangan')}
                            </span>
                        ) : (
                            <span className="bg-secondary text-muted-foreground rounded-full px-2 py-0.5 text-[11px] font-medium">
                                {t('integrations.notConnected', 'Ulanmagan')}
                            </span>
                        )}
                    </button>

                    {/* MoySklad Tab Button */}
                    <button
                        type="button"
                        onClick={() => handleTabChange('moysklad')}
                        className={cn(
                            'flex cursor-pointer items-center gap-3 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200',
                            activeTab === 'moysklad'
                                ? 'bg-card text-foreground border-border/70 border shadow-xs'
                                : 'text-muted-foreground hover:text-foreground hover:bg-background/50',
                        )}
                    >
                        <div className="flex items-center justify-center rounded-lg bg-orange-500/10 p-1.5">
                            <MoySkladLogo className="h-5" />
                        </div>
                        <span className="font-bold">MoySklad (МойСклад)</span>
                        {moySklad?.is_active ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500"></span>
                                {t('integrations.connected', 'Ulangan')}
                            </span>
                        ) : (
                            <span className="bg-secondary text-muted-foreground rounded-full px-2 py-0.5 text-[11px] font-medium">
                                {t('integrations.notConnected', 'Ulanmagan')}
                            </span>
                        )}
                    </button>
                </div>

                <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                    <Activity className="text-primary h-3.5 w-3.5" />
                    <span>
                        {activeTab === 'amocrm'
                            ? 'amoCRM API v4 & Webhooks'
                            : 'MoySklad Phone API 1.0'}
                    </span>
                </div>
            </div>

            {/* TAB 1: amoCRM */}
            {activeTab === 'amocrm' && (
                <div className="space-y-8">
                    {/* amoCRM Integration Card */}
                    <div className="bg-card border-border overflow-hidden rounded-2xl border shadow-xs">
                        <div className="border-border flex flex-col gap-4 border-b p-6 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-3.5">
                                <div className="rounded-2xl bg-blue-500/10 p-2.5">
                                    <AmoCrmLogo className="h-8" />
                                </div>
                                <div>
                                    <h3 className="flex items-center gap-2 text-lg font-bold">
                                        amoCRM Integratsiyasi
                                        {amoCrm?.is_active ? (
                                            <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                                                <CheckCircle2 className="h-3.5 w-3.5" />{' '}
                                                {t(
                                                    'integrations.connected',
                                                    'Ulangan',
                                                )}
                                            </span>
                                        ) : (
                                            <span className="bg-secondary text-muted-foreground flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium">
                                                <XCircle className="h-3.5 w-3.5" />{' '}
                                                {t(
                                                    'integrations.notConnected',
                                                    'Ulanmagan',
                                                )}
                                            </span>
                                        )}
                                    </h3>
                                    <p className="text-muted-foreground mt-0.5 text-xs">
                                        {t(
                                            'integrations.amoDesc',
                                            "Leadlar, kontaktlar, qo'ng'iroq kartochkalari va audio yozuvlarini amoCRM bilan to'liq sinxronlashtirish.",
                                        )}
                                    </p>
                                </div>
                            </div>

                            {amoCrm?.is_active && (
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    onClick={disconnectAmo}
                                    className="h-9 cursor-pointer gap-1.5 self-start text-xs sm:self-auto"
                                >
                                    <Unlink className="h-3.5 w-3.5" />{' '}
                                    {t(
                                        'integrations.disconnectIntegration',
                                        'Integratsiyani uzish',
                                    )}
                                </Button>
                            )}
                        </div>

                        {amoCrm?.is_active ? (
                            <div className="space-y-4 p-6">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                    <div className="bg-secondary/30 border-border/60 space-y-1 rounded-xl border p-4">
                                        <span className="text-muted-foreground text-xs font-medium">
                                            Ulangan amoCRM Subdomain:
                                        </span>
                                        <div className="text-foreground flex items-center gap-1.5 font-mono text-sm font-bold">
                                            <a
                                                href={`https://${amoCrm.subdomain}.amocrm.ru`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-primary flex items-center gap-1 hover:underline"
                                            >
                                                {amoCrm.subdomain}.amocrm.ru
                                                <ExternalLink className="h-3 w-3" />
                                            </a>
                                        </div>
                                    </div>

                                    <div className="bg-secondary/30 border-border/60 space-y-1 rounded-xl border p-4">
                                        <span className="text-muted-foreground text-xs font-medium">
                                            Avtomatik vazifa yaratish:
                                        </span>
                                        <div className="text-foreground flex items-center gap-1.5 text-sm font-semibold">
                                            {amoCrm.settings
                                                ?.create_task_on_missed ? (
                                                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                                                    <CheckCircle2 className="h-3.5 w-3.5" />{' '}
                                                    Javobsizlarda vazifa
                                                    ochiladi
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground">
                                                    Nofaol
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-secondary/30 border-border/60 space-y-1 rounded-xl border p-4">
                                        <span className="text-muted-foreground text-xs font-medium">
                                            Audio yozuvlar va Player:
                                        </span>
                                        <div className="flex items-center gap-1 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                                            <ShieldCheck className="h-3.5 w-3.5" />{' '}
                                            HMAC Token bilan himoyalangan
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-8 p-6 lg:grid-cols-12">
                                {/* Form Left */}
                                <form
                                    onSubmit={submitAmo}
                                    className="space-y-4 lg:col-span-7"
                                >
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold">
                                            {t(
                                                'integrations.amoSubdomainLabel',
                                                'Subdomain (kompaniya): *',
                                            )}
                                        </label>
                                        <div className="border-input bg-background focus-within:ring-primary flex items-center overflow-hidden rounded-md border focus-within:ring-1">
                                            <Input
                                                placeholder={t(
                                                    'integrations.amoSubdomainPlaceholder',
                                                    'mycompany',
                                                )}
                                                value={amoForm.data.subdomain}
                                                onChange={(e) =>
                                                    amoForm.setData(
                                                        'subdomain',
                                                        e.target.value,
                                                    )
                                                }
                                                className="border-0 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
                                                required
                                            />
                                            <span className="text-muted-foreground bg-muted/40 border-border flex h-full items-center border-l px-3 font-mono text-xs select-none">
                                                .amocrm.ru
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold">
                                            {t(
                                                'integrations.amoClientIdLabel',
                                                'Integratsiya ID (Client ID): *',
                                            )}
                                        </label>
                                        <Input
                                            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                                            value={amoForm.data.client_id}
                                            onChange={(e) =>
                                                amoForm.setData(
                                                    'client_id',
                                                    e.target.value,
                                                )
                                            }
                                            required
                                            className="font-mono text-xs"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold">
                                            {t(
                                                'integrations.amoClientSecretLabel',
                                                'Maxfiy kalit (Client Secret): *',
                                            )}
                                        </label>
                                        <Input
                                            type="password"
                                            placeholder="••••••••••••••••••••••••"
                                            value={amoForm.data.client_secret}
                                            onChange={(e) =>
                                                amoForm.setData(
                                                    'client_secret',
                                                    e.target.value,
                                                )
                                            }
                                            required
                                            className="font-mono text-xs"
                                        />
                                    </div>

                                    <div className="flex items-center gap-2 pt-2">
                                        <input
                                            type="checkbox"
                                            id="taskOnMissed"
                                            checked={
                                                amoForm.data
                                                    .create_task_on_missed
                                            }
                                            onChange={(e) =>
                                                amoForm.setData(
                                                    'create_task_on_missed',
                                                    e.target.checked,
                                                )
                                            }
                                            className="text-primary focus:ring-primary h-4 w-4 cursor-pointer rounded"
                                        />
                                        <label
                                            htmlFor="taskOnMissed"
                                            className="cursor-pointer text-xs font-medium select-none"
                                        >
                                            {t(
                                                'integrations.amoCreateTaskOnMissed',
                                                "Javobsiz qo'ng'iroqlarda avtomatik vazifa (task) yaratish",
                                            )}
                                        </label>
                                    </div>

                                    <Button
                                        type="submit"
                                        className="mt-2 h-10 w-full gap-2"
                                        disabled={amoForm.processing}
                                    >
                                        <AmoCrmLogo className="h-4" />
                                        {amoForm.processing
                                            ? t(
                                                  'billing.loading',
                                                  'Yuklanmoqda...',
                                              )
                                            : t(
                                                  'integrations.amoConnectBtn',
                                                  'amoCRM bilan ulash (OAuth2)',
                                              )}
                                    </Button>
                                </form>

                                {/* Instruction Guide Right */}
                                <div className="bg-muted/30 border-border/80 space-y-4 rounded-xl border p-5 text-xs lg:col-span-5">
                                    <div className="text-foreground flex items-center gap-2 text-sm font-bold">
                                        <HelpCircle className="text-primary h-4 w-4" />{' '}
                                        amoCRM ulanish bo'yicha qo'llanma
                                    </div>

                                    <ol className="text-muted-foreground list-inside list-decimal space-y-3 leading-relaxed">
                                        <li>
                                            amoCRM hisobingizga kiring va{' '}
                                            <span className="text-foreground font-semibold">
                                                Sozlamalar &rarr;
                                                Integratsiyalar
                                            </span>{' '}
                                            sahifasiga o'ting.
                                        </li>
                                        <li>
                                            <span className="text-foreground font-semibold">
                                                "Yangi integratsiya yaratish"
                                            </span>{' '}
                                            tugmasini bosing.
                                        </li>
                                        <li>
                                            <div className="mt-1">
                                                <span className="text-foreground font-semibold">
                                                    Qayta yo'naltirish URL
                                                    (Redirect URI):
                                                </span>
                                                <div className="bg-background border-border text-foreground mt-1 flex items-center gap-1.5 rounded-lg border p-1.5 font-mono text-[11px]">
                                                    <span className="flex-1 truncate select-all">
                                                        {redirectUri}
                                                    </span>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={
                                                            copyRedirectUri
                                                        }
                                                        className="h-6 cursor-pointer gap-1 px-2 text-[10px]"
                                                    >
                                                        {copiedRedirectUrl ? (
                                                            <Check className="h-3 w-3 text-emerald-500" />
                                                        ) : (
                                                            <Copy className="h-3 w-3" />
                                                        )}
                                                        {copiedRedirectUrl
                                                            ? 'Nusxalandi'
                                                            : 'Nusxa olish'}
                                                    </Button>
                                                </div>
                                            </div>
                                        </li>
                                        <li>
                                            Ruxsatnomalar (Permissions)
                                            bo'limida{' '}
                                            <span className="text-foreground font-semibold">
                                                Qo'ng'iroqlar, Kontaktlar,
                                                Bitimlar (Leads)
                                            </span>{' '}
                                            ga to'liq ruxsat bering.
                                        </li>
                                        <li>
                                            Integratsiyani saqlang va berilgan{' '}
                                            <span className="text-foreground font-semibold">
                                                Client ID
                                            </span>{' '}
                                            hamda{' '}
                                            <span className="text-foreground font-semibold">
                                                Client Secret
                                            </span>{' '}
                                            ni chapdagi maydonlarga kiriting.
                                        </li>
                                    </ol>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* amoCRM User Mapping Section */}
                    <div className="bg-card border-border space-y-4 overflow-hidden rounded-2xl border p-6 shadow-xs">
                        <div className="border-border flex flex-col gap-2 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h3 className="flex items-center gap-2 text-base font-semibold">
                                    <Users className="text-primary h-4 w-4" />{' '}
                                    amoCRM operatorlarini biriktirish (User
                                    Mapping)
                                </h3>
                                <p className="text-muted-foreground mt-0.5 text-xs">
                                    Agent1Call operatorlarini amoCRM xodimlariga
                                    biriktiring, shunda qo'ng'iroqlar ularning
                                    nomidan avtomatik saqlanadi.
                                </p>
                            </div>
                            {amoCrm?.is_active && (
                                <span className="text-primary rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium">
                                    Biriktirilgan: {amoMappings.length} ta
                                    operator
                                </span>
                            )}
                        </div>

                        {amoCrm?.is_active ? (
                            <form
                                onSubmit={submitMapping}
                                className="grid grid-cols-1 items-end gap-3 pt-2 sm:grid-cols-2 lg:grid-cols-4"
                            >
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold">
                                        Agent1Call Operatori: *
                                    </label>
                                    <select
                                        value={mappingForm.data.user_id}
                                        onChange={(e) =>
                                            mappingForm.setData(
                                                'user_id',
                                                e.target.value,
                                            )
                                        }
                                        className="border-input bg-background h-9 w-full rounded-md border px-3 text-xs"
                                        required
                                    >
                                        <option value="">
                                            {t(
                                                'integrations.selectPlaceholder',
                                                'Tanlang...',
                                            )}
                                        </option>
                                        {safeOperators.map((op) => (
                                            <option
                                                key={op.id}
                                                value={String(op.id)}
                                            >
                                                {op.name}{' '}
                                                {op.phone_number
                                                    ? `(${op.phone_number})`
                                                    : ''}
                                            </option>
                                        ))}
                                        {safeOperators.length === 0 && (
                                            <option value="" disabled>
                                                Operatorlar mavjud emas
                                            </option>
                                        )}
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-semibold">
                                        amoCRM Foydalanuvchi ID (User ID): *
                                    </label>
                                    <Input
                                        placeholder="Masalan: 8945612"
                                        value={
                                            mappingForm.data.external_user_id
                                        }
                                        onChange={(e) =>
                                            mappingForm.setData(
                                                'external_user_id',
                                                e.target.value,
                                            )
                                        }
                                        required
                                        className="font-mono text-xs"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-semibold">
                                        amoCRM Xodim Ismi (ixtiyoriy):
                                    </label>
                                    <Input
                                        placeholder="Masalan: Nodirbek"
                                        value={
                                            mappingForm.data.external_user_name
                                        }
                                        onChange={(e) =>
                                            mappingForm.setData(
                                                'external_user_name',
                                                e.target.value,
                                            )
                                        }
                                        className="text-xs"
                                    />
                                </div>

                                <div>
                                    <Button
                                        type="submit"
                                        className="h-9 w-full gap-1.5"
                                        disabled={mappingForm.processing}
                                    >
                                        <Plus className="h-4 w-4" />{' '}
                                        {t(
                                            'integrations.assignBtn',
                                            'Biriktirish',
                                        )}
                                    </Button>
                                </div>
                            </form>
                        ) : (
                            <div className="bg-muted/40 border-border/80 text-muted-foreground flex items-center gap-2 rounded-xl border p-4 text-xs">
                                <Info className="text-primary h-4 w-4 shrink-0" />
                                Operatorlarni biriktirish uchun avval yuqorida
                                amoCRM integratsiyasini faollashtiring.
                            </div>
                        )}

                        {amoMappings.length > 0 ? (
                            <div className="border-border mt-4 overflow-hidden rounded-xl border">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-muted/50 border-border text-muted-foreground border-b font-medium uppercase">
                                        <tr>
                                            <th className="w-10 px-4 py-2.5 text-center">
                                                №
                                            </th>
                                            <th className="px-4 py-2.5">
                                                Agent1Call Operatori
                                            </th>
                                            <th className="px-4 py-2.5">
                                                amoCRM User ID
                                            </th>
                                            <th className="px-4 py-2.5">
                                                amoCRM Xodim Ismi
                                            </th>
                                            <th className="px-4 py-2.5 text-right">
                                                Holati
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-border divide-y">
                                        {amoMappings.map((m, idx) => (
                                            <tr
                                                key={m.id}
                                                className="hover:bg-muted/30 transition-colors"
                                            >
                                                <td className="text-muted-foreground px-4 py-2.5 text-center font-mono">
                                                    {idx + 1}
                                                </td>
                                                <td className="text-foreground px-4 py-2.5 font-semibold">
                                                    {m.user?.name ||
                                                        `Operator #${m.user_id}`}
                                                </td>
                                                <td className="text-primary px-4 py-2.5 font-mono font-semibold">
                                                    {m.external_user_id}
                                                </td>
                                                <td className="text-muted-foreground px-4 py-2.5">
                                                    {m.external_user_name ||
                                                        '—'}
                                                </td>
                                                <td className="px-4 py-2.5 text-right">
                                                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                                                        <Check className="h-3 w-3" />{' '}
                                                        Ulangan
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            amoCrm?.is_active && (
                                <p className="text-muted-foreground py-3 text-center text-xs">
                                    Hozircha amoCRM uchun biriktirilgan
                                    operatorlar mavjud emas. Yuqoridagi formadan
                                    qo'shing.
                                </p>
                            )
                        )}
                    </div>

                    {/* amoCRM Sync Logs */}
                    <div className="bg-card border-border overflow-hidden rounded-2xl border shadow-xs">
                        <div className="border-border flex items-center justify-between border-b p-5">
                            <h3 className="flex items-center gap-2 text-base font-semibold">
                                <Activity className="text-primary h-4 w-4" />{' '}
                                amoCRM Sinxronizatsiya loglari
                            </h3>
                            <span className="text-muted-foreground font-mono text-xs">
                                {amoLogs.length} ta yozuv
                            </span>
                        </div>

                        <table className="w-full text-left text-sm">
                            <thead className="bg-muted/50 border-border text-muted-foreground border-b text-xs font-medium uppercase">
                                <tr>
                                    <th className="w-10 px-4 py-3 text-center">
                                        №
                                    </th>
                                    <th className="px-4 py-3">Qo'ng'iroq ID</th>
                                    <th className="px-4 py-3">Holati</th>
                                    <th className="px-4 py-3">
                                        Xabar / Tafsilot
                                    </th>
                                    <th className="px-4 py-3 text-right">
                                        Vaqt
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-border divide-y text-xs">
                                {amoLogs.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="text-muted-foreground py-6 text-center"
                                        >
                                            Hozircha amoCRM bo'yicha hech qanday
                                            sinxronizatsiya logi mavjud emas.
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedAmoLogs.map((log, idx) => (
                                        <tr
                                            key={log.id}
                                            className="hover:bg-muted/30 transition-colors"
                                        >
                                            <td className="text-muted-foreground px-4 py-3 text-center font-mono text-xs">
                                                {(amoLogPage - 1) *
                                                    (amoPerPage === 'all'
                                                        ? amoLogs.length
                                                        : Number(amoPerPage)) +
                                                    idx +
                                                    1}
                                            </td>
                                            <td className="text-primary px-4 py-3 font-mono font-semibold">
                                                #{log.call_id || '—'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`rounded-full px-2.5 py-0.5 font-semibold ${
                                                        log.status === 'success'
                                                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                                            : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'
                                                    }`}
                                                >
                                                    {log.status === 'success'
                                                        ? 'Muvaffaqiyatli'
                                                        : log.status}
                                                </span>
                                            </td>
                                            <td className="text-muted-foreground px-4 py-3 font-mono">
                                                {log.error_message ||
                                                    "amoCRM ga qo'ng'iroq va audio yuborildi"}
                                            </td>
                                            <td className="text-muted-foreground px-4 py-3 text-right font-mono">
                                                {formatLogTime(log.created_at)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>

                        <div className="border-border text-muted-foreground flex flex-col items-center justify-between gap-3 border-t p-3 text-xs sm:flex-row">
                            <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-start">
                                <span>
                                    Jami:{' '}
                                    <strong className="text-foreground font-mono">
                                        {amoLogs.length}
                                    </strong>{' '}
                                    ta yozuv{' '}
                                    {amoPerPage !== 'all' && amoTotalPages > 1
                                        ? `(${amoLogPage} / ${amoTotalPages}-sahifa)`
                                        : ''}
                                </span>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-muted-foreground/80 text-[11px] font-medium">
                                        Qatorlar:
                                    </span>
                                    <div className="border-border/80 bg-muted/40 inline-flex rounded-lg border p-0.5 shadow-2xs">
                                        {(
                                            ['10', '30', '50', 'all'] as const
                                        ).map((opt) => (
                                            <button
                                                key={opt}
                                                type="button"
                                                onClick={() => {
                                                    setAmoPerPage(opt);
                                                    setAmoLogPage(1);
                                                }}
                                                className={`rounded-md px-2 py-0.5 text-[11px] font-semibold transition-all ${
                                                    amoPerPage === opt
                                                        ? 'bg-background text-foreground font-bold shadow-xs'
                                                        : 'text-muted-foreground hover:text-foreground'
                                                }`}
                                            >
                                                {opt === 'all' ? 'All' : opt}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {amoTotalPages > 1 && (
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 px-2.5 text-xs"
                                        disabled={amoLogPage <= 1}
                                        onClick={() =>
                                            setAmoLogPage((p) =>
                                                Math.max(1, p - 1),
                                            )
                                        }
                                    >
                                        « Oldingi
                                    </Button>
                                    <span className="px-2 font-mono text-xs">
                                        {amoLogPage} / {amoTotalPages}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 px-2.5 text-xs"
                                        disabled={amoLogPage >= amoTotalPages}
                                        onClick={() =>
                                            setAmoLogPage((p) =>
                                                Math.min(amoTotalPages, p + 1),
                                            )
                                        }
                                    >
                                        Keyingi »
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 2: MoySklad */}
            {activeTab === 'moysklad' && (
                <div className="space-y-8">
                    {/* MoySklad Integration Card */}
                    <div className="bg-card border-border overflow-hidden rounded-2xl border shadow-xs">
                        <div className="border-border flex flex-col gap-4 border-b p-6 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-3.5">
                                <div className="rounded-2xl bg-orange-500/10 p-2.5">
                                    <MoySkladLogo className="h-8" />
                                </div>
                                <div>
                                    <h3 className="flex items-center gap-2 text-lg font-bold">
                                        MoySklad (МойСклад) Integratsiyasi
                                        {moySklad?.is_active ? (
                                            <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                                                <CheckCircle2 className="h-3.5 w-3.5" />{' '}
                                                {t(
                                                    'integrations.connected',
                                                    'Ulangan',
                                                )}
                                            </span>
                                        ) : (
                                            <span className="bg-secondary text-muted-foreground flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium">
                                                <XCircle className="h-3.5 w-3.5" />{' '}
                                                {t(
                                                    'integrations.notConnected',
                                                    'Ulanmagan',
                                                )}
                                            </span>
                                        )}
                                    </h3>
                                    <p className="text-muted-foreground mt-0.5 text-xs">
                                        {t(
                                            'integrations.moyDesc',
                                            "Phone API 1.0, mijozlar (kontragentlar) kartasi, yangi qo'ng'iroqlarda bildirishnomalar va audio fayllar.",
                                        )}
                                    </p>
                                </div>
                            </div>

                            {moySklad?.is_active && (
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    onClick={disconnectMoy}
                                    className="h-9 cursor-pointer gap-1.5 self-start text-xs sm:self-auto"
                                >
                                    <Unlink className="h-3.5 w-3.5" />{' '}
                                    {t(
                                        'integrations.disconnectIntegration',
                                        'Integratsiyani uzish',
                                    )}
                                </Button>
                            )}
                        </div>

                        {moySklad?.is_active ? (
                            <div className="space-y-4 p-6">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                    <div className="bg-secondary/30 border-border/60 space-y-1 rounded-xl border p-4">
                                        <span className="text-muted-foreground text-xs font-medium">
                                            Ulangan MoySklad hisobi:
                                        </span>
                                        <div className="text-foreground flex items-center gap-1.5 font-mono text-sm font-bold">
                                            <span className="text-primary">
                                                {moySklad.login ||
                                                    'MoySklad API Token orqali ulangan'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="bg-secondary/30 border-border/60 space-y-1 rounded-xl border p-4">
                                        <span className="text-muted-foreground text-xs font-medium">
                                            Integratsiya protokoli:
                                        </span>
                                        <div className="text-foreground flex items-center gap-1.5 text-sm font-semibold">
                                            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                                                <CheckCircle2 className="h-3.5 w-3.5" />{' '}
                                                MoySklad Phone API 1.0
                                            </span>
                                        </div>
                                    </div>

                                    <div className="bg-secondary/30 border-border/60 space-y-1 rounded-xl border p-4">
                                        <span className="text-muted-foreground text-xs font-medium">
                                            Sinxronlash holati:
                                        </span>
                                        <div className="flex items-center gap-1 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                                            <ShieldCheck className="h-3.5 w-3.5" />{' '}
                                            Avtomatik faol
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-8 p-6 lg:grid-cols-12">
                                {/* Form Left */}
                                <form
                                    onSubmit={submitMoy}
                                    className="space-y-4 lg:col-span-7"
                                >
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <label className="flex items-center gap-1.5 text-xs font-semibold">
                                                <Key className="text-primary h-3.5 w-3.5" />{' '}
                                                MoySklad API Access Token
                                                (Tavsiya etiladi):
                                            </label>
                                            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                                                Eng xavfsiz
                                            </span>
                                        </div>
                                        <Input
                                            placeholder={t(
                                                'integrations.moyTokenPlaceholder',
                                                'Masalan: d83f8b05... yoki bearer token',
                                            )}
                                            value={moyForm.data.token}
                                            onChange={(e) =>
                                                moyForm.setData(
                                                    'token',
                                                    e.target.value,
                                                )
                                            }
                                            className="font-mono text-xs"
                                        />
                                    </div>

                                    <div className="relative flex items-center py-2">
                                        <div className="border-border flex-grow border-t"></div>
                                        <span className="text-muted-foreground mx-3 flex-shrink text-[10px] font-bold tracking-wider uppercase">
                                            {t(
                                                'integrations.orApiToken',
                                                'YOKI LOGIN VA PAROL',
                                            )}
                                        </span>
                                        <div className="border-border flex-grow border-t"></div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold">
                                            {t(
                                                'integrations.moyLoginLabel',
                                                'Login yoki Email:',
                                            )}
                                        </label>
                                        <Input
                                            placeholder={t(
                                                'integrations.moyLoginPlaceholder',
                                                'admin@company.uz',
                                            )}
                                            value={moyForm.data.login}
                                            onChange={(e) =>
                                                moyForm.setData(
                                                    'login',
                                                    e.target.value,
                                                )
                                            }
                                            className="text-sm"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold">
                                            {t(
                                                'integrations.moyPasswordLabel',
                                                'Parol:',
                                            )}
                                        </label>
                                        <Input
                                            type="password"
                                            placeholder="••••••••••••••••"
                                            value={moyForm.data.password}
                                            onChange={(e) =>
                                                moyForm.setData(
                                                    'password',
                                                    e.target.value,
                                                )
                                            }
                                            className="font-mono text-xs"
                                        />
                                    </div>

                                    <Button
                                        type="submit"
                                        className="mt-2 h-10 w-full gap-2"
                                        disabled={moyForm.processing}
                                    >
                                        <MoySkladLogo className="h-4" />
                                        {moyForm.processing
                                            ? t(
                                                  'billing.loading',
                                                  'Yuklanmoqda...',
                                              )
                                            : t(
                                                  'integrations.moyConnectBtn',
                                                  "MoySklad bilan sinab ko'rish va ulash",
                                              )}
                                    </Button>
                                </form>

                                {/* Instruction Guide Right */}
                                <div className="bg-muted/30 border-border/80 space-y-4 rounded-xl border p-5 text-xs lg:col-span-5">
                                    <div className="text-foreground flex items-center gap-2 text-sm font-bold">
                                        <HelpCircle className="text-primary h-4 w-4" />{' '}
                                        MoySklad ulanish bo'yicha qo'llanma
                                    </div>

                                    <ol className="text-muted-foreground list-inside list-decimal space-y-3 leading-relaxed">
                                        <li>
                                            MoySklad hisobingizga kiring:{' '}
                                            <a
                                                href="https://online.moysklad.ru"
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-primary inline-flex items-center gap-0.5 hover:underline"
                                            >
                                                online.moysklad.ru{' '}
                                                <ExternalLink className="h-2.5 w-2.5" />
                                            </a>
                                        </li>
                                        <li>
                                            O'ng yuqori burchakda foydalanuvchi
                                            profiliga bosing va{' '}
                                            <span className="text-foreground font-semibold">
                                                "Mening hisobim" (Мой профиль)
                                            </span>{' '}
                                            yoki{' '}
                                            <span className="text-foreground font-semibold">
                                                Sozlamalar &rarr; Xodimlar
                                            </span>{' '}
                                            bo'limiga o'ting.
                                        </li>
                                        <li>
                                            <span className="text-foreground font-semibold">
                                                "Xavfsizlik" (Безопасность)
                                            </span>{' '}
                                            sahifasidan{' '}
                                            <span className="text-foreground font-semibold">
                                                "Yangi Token yaratish" (Создать
                                                токен)
                                            </span>{' '}
                                            tugmasini bosing.
                                        </li>
                                        <li>
                                            Yaratilgan tokenni nusxalab,
                                            chapdagi{' '}
                                            <span className="text-foreground font-semibold">
                                                "API Access Token"
                                            </span>{' '}
                                            maydoniga kiriting.
                                        </li>
                                        <li>
                                            Ulanish muvaffaqiyatli o'rnatilgach,
                                            har bir qo'ng'iroq paytida MoySklad
                                            mijoz kartasi ochiladi va audio
                                            yozuvlar kontragentga yuklanadi.
                                        </li>
                                    </ol>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* MoySklad User Mapping Section */}
                    <div className="bg-card border-border space-y-4 overflow-hidden rounded-2xl border p-6 shadow-xs">
                        <div className="border-border flex flex-col gap-2 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h3 className="flex items-center gap-2 text-base font-semibold">
                                    <Users className="text-primary h-4 w-4" />{' '}
                                    MoySklad xodimlarini biriktirish (User
                                    Mapping)
                                </h3>
                                <p className="text-muted-foreground mt-0.5 text-xs">
                                    Agent1Call operatorlarini MoySklad
                                    xodimlariga biriktiring, shunda
                                    qo'ng'iroqlar kontragent kartasida tegishli
                                    xodimga yoziladi.
                                </p>
                            </div>
                            {moySklad?.is_active && (
                                <span className="rounded-full bg-orange-500/10 px-3 py-1 text-xs font-medium text-orange-600 dark:text-orange-400">
                                    Biriktirilgan: {moyMappings.length} ta
                                    operator
                                </span>
                            )}
                        </div>

                        {moySklad?.is_active ? (
                            <form
                                onSubmit={submitMapping}
                                className="grid grid-cols-1 items-end gap-3 pt-2 sm:grid-cols-2 lg:grid-cols-4"
                            >
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold">
                                        Agent1Call Operatori: *
                                    </label>
                                    <select
                                        value={mappingForm.data.user_id}
                                        onChange={(e) =>
                                            mappingForm.setData(
                                                'user_id',
                                                e.target.value,
                                            )
                                        }
                                        className="border-input bg-background h-9 w-full rounded-md border px-3 text-xs"
                                        required
                                    >
                                        <option value="">
                                            {t(
                                                'integrations.selectPlaceholder',
                                                'Tanlang...',
                                            )}
                                        </option>
                                        {safeOperators.map((op) => (
                                            <option
                                                key={op.id}
                                                value={String(op.id)}
                                            >
                                                {op.name}{' '}
                                                {op.phone_number
                                                    ? `(${op.phone_number})`
                                                    : ''}
                                            </option>
                                        ))}
                                        {safeOperators.length === 0 && (
                                            <option value="" disabled>
                                                Operatorlar mavjud emas
                                            </option>
                                        )}
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-semibold">
                                        MoySklad Xodim Login yoki UID: *
                                    </label>
                                    <Input
                                        placeholder="Masalan: admin@company yoki UID"
                                        value={
                                            mappingForm.data.external_user_id
                                        }
                                        onChange={(e) =>
                                            mappingForm.setData(
                                                'external_user_id',
                                                e.target.value,
                                            )
                                        }
                                        required
                                        className="font-mono text-xs"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-semibold">
                                        MoySklad Xodim Ismi (ixtiyoriy):
                                    </label>
                                    <Input
                                        placeholder="Masalan: Sardorbek"
                                        value={
                                            mappingForm.data.external_user_name
                                        }
                                        onChange={(e) =>
                                            mappingForm.setData(
                                                'external_user_name',
                                                e.target.value,
                                            )
                                        }
                                        className="text-xs"
                                    />
                                </div>

                                <div>
                                    <Button
                                        type="submit"
                                        className="h-9 w-full gap-1.5"
                                        disabled={mappingForm.processing}
                                    >
                                        <Plus className="h-4 w-4" />{' '}
                                        {t(
                                            'integrations.assignBtn',
                                            'Biriktirish',
                                        )}
                                    </Button>
                                </div>
                            </form>
                        ) : (
                            <div className="bg-muted/40 border-border/80 text-muted-foreground flex items-center gap-2 rounded-xl border p-4 text-xs">
                                <Info className="text-primary h-4 w-4 shrink-0" />
                                Operatorlarni biriktirish uchun avval yuqorida
                                MoySklad integratsiyasini faollashtiring.
                            </div>
                        )}

                        {moyMappings.length > 0 ? (
                            <div className="border-border mt-4 overflow-hidden rounded-xl border">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-muted/50 border-border text-muted-foreground border-b font-medium uppercase">
                                        <tr>
                                            <th className="w-10 px-4 py-2.5 text-center">
                                                №
                                            </th>
                                            <th className="px-4 py-2.5">
                                                Agent1Call Operatori
                                            </th>
                                            <th className="px-4 py-2.5">
                                                MoySklad Login / UID
                                            </th>
                                            <th className="px-4 py-2.5">
                                                MoySklad Xodim Ismi
                                            </th>
                                            <th className="px-4 py-2.5 text-right">
                                                Holati
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-border divide-y">
                                        {moyMappings.map((m, idx) => (
                                            <tr
                                                key={m.id}
                                                className="hover:bg-muted/30 transition-colors"
                                            >
                                                <td className="text-muted-foreground px-4 py-2.5 text-center font-mono">
                                                    {idx + 1}
                                                </td>
                                                <td className="text-foreground px-4 py-2.5 font-semibold">
                                                    {m.user?.name ||
                                                        `Operator #${m.user_id}`}
                                                </td>
                                                <td className="px-4 py-2.5 font-mono font-semibold text-orange-600 dark:text-orange-400">
                                                    {m.external_user_id}
                                                </td>
                                                <td className="text-muted-foreground px-4 py-2.5">
                                                    {m.external_user_name ||
                                                        '—'}
                                                </td>
                                                <td className="px-4 py-2.5 text-right">
                                                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                                                        <Check className="h-3 w-3" />{' '}
                                                        Ulangan
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            moySklad?.is_active && (
                                <p className="text-muted-foreground py-3 text-center text-xs">
                                    Hozircha MoySklad uchun biriktirilgan
                                    operatorlar mavjud emas. Yuqoridagi formadan
                                    qo'shing.
                                </p>
                            )
                        )}
                    </div>

                    {/* MoySklad Sync Logs */}
                    <div className="bg-card border-border overflow-hidden rounded-2xl border shadow-xs">
                        <div className="border-border flex items-center justify-between border-b p-5">
                            <h3 className="flex items-center gap-2 text-base font-semibold">
                                <Activity className="text-primary h-4 w-4" />{' '}
                                MoySklad Sinxronizatsiya loglari
                            </h3>
                            <span className="text-muted-foreground font-mono text-xs">
                                {moyLogs.length} ta yozuv
                            </span>
                        </div>

                        <table className="w-full text-left text-sm">
                            <thead className="bg-muted/50 border-border text-muted-foreground border-b text-xs font-medium uppercase">
                                <tr>
                                    <th className="w-10 px-4 py-3 text-center">
                                        №
                                    </th>
                                    <th className="px-4 py-3">Qo'ng'iroq ID</th>
                                    <th className="px-4 py-3">Holati</th>
                                    <th className="px-4 py-3">
                                        Xabar / Tafsilot
                                    </th>
                                    <th className="px-4 py-3 text-right">
                                        Vaqt
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-border divide-y text-xs">
                                {moyLogs.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="text-muted-foreground py-6 text-center"
                                        >
                                            Hozircha MoySklad bo'yicha hech
                                            qanday sinxronizatsiya logi mavjud
                                            emas.
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedMoyLogs.map((log, idx) => (
                                        <tr
                                            key={log.id}
                                            className="hover:bg-muted/30 transition-colors"
                                        >
                                            <td className="text-muted-foreground px-4 py-3 text-center font-mono text-xs">
                                                {(moyLogPage - 1) *
                                                    (moyPerPage === 'all'
                                                        ? moyLogs.length
                                                        : Number(moyPerPage)) +
                                                    idx +
                                                    1}
                                            </td>
                                            <td className="text-primary px-4 py-3 font-mono font-semibold">
                                                #{log.call_id || '—'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`rounded-full px-2.5 py-0.5 font-semibold ${
                                                        log.status === 'success'
                                                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                                            : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'
                                                    }`}
                                                >
                                                    {log.status === 'success'
                                                        ? 'Muvaffaqiyatli'
                                                        : log.status}
                                                </span>
                                            </td>
                                            <td className="text-muted-foreground px-4 py-3 font-mono">
                                                {log.error_message ||
                                                    "MoySklad ga qo'ng'iroq yuborildi"}
                                            </td>
                                            <td className="text-muted-foreground px-4 py-3 text-right font-mono">
                                                {formatLogTime(log.created_at)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>

                        <div className="border-border text-muted-foreground flex flex-col items-center justify-between gap-3 border-t p-3 text-xs sm:flex-row">
                            <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-start">
                                <span>
                                    Jami:{' '}
                                    <strong className="text-foreground font-mono">
                                        {moyLogs.length}
                                    </strong>{' '}
                                    ta yozuv{' '}
                                    {moyPerPage !== 'all' && moyTotalPages > 1
                                        ? `(${moyLogPage} / ${moyTotalPages}-sahifa)`
                                        : ''}
                                </span>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-muted-foreground/80 text-[11px] font-medium">
                                        Qatorlar:
                                    </span>
                                    <div className="border-border/80 bg-muted/40 inline-flex rounded-lg border p-0.5 shadow-2xs">
                                        {(
                                            ['10', '30', '50', 'all'] as const
                                        ).map((opt) => (
                                            <button
                                                key={opt}
                                                type="button"
                                                onClick={() => {
                                                    setMoyPerPage(opt);
                                                    setMoyLogPage(1);
                                                }}
                                                className={`rounded-md px-2 py-0.5 text-[11px] font-semibold transition-all ${
                                                    moyPerPage === opt
                                                        ? 'bg-background text-foreground font-bold shadow-xs'
                                                        : 'text-muted-foreground hover:text-foreground'
                                                }`}
                                            >
                                                {opt === 'all' ? 'All' : opt}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {moyTotalPages > 1 && (
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 px-2.5 text-xs"
                                        disabled={moyLogPage <= 1}
                                        onClick={() =>
                                            setMoyLogPage((p) =>
                                                Math.max(1, p - 1),
                                            )
                                        }
                                    >
                                        « Oldingi
                                    </Button>
                                    <span className="px-2 font-mono text-xs">
                                        {moyLogPage} / {moyTotalPages}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 px-2.5 text-xs"
                                        disabled={moyLogPage >= moyTotalPages}
                                        onClick={() =>
                                            setMoyLogPage((p) =>
                                                Math.min(moyTotalPages, p + 1),
                                            )
                                        }
                                    >
                                        Keyingi »
                                    </Button>
                                </div>
                            )}
                        </div>

                        <div className="border-border text-muted-foreground flex flex-col items-center justify-between gap-3 border-t p-3 text-xs sm:flex-row">
                            <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-start">
                                <span>
                                    Jami:{' '}
                                    <strong className="text-foreground font-mono">
                                        {amoLogs.length}
                                    </strong>{' '}
                                    ta yozuv{' '}
                                    {amoPerPage !== 'all' && amoTotalPages > 1
                                        ? `(${amoLogPage} / ${amoTotalPages}-sahifa)`
                                        : ''}
                                </span>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-muted-foreground/80 text-[11px] font-medium">
                                        Qatorlar:
                                    </span>
                                    <div className="border-border/80 bg-muted/40 inline-flex rounded-lg border p-0.5 shadow-2xs">
                                        {(
                                            ['10', '30', '50', 'all'] as const
                                        ).map((opt) => (
                                            <button
                                                key={opt}
                                                type="button"
                                                onClick={() => {
                                                    setAmoPerPage(opt);
                                                    setAmoLogPage(1);
                                                }}
                                                className={`rounded-md px-2 py-0.5 text-[11px] font-semibold transition-all ${
                                                    amoPerPage === opt
                                                        ? 'bg-background text-foreground font-bold shadow-xs'
                                                        : 'text-muted-foreground hover:text-foreground'
                                                }`}
                                            >
                                                {opt === 'all' ? 'All' : opt}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {amoTotalPages > 1 && (
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 px-2.5 text-xs"
                                        disabled={amoLogPage <= 1}
                                        onClick={() =>
                                            setAmoLogPage((p) =>
                                                Math.max(1, p - 1),
                                            )
                                        }
                                    >
                                        « Oldingi
                                    </Button>
                                    <span className="px-2 font-mono text-xs">
                                        {amoLogPage} / {amoTotalPages}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 px-2.5 text-xs"
                                        disabled={amoLogPage >= amoTotalPages}
                                        onClick={() =>
                                            setAmoLogPage((p) =>
                                                Math.min(amoTotalPages, p + 1),
                                            )
                                        }
                                    >
                                        Keyingi »
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function IntegrationsIndex(props: IntegrationsProps) {
    return (
        <IntegrationsErrorBoundary>
            <IntegrationsContent {...props} />
        </IntegrationsErrorBoundary>
    );
}
