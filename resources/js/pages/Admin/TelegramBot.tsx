import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Head, useForm } from '@inertiajs/react';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
        bot_token: fullBotToken || '',
        bot_username: botUsername || 'Agent1CallBot',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/telegram-bot');
    };

    const copyWebhook = () => {
        navigator.clipboard.writeText(webhookUrl);
        setCopiedUrl(true);
        setTimeout(() => setCopiedUrl(false), 2000);
    };

    const isConnected = Boolean(botInfo?.id && webhookInfo?.url);

    return (
        <div className="mx-auto max-w-5xl space-y-8 p-6">
            <Head
                title={t(
                    'admin.telegramBotTitle',
                    'Telegram Bildirishnomalar Boti Sozlamalari',
                )}
            />

            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                    <h2 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight">
                        <Send className="text-primary h-6 w-6" />{' '}
                        {t(
                            'admin.telegramBotTitle',
                            'Telegram Bildirishnomalar Boti',
                        )}
                    </h2>
                    <p className="text-muted-foreground mt-1 text-sm">
                        {t(
                            'admin.telegramBotDesc',
                            "Yagona rasmiy Telegram bot (@Agent1CallBot) orqali barcha kompaniyalarga qoldirilgan qo'ng'iroqlar xabarnomalarini yuborish",
                        )}
                    </p>
                </div>

                {isConnected && botInfo?.username && (
                    <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="h-9 gap-1.5"
                    >
                        <a
                            href={`https://t.me/${botInfo.username}`}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <ExternalLink className="text-primary h-4 w-4" />{' '}
                            {t('admin.openInTelegram', "Telegram'da ochish")}
                        </a>
                    </Button>
                )}
            </div>

            {/* Bot Live Status Card */}
            <div className="bg-card border-border space-y-4 rounded-2xl border p-6 shadow-xs">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-3">
                        <div
                            className={`rounded-2xl p-3 ${isConnected ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}
                        >
                            <Bot className="h-6 w-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-base font-bold">
                                    {botInfo?.first_name ||
                                        (botUsername
                                            ? `@${botUsername}`
                                            : 'Telegram Bot')}
                                </h3>
                                {isConnected ? (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                                        <CheckCircle2 className="h-3.5 w-3.5" />{' '}
                                        {t(
                                            'admin.botStatusConnected',
                                            'Bot Faol & Ulanadi',
                                        )}
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                                        <AlertCircle className="h-3.5 w-3.5" />{' '}
                                        {t(
                                            'admin.botStatusNotSet',
                                            'Bot Ulanmagan',
                                        )}
                                    </span>
                                )}
                            </div>
                            <p className="text-muted-foreground mt-0.5 font-mono text-xs">
                                {botInfo?.username
                                    ? `@${botInfo.username}`
                                    : botUsername
                                      ? `@${botUsername}`
                                      : '—'}
                                {botInfo?.id && ` • ID: ${botInfo.id}`}
                            </p>
                        </div>
                    </div>

                    {webhookInfo?.url && (
                        <div className="text-right text-xs">
                            <span className="bg-primary/10 text-primary inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold">
                                <Sparkles className="h-3 w-3" />{' '}
                                {t('admin.webhookActive', 'Webhook Faol')}
                            </span>
                            {webhookInfo.pending_update_count > 0 && (
                                <p className="text-muted-foreground mt-1">
                                    {t(
                                        'admin.pendingUpdates',
                                        'Kutilayotgan xabarlar',
                                    )}
                                    : <b>{webhookInfo.pending_update_count}</b>
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {webhookInfo?.last_error_message && (
                    <div className="bg-destructive/10 text-destructive border-destructive/20 flex items-center gap-2 rounded-xl border p-3 text-xs">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>
                            Telegram Webhook xatoligi:{' '}
                            {webhookInfo.last_error_message}
                        </span>
                    </div>
                )}
            </div>

            {/* Token & Username Configuration Form */}
            <form
                onSubmit={handleSubmit}
                className="bg-card border-border space-y-6 rounded-2xl border p-6 shadow-xs"
            >
                <div className="border-border border-b pb-4">
                    <h3 className="text-lg font-bold">
                        Telegram Bot Parametrlari
                    </h3>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                        @BotFather orqali yaratilgan bot tokenni kiriting.
                        Saqlash bosilgach, Webhook avtomatik o'rnatiladi.
                    </p>
                </div>

                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold">
                                {t(
                                    'admin.botTokenLabel',
                                    'Telegram Bot Token (HTTP API):',
                                )}
                            </label>
                            <button
                                type="button"
                                onClick={() => setShowToken(!showToken)}
                                className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs"
                            >
                                {showToken ? (
                                    <EyeOff className="h-3.5 w-3.5" />
                                ) : (
                                    <Eye className="h-3.5 w-3.5" />
                                )}
                                {showToken ? 'Yashirish' : "Ko'rsatish"}
                            </button>
                        </div>
                        <Input
                            type={showToken ? 'text' : 'password'}
                            placeholder={t(
                                'admin.botTokenPlaceholder',
                                '123456789:ABCdefGHIjklMNOpqrSTUvwxYZ...',
                            )}
                            value={data.bot_token}
                            onChange={(e) =>
                                setData('bot_token', e.target.value)
                            }
                            className="font-mono text-sm"
                            required
                        />
                        {errors.bot_token && (
                            <p className="text-destructive mt-1 text-xs font-medium">
                                {errors.bot_token}
                            </p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold">
                            {t(
                                'admin.botUsernameLabel',
                                'Bot Username (ixtiyoriy):',
                            )}
                        </label>
                        <div className="relative">
                            <span className="text-muted-foreground absolute top-2 left-3 font-mono text-sm">
                                @
                            </span>
                            <Input
                                placeholder="Agent1CallBot"
                                value={data.bot_username.replace(/^@/, '')}
                                onChange={(e) =>
                                    setData(
                                        'bot_username',
                                        e.target.value.replace(/^@/, ''),
                                    )
                                }
                                className="pl-7 font-mono text-sm"
                            />
                        </div>
                        {errors.bot_username && (
                            <p className="text-destructive mt-1 text-xs font-medium">
                                {errors.bot_username}
                            </p>
                        )}
                    </div>

                    <div className="bg-secondary/40 border-border space-y-2 rounded-xl border p-4">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-foreground flex items-center gap-1.5 font-semibold">
                                <Info className="text-primary h-3.5 w-3.5" />{' '}
                                {t(
                                    'admin.webhookUrlLabel',
                                    'Tizim Webhook URL manzili:',
                                )}
                            </span>
                            <button
                                type="button"
                                onClick={copyWebhook}
                                className="text-primary flex items-center gap-1 font-medium hover:underline"
                            >
                                {copiedUrl ? (
                                    <Check className="h-3 w-3 text-emerald-500" />
                                ) : (
                                    <Copy className="h-3 w-3" />
                                )}
                                {copiedUrl ? 'Nusxalandi' : 'Nusxalash'}
                            </button>
                        </div>
                        <div className="bg-background/80 border-border text-muted-foreground rounded-lg border p-2.5 font-mono text-xs break-all select-all">
                            {webhookUrl}
                        </div>
                        <p className="text-muted-foreground text-[11px]">
                            Saqlash tugmasini bosishingiz bilan tizim Telegram
                            serverlariga ushbu URL manzilni avtomatik ravishda
                            Webhook sifatida biriktiradi.
                        </p>
                    </div>
                </div>

                <Button
                    type="submit"
                    size="lg"
                    className="w-full font-bold shadow-sm"
                    disabled={processing}
                >
                    {processing
                        ? t(
                              'admin.connectingWebhook',
                              'Tekshirilmoqda va ulanmoqda...',
                          )
                        : t(
                              'admin.saveAndConnectWebhook',
                              "Saqlash va Webhook'ni ulash",
                          )}
                </Button>
            </form>

            {/* How It Works Explainer Card */}
            <div className="bg-card border-border space-y-4 rounded-2xl border p-6 shadow-xs">
                <h3 className="flex items-center gap-2 text-base font-bold">
                    <MessageSquare className="text-primary h-4 w-4" />{' '}
                    {t(
                        'admin.howItWorksTitle',
                        'Telegram Bot Qanday Ishlaydi?',
                    )}
                </h3>

                <div className="grid grid-cols-1 gap-4 pt-1 text-xs md:grid-cols-2 lg:grid-cols-4">
                    <div className="border-border bg-secondary/20 space-y-1.5 rounded-xl border p-4">
                        <div className="bg-primary/10 text-primary flex h-7 w-7 items-center justify-center rounded-lg font-bold">
                            1
                        </div>
                        <h4 className="text-foreground font-semibold">
                            {t('admin.step1Title', '1. Avtomatik Webhook')}
                        </h4>
                        <p className="text-muted-foreground">
                            {t(
                                'admin.step1Desc',
                                "Token kiritilishi bilan tizim avtomatik ravishda Telegram serverlariga Webhook o'rnatadi.",
                            )}
                        </p>
                    </div>

                    <div className="border-border bg-secondary/20 space-y-1.5 rounded-xl border p-4">
                        <div className="bg-primary/10 text-primary flex h-7 w-7 items-center justify-center rounded-lg font-bold">
                            2
                        </div>
                        <h4 className="text-foreground font-semibold">
                            {t('admin.step2Title', "2. Guruhga qo'shish")}
                        </h4>
                        <p className="text-muted-foreground">
                            {t(
                                'admin.step2Desc',
                                "Mijozlar ushbu botni o'zlarining sotuv yoki xodimlar Telegram guruhiga qo'shadilar.",
                            )}
                        </p>
                    </div>

                    <div className="border-border bg-secondary/20 space-y-1.5 rounded-xl border p-4">
                        <div className="bg-primary/10 text-primary flex h-7 w-7 items-center justify-center rounded-lg font-bold">
                            3
                        </div>
                        <h4 className="text-foreground font-semibold">
                            {t('admin.step3Title', '3. Chat ID avtomatik')}
                        </h4>
                        <p className="text-muted-foreground">
                            {t(
                                'admin.step3Desc',
                                "Bot guruhga qo'shilishi bilanoq, o'sha guruhga uning Chat ID sini yozib beradi.",
                            )}
                        </p>
                    </div>

                    <div className="border-border bg-secondary/20 space-y-1.5 rounded-xl border p-4">
                        <div className="bg-primary/10 text-primary flex h-7 w-7 items-center justify-center rounded-lg font-bold">
                            4
                        </div>
                        <h4 className="text-foreground font-semibold">
                            {t('admin.step4Title', '4. Jonli bildirishnomalar')}
                        </h4>
                        <p className="text-muted-foreground">
                            {t(
                                'admin.step4Desc',
                                "Har bir javobsiz qo'ng'iroq bo'yicha zudlik bilan guruhga xabar yuboriladi.",
                            )}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
