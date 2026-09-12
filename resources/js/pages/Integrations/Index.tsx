import React, { Component, ErrorInfo, ReactNode, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Head, useForm, router } from "@inertiajs/react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AmoCrmLogo, MoySkladLogo } from "@/components/brand-logos";
import { cn } from "@/lib/utils";
import { formatLogTime } from "@/lib/datetime";

interface IntegrationsProps {
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

class IntegrationsErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; errorText: string }> {
    constructor(props: { children: ReactNode }) {
        super(props);
        this.state = { hasError: false, errorText: "" };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, errorText: error?.message || "Noma'lum xatolik yuz berdi" };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Integrations error caught by boundary:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-8 max-w-4xl mx-auto my-12 bg-card border border-destructive/30 rounded-2xl text-center space-y-4 shadow-sm">
                    <div className="w-12 h-12 mx-auto rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
                        <AlertCircle className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold">Sahifani yuklashda xatolik yuz berdi</h3>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                        {this.state.errorText}
                    </p>
                    <Button onClick={() => window.location.reload()} variant="outline" className="gap-2">
                        <RefreshCw className="w-4 h-4" /> Sahifani qayta yuklash
                    </Button>
                </div>
            );
        }
        return this.props.children;
    }
}

function IntegrationsContent({
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
        if (typeof window !== "undefined") {
            const urlParams = new URLSearchParams(window.location.search);
            const tabParam = urlParams.get("tab");
            if (tabParam === "moysklad" || tabParam === "amocrm") {
                return tabParam;
            }
            if (window.location.hash === "#moysklad") return "moysklad";
        }
        return "amocrm";
    });

    const [copiedRedirectUrl, setCopiedRedirectUrl] = useState(false);

    const handleTabChange = (tab: 'amocrm' | 'moysklad') => {
        setActiveTab(tab);
        if (typeof window !== "undefined") {
            const url = new URL(window.location.href);
            url.searchParams.set("tab", tab);
            window.history.replaceState({}, "", url.toString());
        }
    };

    // amoCRM Form
    const amoForm = useForm({
        subdomain: amoCrm?.subdomain || "",
        client_id: "",
        client_secret: "",
        create_task_on_missed: amoCrm?.settings?.create_task_on_missed ?? true,
    });

    // MoySklad Form
    const moyForm = useForm({
        login: moySklad?.login || "",
        password: "",
        token: "",
    });

    // User Mapping Form
    const mappingForm = useForm({
        tenant_integration_id: "",
        user_id: safeOperators[0]?.id ? String(safeOperators[0].id) : "",
        external_user_id: "",
        external_user_name: "",
    });

    // Update integration ID whenever tab or connections change
    useEffect(() => {
        if (activeTab === "amocrm") {
            mappingForm.setData("tenant_integration_id", amoCrm?.id ? String(amoCrm.id) : "");
        } else {
            mappingForm.setData("tenant_integration_id", moySklad?.id ? String(moySklad.id) : "");
        }
    }, [activeTab, amoCrm?.id, moySklad?.id]);

    const submitAmo = (e: React.FormEvent) => {
        e.preventDefault();
        amoForm.post("/integrations/amocrm");
    };

    const submitMoy = (e: React.FormEvent) => {
        e.preventDefault();
        if (!moyForm.data.token && (!moyForm.data.login || !moyForm.data.password)) {
            alert(t("integrations.enterTokenOrCredentials", "Iltimos, MoySklad API tokenini yoki Login va Parolni kiriting."));
            return;
        }
        moyForm.post("/integrations/moysklad");
    };

    const disconnectAmo = () => {
        if (confirm(t("integrations.disconnectConfirmAmo", "Haqiqatan ham amoCRM integratsiyasini uzmoqchimisiz?"))) {
            router.delete("/integrations/amocrm");
        }
    };

    const disconnectMoy = () => {
        if (confirm(t("integrations.disconnectConfirmMoy", "Haqiqatan ham MoySklad integratsiyasini uzmoqchimisiz?"))) {
            router.delete("/integrations/moysklad");
        }
    };

    const submitMapping = (e: React.FormEvent) => {
        e.preventDefault();
        mappingForm.post("/integrations/user-mapping", {
            onSuccess: () => {
                mappingForm.reset("external_user_id", "external_user_name");
            },
        });
    };

    const redirectUri = typeof window !== "undefined"
        ? `${window.location.origin}/api/v1/integrations/amocrm/callback`
        : "https://agent.1call.uz/api/v1/integrations/amocrm/callback";

    const copyRedirectUri = () => {
        navigator.clipboard.writeText(redirectUri);
        setCopiedRedirectUrl(true);
        setTimeout(() => setCopiedRedirectUrl(false), 2000);
    };



    // Filter mappings and logs for active tab
    const amoMappings = safeMappings.filter((m) => amoCrm?.id && m.tenant_integration_id === amoCrm.id);
    const moyMappings = safeMappings.filter((m) => moySklad?.id && m.tenant_integration_id === moySklad.id);

    const amoLogs = safeLogs.filter((l) => l.crm_type?.toLowerCase() === "amocrm");
    const moyLogs = safeLogs.filter((l) => l.crm_type?.toLowerCase() === "moysklad");

    const [amoLogPage, setAmoLogPage] = useState(1);
    const [amoPerPage, setAmoPerPage] = useState<"10" | "30" | "50" | "all">("10");
    const amoPageSize = amoPerPage === "all" ? Math.max(1, amoLogs.length) : Number(amoPerPage);
    const amoTotalPages = amoPerPage === "all" ? 1 : Math.ceil(amoLogs.length / amoPageSize) || 1;
    const paginatedAmoLogs = amoPerPage === "all" ? amoLogs : amoLogs.slice((amoLogPage - 1) * amoPageSize, amoLogPage * amoPageSize);

    const [moyLogPage, setMoyLogPage] = useState(1);
    const [moyPerPage, setMoyPerPage] = useState<"10" | "30" | "50" | "all">("10");
    const moyPageSize = moyPerPage === "all" ? Math.max(1, moyLogs.length) : Number(moyPerPage);
    const moyTotalPages = moyPerPage === "all" ? 1 : Math.ceil(moyLogs.length / moyPageSize) || 1;
    const paginatedMoyLogs = moyPerPage === "all" ? moyLogs : moyLogs.slice((moyLogPage - 1) * moyPageSize, moyLogPage * moyPageSize);

    return (
        <div className="p-6 space-y-8 max-w-6xl mx-auto">
            <Head title={t("integrations.title", "CRM Integratsiyalari (amoCRM & MoySklad)")} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">{t("integrations.title", "CRM & ERP Integratsiyalari")}</h2>
                    <p className="text-sm text-muted-foreground">
                        {t("integrations.subtitle", "Telefoniya qo'ng'iroqlari va audio yozuvlarini amoCRM va MoySklad tizimlari bilan avtomatik sinxronlash")}
                    </p>
                </div>
            </div>

            {/* 2 Tabs: amoCRM and MoySklad */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/80 pb-4">
                <div className="inline-flex p-1.5 bg-muted/60 dark:bg-muted/30 border border-border/80 rounded-2xl gap-2 shadow-xs">
                    {/* amoCRM Tab Button */}
                    <button
                        type="button"
                        onClick={() => handleTabChange("amocrm")}
                        className={cn(
                            "flex items-center gap-3 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer",
                            activeTab === "amocrm"
                                ? "bg-card text-foreground shadow-xs border border-border/70"
                                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                        )}
                    >
                        <div className="p-1.5 bg-blue-500/10 rounded-lg flex items-center justify-center">
                            <AmoCrmLogo className="h-5" />
                        </div>
                        <span className="font-bold">amoCRM</span>
                        {amoCrm?.is_active ? (
                            <span className="inline-flex items-center gap-1.5 text-[11px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-full font-medium">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                {t("integrations.connected", "Ulangan")}
                            </span>
                        ) : (
                            <span className="text-[11px] bg-secondary text-muted-foreground px-2 py-0.5 rounded-full font-medium">
                                {t("integrations.notConnected", "Ulanmagan")}
                            </span>
                        )}
                    </button>

                    {/* MoySklad Tab Button */}
                    <button
                        type="button"
                        onClick={() => handleTabChange("moysklad")}
                        className={cn(
                            "flex items-center gap-3 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer",
                            activeTab === "moysklad"
                                ? "bg-card text-foreground shadow-xs border border-border/70"
                                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                        )}
                    >
                        <div className="p-1.5 bg-orange-500/10 rounded-lg flex items-center justify-center">
                            <MoySkladLogo className="h-5" />
                        </div>
                        <span className="font-bold">MoySklad (МойСклад)</span>
                        {moySklad?.is_active ? (
                            <span className="inline-flex items-center gap-1.5 text-[11px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-full font-medium">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                {t("integrations.connected", "Ulangan")}
                            </span>
                        ) : (
                            <span className="text-[11px] bg-secondary text-muted-foreground px-2 py-0.5 rounded-full font-medium">
                                {t("integrations.notConnected", "Ulanmagan")}
                            </span>
                        )}
                    </button>
                </div>

                <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Activity className="h-3.5 w-3.5 text-primary" />
                    <span>{activeTab === "amocrm" ? "amoCRM API v4 & Webhooks" : "MoySklad Phone API 1.0"}</span>
                </div>
            </div>

            {/* TAB 1: amoCRM */}
            {activeTab === "amocrm" && (
                <div className="space-y-8">
                    {/* amoCRM Integration Card */}
                    <div className="bg-card rounded-2xl border border-border shadow-xs overflow-hidden">
                        <div className="p-6 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="flex items-center gap-3.5">
                                <div className="p-2.5 bg-blue-500/10 rounded-2xl">
                                    <AmoCrmLogo className="h-8" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold flex items-center gap-2">
                                        amoCRM Integratsiyasi
                                        {amoCrm?.is_active ? (
                                            <span className="flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 px-2.5 py-0.5 rounded-full font-semibold">
                                                <CheckCircle2 className="h-3.5 w-3.5" /> {t("integrations.connected", "Ulangan")}
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-xs bg-secondary text-muted-foreground px-2.5 py-0.5 rounded-full font-medium">
                                                <XCircle className="h-3.5 w-3.5" /> {t("integrations.notConnected", "Ulanmagan")}
                                            </span>
                                        )}
                                    </h3>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {t("integrations.amoDesc", "Leadlar, kontaktlar, qo'ng'iroq kartochkalari va audio yozuvlarini amoCRM bilan to'liq sinxronlashtirish.")}
                                    </p>
                                </div>
                            </div>

                            {amoCrm?.is_active && (
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    onClick={disconnectAmo}
                                    className="gap-1.5 h-9 text-xs self-start sm:self-auto cursor-pointer"
                                >
                                    <Unlink className="h-3.5 w-3.5" /> {t("integrations.disconnectIntegration", "Integratsiyani uzish")}
                                </Button>
                            )}
                        </div>

                        {amoCrm?.is_active ? (
                            <div className="p-6 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="p-4 rounded-xl bg-secondary/30 border border-border/60 space-y-1">
                                        <span className="text-xs text-muted-foreground font-medium">Ulangan amoCRM Subdomain:</span>
                                        <div className="font-mono font-bold text-sm text-foreground flex items-center gap-1.5">
                                            <a
                                                href={`https://${amoCrm.subdomain}.amocrm.ru`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-primary hover:underline flex items-center gap-1"
                                            >
                                                {amoCrm.subdomain}.amocrm.ru
                                                <ExternalLink className="h-3 w-3" />
                                            </a>
                                        </div>
                                    </div>

                                    <div className="p-4 rounded-xl bg-secondary/30 border border-border/60 space-y-1">
                                        <span className="text-xs text-muted-foreground font-medium">Avtomatik vazifa yaratish:</span>
                                        <div className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                                            {amoCrm.settings?.create_task_on_missed ? (
                                                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                                    <CheckCircle2 className="h-3.5 w-3.5" /> Javobsizlarda vazifa ochiladi
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground">Nofaol</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="p-4 rounded-xl bg-secondary/30 border border-border/60 space-y-1">
                                        <span className="text-xs text-muted-foreground font-medium">Audio yozuvlar va Player:</span>
                                        <div className="font-semibold text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                            <ShieldCheck className="h-3.5 w-3.5" /> HMAC Token bilan himoyalangan
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
                                {/* Form Left */}
                                <form onSubmit={submitAmo} className="lg:col-span-7 space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold">
                                            {t("integrations.amoSubdomainLabel", "Subdomain (kompaniya): *")}
                                        </label>
                                        <div className="flex items-center rounded-md border border-input bg-background focus-within:ring-1 focus-within:ring-primary overflow-hidden">
                                            <Input
                                                placeholder={t("integrations.amoSubdomainPlaceholder", "mycompany")}
                                                value={amoForm.data.subdomain}
                                                onChange={(e) => amoForm.setData("subdomain", e.target.value)}
                                                className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
                                                required
                                            />
                                            <span className="px-3 text-xs text-muted-foreground bg-muted/40 border-l border-border h-full flex items-center font-mono select-none">
                                                .amocrm.ru
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold">
                                            {t("integrations.amoClientIdLabel", "Integratsiya ID (Client ID): *")}
                                        </label>
                                        <Input
                                            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                                            value={amoForm.data.client_id}
                                            onChange={(e) => amoForm.setData("client_id", e.target.value)}
                                            required
                                            className="font-mono text-xs"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold">
                                            {t("integrations.amoClientSecretLabel", "Maxfiy kalit (Client Secret): *")}
                                        </label>
                                        <Input
                                            type="password"
                                            placeholder="••••••••••••••••••••••••"
                                            value={amoForm.data.client_secret}
                                            onChange={(e) => amoForm.setData("client_secret", e.target.value)}
                                            required
                                            className="font-mono text-xs"
                                        />
                                    </div>

                                    <div className="flex items-center gap-2 pt-2">
                                        <input
                                            type="checkbox"
                                            id="taskOnMissed"
                                            checked={amoForm.data.create_task_on_missed}
                                            onChange={(e) => amoForm.setData("create_task_on_missed", e.target.checked)}
                                            className="rounded text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                                        />
                                        <label htmlFor="taskOnMissed" className="text-xs cursor-pointer select-none font-medium">
                                            {t("integrations.amoCreateTaskOnMissed", "Javobsiz qo'ng'iroqlarda avtomatik vazifa (task) yaratish")}
                                        </label>
                                    </div>

                                    <Button type="submit" className="w-full gap-2 h-10 mt-2" disabled={amoForm.processing}>
                                        <AmoCrmLogo className="h-4" />
                                        {amoForm.processing ? t("billing.loading", "Yuklanmoqda...") : t("integrations.amoConnectBtn", "amoCRM bilan ulash (OAuth2)")}
                                    </Button>
                                </form>

                                {/* Instruction Guide Right */}
                                <div className="lg:col-span-5 bg-muted/30 border border-border/80 rounded-xl p-5 space-y-4 text-xs">
                                    <div className="font-bold text-sm flex items-center gap-2 text-foreground">
                                        <HelpCircle className="h-4 w-4 text-primary" /> amoCRM ulanish bo'yicha qo'llanma
                                    </div>

                                    <ol className="space-y-3 list-decimal list-inside text-muted-foreground leading-relaxed">
                                        <li>
                                            amoCRM hisobingizga kiring va <span className="font-semibold text-foreground">Sozlamalar &rarr; Integratsiyalar</span> sahifasiga o'ting.
                                        </li>
                                        <li>
                                            <span className="font-semibold text-foreground">"Yangi integratsiya yaratish"</span> tugmasini bosing.
                                        </li>
                                        <li>
                                            <div className="mt-1">
                                                <span className="font-semibold text-foreground">Qayta yo'naltirish URL (Redirect URI):</span>
                                                <div className="mt-1 flex items-center gap-1.5 p-1.5 bg-background border border-border rounded-lg font-mono text-[11px] text-foreground">
                                                    <span className="truncate flex-1 select-all">{redirectUri}</span>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={copyRedirectUri}
                                                        className="h-6 px-2 text-[10px] gap-1 cursor-pointer"
                                                    >
                                                        {copiedRedirectUrl ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                                                        {copiedRedirectUrl ? "Nusxalandi" : "Nusxa olish"}
                                                    </Button>
                                                </div>
                                            </div>
                                        </li>
                                        <li>
                                            Ruxsatnomalar (Permissions) bo'limida <span className="font-semibold text-foreground">Qo'ng'iroqlar, Kontaktlar, Bitimlar (Leads)</span> ga to'liq ruxsat bering.
                                        </li>
                                        <li>
                                            Integratsiyani saqlang va berilgan <span className="font-semibold text-foreground">Client ID</span> hamda <span className="font-semibold text-foreground">Client Secret</span> ni chapdagi maydonlarga kiriting.
                                        </li>
                                    </ol>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* amoCRM User Mapping Section */}
                    <div className="bg-card rounded-2xl border border-border shadow-xs overflow-hidden space-y-4 p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border pb-4">
                            <div>
                                <h3 className="font-semibold text-base flex items-center gap-2">
                                    <Users className="h-4 w-4 text-primary" /> amoCRM operatorlarini biriktirish (User Mapping)
                                </h3>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    1Call operatorlarini amoCRM xodimlariga biriktiring, shunda qo'ng'iroqlar ularning nomidan avtomatik saqlanadi.
                                </p>
                            </div>
                            {amoCrm?.is_active && (
                                <span className="text-xs bg-blue-500/10 text-primary font-medium px-3 py-1 rounded-full">
                                    Biriktirilgan: {amoMappings.length} ta operator
                                </span>
                            )}
                        </div>

                        {amoCrm?.is_active ? (
                            <form onSubmit={submitMapping} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end pt-2">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold">1Call Operatori: *</label>
                                    <select
                                        value={mappingForm.data.user_id}
                                        onChange={(e) => mappingForm.setData("user_id", e.target.value)}
                                        className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
                                        required
                                    >
                                        <option value="">{t("integrations.selectPlaceholder", "Tanlang...")}</option>
                                        {safeOperators.map((op) => (
                                            <option key={op.id} value={String(op.id)}>
                                                {op.name} {op.phone_number ? `(${op.phone_number})` : ""}
                                            </option>
                                        ))}
                                        {safeOperators.length === 0 && <option value="" disabled>Operatorlar mavjud emas</option>}
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-semibold">amoCRM Foydalanuvchi ID (User ID): *</label>
                                    <Input
                                        placeholder="Masalan: 8945612"
                                        value={mappingForm.data.external_user_id}
                                        onChange={(e) => mappingForm.setData("external_user_id", e.target.value)}
                                        required
                                        className="font-mono text-xs"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-semibold">amoCRM Xodim Ismi (ixtiyoriy):</label>
                                    <Input
                                        placeholder="Masalan: Nodirbek"
                                        value={mappingForm.data.external_user_name}
                                        onChange={(e) => mappingForm.setData("external_user_name", e.target.value)}
                                        className="text-xs"
                                    />
                                </div>

                                <div>
                                    <Button type="submit" className="w-full h-9 gap-1.5" disabled={mappingForm.processing}>
                                        <Plus className="h-4 w-4" /> {t("integrations.assignBtn", "Biriktirish")}
                                    </Button>
                                </div>
                            </form>
                        ) : (
                            <div className="p-4 rounded-xl bg-muted/40 border border-border/80 text-xs text-muted-foreground flex items-center gap-2">
                                <Info className="h-4 w-4 text-primary shrink-0" />
                                Operatorlarni biriktirish uchun avval yuqorida amoCRM integratsiyasini faollashtiring.
                            </div>
                        )}

                        {amoMappings.length > 0 ? (
                            <div className="border border-border rounded-xl overflow-hidden mt-4">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase font-medium">
                                        <tr>
                                            <th className="py-2.5 px-4 w-10 text-center">№</th>
                                            <th className="py-2.5 px-4">1Call Operatori</th>
                                            <th className="py-2.5 px-4">amoCRM User ID</th>
                                            <th className="py-2.5 px-4">amoCRM Xodim Ismi</th>
                                            <th className="py-2.5 px-4 text-right">Holati</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {amoMappings.map((m, idx) => (
                                            <tr key={m.id} className="hover:bg-muted/30 transition-colors">
                                                <td className="py-2.5 px-4 text-center font-mono text-muted-foreground">{idx + 1}</td>
                                                <td className="py-2.5 px-4 font-semibold text-foreground">
                                                    {m.user?.name || `Operator #${m.user_id}`}
                                                </td>
                                                <td className="py-2.5 px-4 font-mono text-primary font-semibold">
                                                    {m.external_user_id}
                                                </td>
                                                <td className="py-2.5 px-4 text-muted-foreground">
                                                    {m.external_user_name || "—"}
                                                </td>
                                                <td className="py-2.5 px-4 text-right">
                                                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                                                        <Check className="h-3 w-3" /> Ulangan
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            amoCrm?.is_active && (
                                <p className="text-xs text-muted-foreground py-3 text-center">
                                    Hozircha amoCRM uchun biriktirilgan operatorlar mavjud emas. Yuqoridagi formadan qo'shing.
                                </p>
                            )
                        )}
                    </div>

                    {/* amoCRM Sync Logs */}
                    <div className="bg-card rounded-2xl border border-border shadow-xs overflow-hidden">
                        <div className="p-5 border-b border-border flex items-center justify-between">
                            <h3 className="font-semibold text-base flex items-center gap-2">
                                <Activity className="h-4 w-4 text-primary" /> amoCRM Sinxronizatsiya loglari
                            </h3>
                            <span className="text-xs text-muted-foreground font-mono">
                                {amoLogs.length} ta yozuv
                            </span>
                        </div>

                        <table className="w-full text-left text-sm">
                            <thead className="bg-muted/50 border-b border-border text-muted-foreground text-xs uppercase font-medium">
                                <tr>
                                    <th className="py-3 px-4 w-10 text-center">№</th>
                                    <th className="py-3 px-4">Qo'ng'iroq ID</th>
                                    <th className="py-3 px-4">Holati</th>
                                    <th className="py-3 px-4">Xabar / Tafsilot</th>
                                    <th className="py-3 px-4 text-right">Vaqt</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border text-xs">
                                {amoLogs.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-6 text-center text-muted-foreground">
                                            Hozircha amoCRM bo'yicha hech qanday sinxronizatsiya logi mavjud emas.
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedAmoLogs.map((log, idx) => (
                                        <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="py-3 px-4 text-center font-mono text-xs text-muted-foreground">
                                                {((amoLogPage - 1) * (amoPerPage === 'all' ? amoLogs.length : Number(amoPerPage))) + idx + 1}
                                            </td>
                                            <td className="py-3 px-4 font-mono font-semibold text-primary">
                                                #{log.call_id || "—"}
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`px-2.5 py-0.5 rounded-full font-semibold ${
                                                    log.status === "success"
                                                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                                                        : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
                                                }`}>
                                                    {log.status === "success" ? "Muvaffaqiyatli" : log.status}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-muted-foreground font-mono">
                                                {log.error_message || "amoCRM ga qo'ng'iroq va audio yuborildi"}
                                            </td>
                                            <td className="py-3 px-4 text-right text-muted-foreground font-mono">
                                                {formatLogTime(log.created_at)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>

                        <div className="p-3 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
                            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                                <span>Jami: <strong className="text-foreground font-mono">{amoLogs.length}</strong> ta yozuv {amoPerPage !== 'all' && amoTotalPages > 1 ? `(${amoLogPage} / ${amoTotalPages}-sahifa)` : ''}</span>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[11px] font-medium text-muted-foreground/80">Qatorlar:</span>
                                    <div className="inline-flex rounded-lg border border-border/80 p-0.5 bg-muted/40 shadow-2xs">
                                        {(['10', '30', '50', 'all'] as const).map((opt) => (
                                            <button
                                                key={opt}
                                                type="button"
                                                onClick={() => {
                                                    setAmoPerPage(opt);
                                                    setAmoLogPage(1);
                                                }}
                                                className={`px-2 py-0.5 text-[11px] font-semibold rounded-md transition-all ${
                                                    amoPerPage === opt
                                                        ? 'bg-background text-foreground shadow-xs font-bold'
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
                                        onClick={() => setAmoLogPage((p) => Math.max(1, p - 1))}
                                    >
                                        « Oldingi
                                    </Button>
                                    <span className="px-2 text-xs font-mono">{amoLogPage} / {amoTotalPages}</span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 px-2.5 text-xs"
                                        disabled={amoLogPage >= amoTotalPages}
                                        onClick={() => setAmoLogPage((p) => Math.min(amoTotalPages, p + 1))}
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
            {activeTab === "moysklad" && (
                <div className="space-y-8">
                    {/* MoySklad Integration Card */}
                    <div className="bg-card rounded-2xl border border-border shadow-xs overflow-hidden">
                        <div className="p-6 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="flex items-center gap-3.5">
                                <div className="p-2.5 bg-orange-500/10 rounded-2xl">
                                    <MoySkladLogo className="h-8" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold flex items-center gap-2">
                                        MoySklad (МойСклад) Integratsiyasi
                                        {moySklad?.is_active ? (
                                            <span className="flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 px-2.5 py-0.5 rounded-full font-semibold">
                                                <CheckCircle2 className="h-3.5 w-3.5" /> {t("integrations.connected", "Ulangan")}
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-xs bg-secondary text-muted-foreground px-2.5 py-0.5 rounded-full font-medium">
                                                <XCircle className="h-3.5 w-3.5" /> {t("integrations.notConnected", "Ulanmagan")}
                                            </span>
                                        )}
                                    </h3>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {t("integrations.moyDesc", "Phone API 1.0, mijozlar (kontragentlar) kartasi, yangi qo'ng'iroqlarda bildirishnomalar va audio fayllar.")}
                                    </p>
                                </div>
                            </div>

                            {moySklad?.is_active && (
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    onClick={disconnectMoy}
                                    className="gap-1.5 h-9 text-xs self-start sm:self-auto cursor-pointer"
                                >
                                    <Unlink className="h-3.5 w-3.5" /> {t("integrations.disconnectIntegration", "Integratsiyani uzish")}
                                </Button>
                            )}
                        </div>

                        {moySklad?.is_active ? (
                            <div className="p-6 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="p-4 rounded-xl bg-secondary/30 border border-border/60 space-y-1">
                                        <span className="text-xs text-muted-foreground font-medium">Ulangan MoySklad hisobi:</span>
                                        <div className="font-mono font-bold text-sm text-foreground flex items-center gap-1.5">
                                            <span className="text-primary">
                                                {moySklad.login || "MoySklad API Token orqali ulangan"}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="p-4 rounded-xl bg-secondary/30 border border-border/60 space-y-1">
                                        <span className="text-xs text-muted-foreground font-medium">Integratsiya protokoli:</span>
                                        <div className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                                            <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                                <CheckCircle2 className="h-3.5 w-3.5" /> MoySklad Phone API 1.0
                                            </span>
                                        </div>
                                    </div>

                                    <div className="p-4 rounded-xl bg-secondary/30 border border-border/60 space-y-1">
                                        <span className="text-xs text-muted-foreground font-medium">Sinxronlash holati:</span>
                                        <div className="font-semibold text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                            <ShieldCheck className="h-3.5 w-3.5" /> Avtomatik faol
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
                                {/* Form Left */}
                                <form onSubmit={submitMoy} className="lg:col-span-7 space-y-4">
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-semibold flex items-center gap-1.5">
                                                <Key className="h-3.5 w-3.5 text-primary" /> MoySklad API Access Token (Tavsiya etiladi):
                                            </label>
                                            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Eng xavfsiz</span>
                                        </div>
                                        <Input
                                            placeholder={t("integrations.moyTokenPlaceholder", "Masalan: d83f8b05... yoki bearer token")}
                                            value={moyForm.data.token}
                                            onChange={(e) => moyForm.setData("token", e.target.value)}
                                            className="font-mono text-xs"
                                        />
                                    </div>

                                    <div className="relative flex py-2 items-center">
                                        <div className="flex-grow border-t border-border"></div>
                                        <span className="flex-shrink mx-3 text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                                            {t("integrations.orApiToken", "YOKI LOGIN VA PAROL")}
                                        </span>
                                        <div className="flex-grow border-t border-border"></div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold">
                                            {t("integrations.moyLoginLabel", "Login yoki Email:")}
                                        </label>
                                        <Input
                                            placeholder={t("integrations.moyLoginPlaceholder", "admin@company.uz")}
                                            value={moyForm.data.login}
                                            onChange={(e) => moyForm.setData("login", e.target.value)}
                                            className="text-sm"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold">
                                            {t("integrations.moyPasswordLabel", "Parol:")}
                                        </label>
                                        <Input
                                            type="password"
                                            placeholder="••••••••••••••••"
                                            value={moyForm.data.password}
                                            onChange={(e) => moyForm.setData("password", e.target.value)}
                                            className="font-mono text-xs"
                                        />
                                    </div>

                                    <Button type="submit" className="w-full gap-2 h-10 mt-2" disabled={moyForm.processing}>
                                        <MoySkladLogo className="h-4" />
                                        {moyForm.processing ? t("billing.loading", "Yuklanmoqda...") : t("integrations.moyConnectBtn", "MoySklad bilan sinab ko'rish va ulash")}
                                    </Button>
                                </form>

                                {/* Instruction Guide Right */}
                                <div className="lg:col-span-5 bg-muted/30 border border-border/80 rounded-xl p-5 space-y-4 text-xs">
                                    <div className="font-bold text-sm flex items-center gap-2 text-foreground">
                                        <HelpCircle className="h-4 w-4 text-primary" /> MoySklad ulanish bo'yicha qo'llanma
                                    </div>

                                    <ol className="space-y-3 list-decimal list-inside text-muted-foreground leading-relaxed">
                                        <li>
                                            MoySklad hisobingizga kiring: <a href="https://online.moysklad.ru" target="_blank" rel="noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">online.moysklad.ru <ExternalLink className="h-2.5 w-2.5" /></a>
                                        </li>
                                        <li>
                                            O'ng yuqori burchakda foydalanuvchi profiliga bosing va <span className="font-semibold text-foreground">"Mening hisobim" (Мой профиль)</span> yoki <span className="font-semibold text-foreground">Sozlamalar &rarr; Xodimlar</span> bo'limiga o'ting.
                                        </li>
                                        <li>
                                            <span className="font-semibold text-foreground">"Xavfsizlik" (Безопасность)</span> sahifasidan <span className="font-semibold text-foreground">"Yangi Token yaratish" (Создать токен)</span> tugmasini bosing.
                                        </li>
                                        <li>
                                            Yaratilgan tokenni nusxalab, chapdagi <span className="font-semibold text-foreground">"API Access Token"</span> maydoniga kiriting.
                                        </li>
                                        <li>
                                            Ulanish muvaffaqiyatli o'rnatilgach, har bir qo'ng'iroq paytida MoySklad mijoz kartasi ochiladi va audio yozuvlar kontragentga yuklanadi.
                                        </li>
                                    </ol>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* MoySklad User Mapping Section */}
                    <div className="bg-card rounded-2xl border border-border shadow-xs overflow-hidden space-y-4 p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border pb-4">
                            <div>
                                <h3 className="font-semibold text-base flex items-center gap-2">
                                    <Users className="h-4 w-4 text-primary" /> MoySklad xodimlarini biriktirish (User Mapping)
                                </h3>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    1Call operatorlarini MoySklad xodimlariga biriktiring, shunda qo'ng'iroqlar kontragent kartasida tegishli xodimga yoziladi.
                                </p>
                            </div>
                            {moySklad?.is_active && (
                                <span className="text-xs bg-orange-500/10 text-orange-600 dark:text-orange-400 font-medium px-3 py-1 rounded-full">
                                    Biriktirilgan: {moyMappings.length} ta operator
                                </span>
                            )}
                        </div>

                        {moySklad?.is_active ? (
                            <form onSubmit={submitMapping} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end pt-2">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold">1Call Operatori: *</label>
                                    <select
                                        value={mappingForm.data.user_id}
                                        onChange={(e) => mappingForm.setData("user_id", e.target.value)}
                                        className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
                                        required
                                    >
                                        <option value="">{t("integrations.selectPlaceholder", "Tanlang...")}</option>
                                        {safeOperators.map((op) => (
                                            <option key={op.id} value={String(op.id)}>
                                                {op.name} {op.phone_number ? `(${op.phone_number})` : ""}
                                            </option>
                                        ))}
                                        {safeOperators.length === 0 && <option value="" disabled>Operatorlar mavjud emas</option>}
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-semibold">MoySklad Xodim Login yoki UID: *</label>
                                    <Input
                                        placeholder="Masalan: admin@company yoki UID"
                                        value={mappingForm.data.external_user_id}
                                        onChange={(e) => mappingForm.setData("external_user_id", e.target.value)}
                                        required
                                        className="font-mono text-xs"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-semibold">MoySklad Xodim Ismi (ixtiyoriy):</label>
                                    <Input
                                        placeholder="Masalan: Sardorbek"
                                        value={mappingForm.data.external_user_name}
                                        onChange={(e) => mappingForm.setData("external_user_name", e.target.value)}
                                        className="text-xs"
                                    />
                                </div>

                                <div>
                                    <Button type="submit" className="w-full h-9 gap-1.5" disabled={mappingForm.processing}>
                                        <Plus className="h-4 w-4" /> {t("integrations.assignBtn", "Biriktirish")}
                                    </Button>
                                </div>
                            </form>
                        ) : (
                            <div className="p-4 rounded-xl bg-muted/40 border border-border/80 text-xs text-muted-foreground flex items-center gap-2">
                                <Info className="h-4 w-4 text-primary shrink-0" />
                                Operatorlarni biriktirish uchun avval yuqorida MoySklad integratsiyasini faollashtiring.
                            </div>
                        )}

                        {moyMappings.length > 0 ? (
                            <div className="border border-border rounded-xl overflow-hidden mt-4">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase font-medium">
                                        <tr>
                                            <th className="py-2.5 px-4 w-10 text-center">№</th>
                                            <th className="py-2.5 px-4">1Call Operatori</th>
                                            <th className="py-2.5 px-4">MoySklad Login / UID</th>
                                            <th className="py-2.5 px-4">MoySklad Xodim Ismi</th>
                                            <th className="py-2.5 px-4 text-right">Holati</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {moyMappings.map((m, idx) => (
                                            <tr key={m.id} className="hover:bg-muted/30 transition-colors">
                                                <td className="py-2.5 px-4 text-center font-mono text-muted-foreground">{idx + 1}</td>
                                                <td className="py-2.5 px-4 font-semibold text-foreground">
                                                    {m.user?.name || `Operator #${m.user_id}`}
                                                </td>
                                                <td className="py-2.5 px-4 font-mono text-orange-600 dark:text-orange-400 font-semibold">
                                                    {m.external_user_id}
                                                </td>
                                                <td className="py-2.5 px-4 text-muted-foreground">
                                                    {m.external_user_name || "—"}
                                                </td>
                                                <td className="py-2.5 px-4 text-right">
                                                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                                                        <Check className="h-3 w-3" /> Ulangan
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            moySklad?.is_active && (
                                <p className="text-xs text-muted-foreground py-3 text-center">
                                    Hozircha MoySklad uchun biriktirilgan operatorlar mavjud emas. Yuqoridagi formadan qo'shing.
                                </p>
                            )
                        )}
                    </div>

                    {/* MoySklad Sync Logs */}
                    <div className="bg-card rounded-2xl border border-border shadow-xs overflow-hidden">
                        <div className="p-5 border-b border-border flex items-center justify-between">
                            <h3 className="font-semibold text-base flex items-center gap-2">
                                <Activity className="h-4 w-4 text-primary" /> MoySklad Sinxronizatsiya loglari
                            </h3>
                            <span className="text-xs text-muted-foreground font-mono">
                                {moyLogs.length} ta yozuv
                            </span>
                        </div>

                        <table className="w-full text-left text-sm">
                            <thead className="bg-muted/50 border-b border-border text-muted-foreground text-xs uppercase font-medium">
                                <tr>
                                    <th className="py-3 px-4 w-10 text-center">№</th>
                                    <th className="py-3 px-4">Qo'ng'iroq ID</th>
                                    <th className="py-3 px-4">Holati</th>
                                    <th className="py-3 px-4">Xabar / Tafsilot</th>
                                    <th className="py-3 px-4 text-right">Vaqt</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border text-xs">
                                {moyLogs.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-6 text-center text-muted-foreground">
                                            Hozircha MoySklad bo'yicha hech qanday sinxronizatsiya logi mavjud emas.
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedMoyLogs.map((log, idx) => (
                                        <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="py-3 px-4 text-center font-mono text-xs text-muted-foreground">
                                                {((moyLogPage - 1) * (moyPerPage === 'all' ? moyLogs.length : Number(moyPerPage))) + idx + 1}
                                            </td>
                                            <td className="py-3 px-4 font-mono font-semibold text-primary">
                                                #{log.call_id || "—"}
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`px-2.5 py-0.5 rounded-full font-semibold ${
                                                    log.status === "success"
                                                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                                                        : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
                                                }`}>
                                                    {log.status === "success" ? "Muvaffaqiyatli" : log.status}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-muted-foreground font-mono">
                                                {log.error_message || "MoySklad ga qo'ng'iroq yuborildi"}
                                            </td>
                                            <td className="py-3 px-4 text-right text-muted-foreground font-mono">
                                                {formatLogTime(log.created_at)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>

                        <div className="p-3 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
                            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                                <span>Jami: <strong className="text-foreground font-mono">{moyLogs.length}</strong> ta yozuv {moyPerPage !== 'all' && moyTotalPages > 1 ? `(${moyLogPage} / ${moyTotalPages}-sahifa)` : ''}</span>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[11px] font-medium text-muted-foreground/80">Qatorlar:</span>
                                    <div className="inline-flex rounded-lg border border-border/80 p-0.5 bg-muted/40 shadow-2xs">
                                        {(['10', '30', '50', 'all'] as const).map((opt) => (
                                            <button
                                                key={opt}
                                                type="button"
                                                onClick={() => {
                                                    setMoyPerPage(opt);
                                                    setMoyLogPage(1);
                                                }}
                                                className={`px-2 py-0.5 text-[11px] font-semibold rounded-md transition-all ${
                                                    moyPerPage === opt
                                                        ? 'bg-background text-foreground shadow-xs font-bold'
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
                                        onClick={() => setMoyLogPage((p) => Math.max(1, p - 1))}
                                    >
                                        « Oldingi
                                    </Button>
                                    <span className="px-2 text-xs font-mono">{moyLogPage} / {moyTotalPages}</span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 px-2.5 text-xs"
                                        disabled={moyLogPage >= moyTotalPages}
                                        onClick={() => setMoyLogPage((p) => Math.min(moyTotalPages, p + 1))}
                                    >
                                        Keyingi »
                                    </Button>
                                </div>
                            )}
                        </div>

                        <div className="p-3 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
                            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                                <span>Jami: <strong className="text-foreground font-mono">{amoLogs.length}</strong> ta yozuv {amoPerPage !== 'all' && amoTotalPages > 1 ? `(${amoLogPage} / ${amoTotalPages}-sahifa)` : ''}</span>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[11px] font-medium text-muted-foreground/80">Qatorlar:</span>
                                    <div className="inline-flex rounded-lg border border-border/80 p-0.5 bg-muted/40 shadow-2xs">
                                        {(['10', '30', '50', 'all'] as const).map((opt) => (
                                            <button
                                                key={opt}
                                                type="button"
                                                onClick={() => {
                                                    setAmoPerPage(opt);
                                                    setAmoLogPage(1);
                                                }}
                                                className={`px-2 py-0.5 text-[11px] font-semibold rounded-md transition-all ${
                                                    amoPerPage === opt
                                                        ? 'bg-background text-foreground shadow-xs font-bold'
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
                                        onClick={() => setAmoLogPage((p) => Math.max(1, p - 1))}
                                    >
                                        « Oldingi
                                    </Button>
                                    <span className="px-2 text-xs font-mono">{amoLogPage} / {amoTotalPages}</span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 px-2.5 text-xs"
                                        disabled={amoLogPage >= amoTotalPages}
                                        onClick={() => setAmoLogPage((p) => Math.min(amoTotalPages, p + 1))}
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
