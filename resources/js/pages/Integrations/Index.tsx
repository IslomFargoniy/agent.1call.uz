import React, { Component, ErrorInfo, ReactNode } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AmoCrmLogo, MoySkladLogo } from "@/components/brand-logos";

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
    const activeIntegration = (amoCrm?.is_active && amoCrm.id) ? amoCrm.id : ((moySklad?.is_active && moySklad.id) ? moySklad.id : "");
    const mappingForm = useForm({
        tenant_integration_id: activeIntegration ? String(activeIntegration) : "",
        user_id: safeOperators[0]?.id ? String(safeOperators[0].id) : "",
        external_user_id: "",
        external_user_name: "",
    });

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

    const formatLogTime = (dateStr?: string) => {
        if (!dateStr) return "—";
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return "—";
            return d.toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
        } catch {
            return String(dateStr);
        }
    };

    return (
        <div className="p-6 space-y-8 max-w-6xl mx-auto">
            <Head title={t("integrations.title", "CRM Integratsiyalari (amoCRM & MoySklad)")} />

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">{t("integrations.title", "CRM & ERP Integratsiyalari")}</h2>
                    <p className="text-sm text-muted-foreground">
                        {t("integrations.subtitle", "Telefoniya qo'ng'iroqlari va audio yozuvlarini amoCRM va MoySklad tizimlari bilan avtomatik sinxronlash")}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* amoCRM Integration Card */}
                <div className="bg-card p-6 rounded-2xl border border-border shadow-xs space-y-5 flex flex-col justify-between">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500/10 rounded-xl">
                                    <AmoCrmLogo className="h-7" />
                                </div>
                            </div>

                            {amoCrm?.is_active ? (
                                <span className="flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 px-2.5 py-1 rounded-full font-semibold">
                                    <CheckCircle2 className="h-3.5 w-3.5" /> {t("integrations.connected", "Ulangan")}
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 text-xs bg-secondary text-muted-foreground px-2.5 py-1 rounded-full font-medium">
                                    <XCircle className="h-3.5 w-3.5" /> {t("integrations.notConnected", "Ulanmagan")}
                                </span>
                            )}
                        </div>

                        <p className="text-xs text-muted-foreground">
                            {t("integrations.amoDesc", "Leadlar, kontaktlar, qo'ng'iroq kartochkalari va audio yozuvlarini amoCRM bilan to'liq sinxronlashtirish.")}
                        </p>

                        {amoCrm?.is_active ? (
                            <div className="bg-secondary/30 rounded-xl p-4 space-y-3 border border-border/60">
                                <div className="text-xs space-y-1">
                                    <span className="text-muted-foreground">{t("integrations.connectedSubdomain", "Ulangan amoCRM Subdomain:")}</span>
                                    <div className="font-mono font-semibold text-sm text-foreground">
                                        {amoCrm.subdomain ? `${amoCrm.subdomain}.amocrm.ru` : t("integrations.connected", "Ulangan")}
                                    </div>
                                </div>

                                <div className="pt-2 border-t border-border/50 flex justify-end">
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="sm"
                                        onClick={disconnectAmo}
                                        className="gap-1.5 h-8 text-xs"
                                    >
                                        <Unlink className="h-3.5 w-3.5" /> {t("integrations.disconnectIntegration", "Integratsiyani uzish")}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={submitAmo} className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold">{t("integrations.amoSubdomainLabel", "Subdomain (masalan: kompaniya):")}</label>
                                    <Input
                                        placeholder={t("integrations.amoSubdomainPlaceholder", "mycompany")}
                                        value={amoForm.data.subdomain}
                                        onChange={(e) => amoForm.setData("subdomain", e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-semibold">{t("integrations.amoClientIdLabel", "Integratsiya ID (Client ID):")}</label>
                                    <Input
                                        placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                                        value={amoForm.data.client_id}
                                        onChange={(e) => amoForm.setData("client_id", e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-semibold">{t("integrations.amoClientSecretLabel", "Maxfiy kalit (Client Secret):")}</label>
                                    <Input
                                        type="password"
                                        placeholder="••••••••••••••••"
                                        value={amoForm.data.client_secret}
                                        onChange={(e) => amoForm.setData("client_secret", e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="flex items-center gap-2 pt-1">
                                    <input
                                        type="checkbox"
                                        id="taskOnMissed"
                                        checked={amoForm.data.create_task_on_missed}
                                        onChange={(e) => amoForm.setData("create_task_on_missed", e.target.checked)}
                                        className="rounded text-primary focus:ring-primary h-4 w-4"
                                    />
                                    <label htmlFor="taskOnMissed" className="text-xs">
                                        {t("integrations.amoCreateTaskOnMissed", "Javobsiz qo'ng'iroqlarda avtomatik vazifa yaratish")}
                                    </label>
                                </div>

                                <Button type="submit" className="w-full" disabled={amoForm.processing}>
                                    {amoForm.processing ? t("billing.loading", "Yuklanmoqda...") : t("integrations.amoConnectBtn", "amoCRM bilan ulash (OAuth2)")}
                                </Button>
                            </form>
                        )}
                    </div>
                </div>

                {/* MoySklad Integration Card */}
                <div className="bg-card p-6 rounded-2xl border border-border shadow-xs space-y-5 flex flex-col justify-between">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-orange-500/10 rounded-xl">
                                    <MoySkladLogo className="h-7" />
                                </div>
                            </div>

                            {moySklad?.is_active ? (
                                <span className="flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 px-2.5 py-1 rounded-full font-semibold">
                                    <CheckCircle2 className="h-3.5 w-3.5" /> {t("integrations.connected", "Ulangan")}
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 text-xs bg-secondary text-muted-foreground px-2.5 py-1 rounded-full font-medium">
                                    <XCircle className="h-3.5 w-3.5" /> {t("integrations.notConnected", "Ulanmagan")}
                                </span>
                            )}
                        </div>

                        <p className="text-xs text-muted-foreground">
                            {t("integrations.moyDesc", "Phone API 1.0, mijozlar (kontragentlar) kartasi, yangi qo'ng'iroqlarda bildirishnomalar va audio fayllar.")}
                        </p>

                        {moySklad?.is_active ? (
                            <div className="bg-secondary/30 rounded-xl p-4 space-y-3 border border-border/60">
                                <div className="text-xs space-y-1">
                                    <span className="text-muted-foreground">{t("integrations.connectedMoyAccount", "Ulangan MoySklad Hisobi:")}</span>
                                    <div className="font-mono font-semibold text-sm text-foreground">
                                        {moySklad.login || t("integrations.connectedViaToken", "MoySklad API Token orqali ulangan")}
                                    </div>
                                </div>

                                <div className="pt-2 border-t border-border/50 flex justify-end">
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="sm"
                                        onClick={disconnectMoy}
                                        className="gap-1.5 h-8 text-xs"
                                    >
                                        <Unlink className="h-3.5 w-3.5" /> {t("integrations.disconnectIntegration", "Integratsiyani uzish")}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={submitMoy} className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold">{t("integrations.moyLoginLabel", "Login yoki Email:")}</label>
                                    <Input
                                        placeholder={t("integrations.moyLoginPlaceholder", "admin@company")}
                                        value={moyForm.data.login}
                                        onChange={(e) => moyForm.setData("login", e.target.value)}
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-semibold">{t("integrations.moyPasswordLabel", "Parol:")}</label>
                                    <Input
                                        type="password"
                                        placeholder="••••••••••••••••"
                                        value={moyForm.data.password}
                                        onChange={(e) => moyForm.setData("password", e.target.value)}
                                    />
                                </div>

                                <div className="relative flex py-1 items-center">
                                    <div className="flex-grow border-t border-border"></div>
                                    <span className="flex-shrink mx-2 text-[10px] text-muted-foreground uppercase">{t("integrations.orApiToken", "YOKI API TOKEN")}</span>
                                    <div className="flex-grow border-t border-border"></div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-semibold">{t("integrations.moyTokenLabel", "MoySklad Access Token:")}</label>
                                    <Input
                                        placeholder={t("integrations.moyTokenPlaceholder", "Token orqali ulanish...")}
                                        value={moyForm.data.token}
                                        onChange={(e) => moyForm.setData("token", e.target.value)}
                                    />
                                </div>

                                <Button type="submit" className="w-full" disabled={moyForm.processing}>
                                    {moyForm.processing ? t("billing.loading", "Yuklanmoqda...") : t("integrations.moyConnectBtn", "MoySklad bilan sinab ko'rish")}
                                </Button>
                            </form>
                        )}
                    </div>
                </div>
            </div>

            {/* Operator Mapping Section */}
            <div className="bg-card rounded-2xl border border-border shadow-xs overflow-hidden space-y-4 p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border pb-4">
                    <div>
                        <h3 className="font-semibold text-base flex items-center gap-2">
                            <Users className="h-4 w-4 text-primary" /> {t("integrations.userMappingsTitle", "Operatorlar va CRM foydalanuvchilarini moslashtirish (Mapping)")}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                            {t("integrations.userMappingsDesc", "1Call operatorlarini amoCRM va MoySklad xodimlariga biriktiring, shunda qo'ng'iroqlar to'g'ri mas'ul xodimga birikadi.")}
                        </p>
                    </div>
                </div>

                <form onSubmit={submitMapping} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end pt-2">
                    <div className="space-y-1">
                        <label className="text-xs font-semibold">{t("integrations.crmTypeLabel", "CRM Tizimi:")}</label>
                        <select
                            value={mappingForm.data.tenant_integration_id}
                            onChange={(e) => mappingForm.setData("tenant_integration_id", e.target.value)}
                            className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
                            required
                        >
                            <option value="">{t("integrations.selectPlaceholder", "Tanlang...")}</option>
                            {amoCrm?.is_active && amoCrm.id && <option value={String(amoCrm.id)}>amoCRM</option>}
                            {moySklad?.is_active && moySklad.id && <option value={String(moySklad.id)}>MoySklad</option>}
                            {!amoCrm?.is_active && !moySklad?.is_active && (
                                <option value="" disabled>{t("integrations.firstConnectCrm", "Avval CRM tizimini ulang")}</option>
                            )}
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold">{t("integrations.operatorLabel", "1Call Operatori:")}</label>
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
                            {safeOperators.length === 0 && <option value="" disabled>{t("integrations.noOperators", "Operatorlar mavjud emas")}</option>}
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold">{t("integrations.crmUserIdLabel", "CRM Foydalanuvchi ID:")}</label>
                        <Input
                            placeholder="1234567"
                            value={mappingForm.data.external_user_id}
                            onChange={(e) => mappingForm.setData("external_user_id", e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold">{t("integrations.crmUserNameLabel", "CRM Xodim Ismi (ixtiyoriy):")}</label>
                        <Input
                            placeholder={t("integrations.crmUserNamePlaceholder", "Ali Valiyev")}
                            value={mappingForm.data.external_user_name}
                            onChange={(e) => mappingForm.setData("external_user_name", e.target.value)}
                        />
                    </div>

                    <div>
                        <Button type="submit" className="w-full h-9 gap-1.5" disabled={mappingForm.processing || (!amoCrm?.is_active && !moySklad?.is_active)}>
                            <Plus className="h-4 w-4" /> {t("integrations.assignBtn", "Biriktirish")}
                        </Button>
                    </div>
                </form>

                {safeMappings.length > 0 ? (
                    <div className="border border-border rounded-xl overflow-hidden mt-4">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase font-medium">
                                <tr>
                                    <th className="py-2.5 px-4">{t("integrations.assignedOperatorHeader", "1Call Operatori")}</th>
                                    <th className="py-2.5 px-4">{t("integrations.assignedCrmSystemHeader", "CRM Tizim")}</th>
                                    <th className="py-2.5 px-4">{t("integrations.assignedCrmUserIdHeader", "CRM Foydalanuvchi ID")}</th>
                                    <th className="py-2.5 px-4">{t("integrations.assignedCrmUserNameHeader", "CRM Xodim Ismi")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {safeMappings.map((m) => (
                                    <tr key={m.id}>
                                        <td className="py-2.5 px-4 font-semibold">{m.user?.name || `Operator #${m.user_id}`}</td>
                                        <td className="py-2.5 px-4 uppercase font-mono">
                                            {m.tenant_integration_id === amoCrm?.id ? "amoCRM" : "MoySklad"}
                                        </td>
                                        <td className="py-2.5 px-4 font-mono">{m.external_user_id}</td>
                                        <td className="py-2.5 px-4 text-muted-foreground">{m.external_user_name || "—"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-xs text-muted-foreground py-2 text-center">
                        {t("integrations.noMappings", "Hozircha biriktirilgan operatorlar mavjud emas.")}
                    </p>
                )}
            </div>

            {/* Sync Logs */}
            <div className="bg-card rounded-2xl border border-border shadow-xs overflow-hidden">
                <div className="p-5 border-b border-border flex items-center justify-between">
                    <h3 className="font-semibold text-base flex items-center gap-2">
                        <Activity className="h-4 w-4 text-primary" /> {t("integrations.syncLogsTitle", "So'nggi sinxronizatsiya loglari")}
                    </h3>
                </div>

                <table className="w-full text-left text-sm">
                    <thead className="bg-muted/50 border-b border-border text-muted-foreground text-xs uppercase font-medium">
                        <tr>
                            <th className="py-3 px-4">{t("integrations.systemHeader", "Tizim")}</th>
                            <th className="py-3 px-4">{t("integrations.callIdHeader", "Qo'ng'iroq ID")}</th>
                            <th className="py-3 px-4">{t("integrations.statusHeader", "Holati")}</th>
                            <th className="py-3 px-4">{t("integrations.messageHeader", "Xabar / Xatolik")}</th>
                            <th className="py-3 px-4 text-right">{t("integrations.timeHeader", "Vaqt")}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-xs">
                        {safeLogs.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="py-6 text-center text-muted-foreground">
                                    {t("integrations.noLogs", "Hozircha hech qanday sinxronizatsiya logi mavjud emas.")}
                                </td>
                            </tr>
                        ) : (
                            safeLogs.map((log) => (
                                <tr key={log.id}>
                                    <td className="py-3 px-4 font-semibold uppercase">{log.crm_type}</td>
                                    <td className="py-3 px-4 font-mono">#{log.call_id || "—"}</td>
                                    <td className="py-3 px-4">
                                        <span className={`px-2 py-0.5 rounded-full font-semibold ${
                                            log.status === "success" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
                                        }`}>
                                            {log.status}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-muted-foreground font-mono">{log.error_message || "OK"}</td>
                                    <td className="py-3 px-4 text-right text-muted-foreground">{formatLogTime(log.created_at)}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
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
