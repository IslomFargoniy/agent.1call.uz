import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Head, useForm } from "@inertiajs/react";
import {
    Send,
    Bot,
    CheckCircle2,
    XCircle,
    ExternalLink,
    Copy,
    Check,
    Eye,
    EyeOff,
    Sparkles,
    MessageSquare,
    AlertCircle,
    Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TelegramBotProps {
    botToken: string;
    fullBotToken: string;
    botUsername: string;
    webhookUrl: string;
    botInfo?: {
        id: number;
        first_name: string;
        username: string;
        can_join_groups: boolean;
        can_read_all_group_messages: boolean;
        supports_inline_queries: boolean;
    } | null;
    webhookInfo?: {
        url: string;
        has_custom_certificate: boolean;
        pending_update_count: number;
        last_error_date?: number;
        last_error_message?: string;
    } | null;
    lastUpdated?: string;
}

export default function TelegramBotSettings({
    botToken,
    fullBotToken,
    botUsername,
    webhookUrl,
    botInfo,
    webhookInfo,
    lastUpdated,
}: TelegramBotProps) {
    const { t } = useTranslation();
    const [showToken, setShowToken] = useState(false);
    const [copiedUrl, setCopiedUrl] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        bot_token: fullBotToken || "",
        bot_username: botUsername || "Agent1CallBot",
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post("/admin/telegram-bot");
    };

    const copyWebhook = () => {
        navigator.clipboard.writeText(webhookUrl);
        setCopiedUrl(true);
        setTimeout(() => setCopiedUrl(false), 2000);
    };

    const isConnected = Boolean(botInfo?.id && webhookInfo?.url);

    return (
        <div className="p-6 space-y-8 max-w-5xl mx-auto">
            <Head title={t("admin.telegramBotTitle", "Telegram Bildirishnomalar Boti Sozlamalari")} />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
                        <Send className="h-6 w-6 text-primary" /> {t("admin.telegramBotTitle", "Telegram Bildirishnomalar Boti")}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        {t("admin.telegramBotDesc", "Yagona rasmiy Telegram bot (@Agent1CallBot) orqali barcha kompaniyalarga qoldirilgan qo'ng'iroqlar xabarnomalarini yuborish")}
                    </p>
                </div>

                {isConnected && botInfo?.username && (
                    <Button asChild variant="outline" size="sm" className="gap-1.5 h-9">
                        <a href={`https://t.me/${botInfo.username}`} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 text-primary" /> {t("admin.openInTelegram", "Telegram'da ochish")}
                        </a>
                    </Button>
                )}
            </div>

            {/* Bot Live Status Card */}
            <div className="bg-card p-6 rounded-2xl border border-border shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-2xl ${isConnected ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"}`}>
                            <Bot className="h-6 w-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-base">
                                    {botInfo?.first_name || (botUsername ? `@${botUsername}` : "Telegram Bot")}
                                </h3>
                                {isConnected ? (
                                    <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 px-2.5 py-0.5 rounded-full font-semibold">
                                        <CheckCircle2 className="h-3.5 w-3.5" /> {t("admin.botStatusConnected", "Bot Faol & Ulanadi")}
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 px-2.5 py-0.5 rounded-full font-semibold">
                                        <AlertCircle className="h-3.5 w-3.5" /> {t("admin.botStatusNotSet", "Bot Ulanmagan")}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground font-mono mt-0.5">
                                {botInfo?.username ? `@${botInfo.username}` : (botUsername ? `@${botUsername}` : "—")}
                                {botInfo?.id && ` • ID: ${botInfo.id}`}
                            </p>
                        </div>
                    </div>

                    {webhookInfo?.url && (
                        <div className="text-right text-xs">
                            <span className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">
                                <Sparkles className="h-3 w-3" /> {t("admin.webhookActive", "Webhook Faol")}
                            </span>
                            {webhookInfo.pending_update_count > 0 && (
                                <p className="text-muted-foreground mt-1">
                                    {t("admin.pendingUpdates", "Kutilayotgan xabarlar")}: <b>{webhookInfo.pending_update_count}</b>
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {webhookInfo?.last_error_message && (
                    <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-xl p-3 text-xs flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>Telegram Webhook xatoligi: {webhookInfo.last_error_message}</span>
                    </div>
                )}
            </div>

            {/* Token & Username Configuration Form */}
            <form onSubmit={handleSubmit} className="bg-card p-6 rounded-2xl border border-border shadow-xs space-y-6">
                <div className="border-b border-border pb-4">
                    <h3 className="font-bold text-lg">Telegram Bot Parametrlari</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        @BotFather orqali yaratilgan bot tokenni kiriting. Saqlash bosilgach, Webhook avtomatik o'rnatiladi.
                    </p>
                </div>

                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-semibold">{t("admin.botTokenLabel", "Telegram Bot Token (HTTP API):")}</label>
                            <button
                                type="button"
                                onClick={() => setShowToken(!showToken)}
                                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                            >
                                {showToken ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                {showToken ? "Yashirish" : "Ko'rsatish"}
                            </button>
                        </div>
                        <Input
                            type={showToken ? "text" : "password"}
                            placeholder={t("admin.botTokenPlaceholder", "123456789:ABCdefGHIjklMNOpqrSTUvwxYZ...")}
                            value={data.bot_token}
                            onChange={(e) => setData("bot_token", e.target.value)}
                            className="font-mono text-sm"
                            required
                        />
                        {errors.bot_token && (
                            <p className="text-xs text-destructive mt-1 font-medium">{errors.bot_token}</p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold">{t("admin.botUsernameLabel", "Bot Username (ixtiyoriy):")}</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2 text-muted-foreground font-mono text-sm">@</span>
                            <Input
                                placeholder="Agent1CallBot"
                                value={data.bot_username.replace(/^@/, "")}
                                onChange={(e) => setData("bot_username", e.target.value.replace(/^@/, ""))}
                                className="pl-7 font-mono text-sm"
                            />
                        </div>
                        {errors.bot_username && (
                            <p className="text-xs text-destructive mt-1 font-medium">{errors.bot_username}</p>
                        )}
                    </div>

                    <div className="bg-secondary/40 border border-border rounded-xl p-4 space-y-2">
                        <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold text-foreground flex items-center gap-1.5">
                                <Info className="h-3.5 w-3.5 text-primary" /> {t("admin.webhookUrlLabel", "Tizim Webhook URL manzili:")}
                            </span>
                            <button
                                type="button"
                                onClick={copyWebhook}
                                className="text-primary hover:underline flex items-center gap-1 font-medium"
                            >
                                {copiedUrl ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                                {copiedUrl ? "Nusxalandi" : "Nusxalash"}
                            </button>
                        </div>
                        <div className="font-mono text-xs bg-background/80 p-2.5 rounded-lg border border-border text-muted-foreground select-all break-all">
                            {webhookUrl}
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                            Saqlash tugmasini bosishingiz bilan tizim Telegram serverlariga ushbu URL manzilni avtomatik ravishda Webhook sifatida biriktiradi.
                        </p>
                    </div>
                </div>

                <Button type="submit" size="lg" className="w-full font-bold shadow-sm" disabled={processing}>
                    {processing ? t("admin.connectingWebhook", "Tekshirilmoqda va ulanmoqda...") : t("admin.saveAndConnectWebhook", "Saqlash va Webhook'ni ulash")}
                </Button>
            </form>

            {/* How It Works Explainer Card */}
            <div className="bg-card p-6 rounded-2xl border border-border shadow-xs space-y-4">
                <h3 className="font-bold text-base flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-primary" /> {t("admin.howItWorksTitle", "Telegram Bot Qanday Ishlaydi?")}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-1 text-xs">
                    <div className="p-4 rounded-xl border border-border bg-secondary/20 space-y-1.5">
                        <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">1</div>
                        <h4 className="font-semibold text-foreground">{t("admin.step1Title", "1. Avtomatik Webhook")}</h4>
                        <p className="text-muted-foreground">{t("admin.step1Desc", "Token kiritilishi bilan tizim avtomatik ravishda Telegram serverlariga Webhook o'rnatadi.")}</p>
                    </div>

                    <div className="p-4 rounded-xl border border-border bg-secondary/20 space-y-1.5">
                        <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">2</div>
                        <h4 className="font-semibold text-foreground">{t("admin.step2Title", "2. Guruhga qo'shish")}</h4>
                        <p className="text-muted-foreground">{t("admin.step2Desc", "Mijozlar ushbu botni o'zlarining sotuv yoki xodimlar Telegram guruhiga qo'shadilar.")}</p>
                    </div>

                    <div className="p-4 rounded-xl border border-border bg-secondary/20 space-y-1.5">
                        <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">3</div>
                        <h4 className="font-semibold text-foreground">{t("admin.step3Title", "3. Chat ID avtomatik")}</h4>
                        <p className="text-muted-foreground">{t("admin.step3Desc", "Bot guruhga qo'shilishi bilanoq, o'sha guruhga uning Chat ID sini yozib beradi.")}</p>
                    </div>

                    <div className="p-4 rounded-xl border border-border bg-secondary/20 space-y-1.5">
                        <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">4</div>
                        <h4 className="font-semibold text-foreground">{t("admin.step4Title", "4. Jonli bildirishnomalar")}</h4>
                        <p className="text-muted-foreground">{t("admin.step4Desc", "Har bir javobsiz qo'ng'iroq bo'yicha zudlik bilan guruhga xabar yuboriladi.")}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
