<?php

namespace App\Services\Telegram;

use App\Models\Call;
use App\Models\Invoice;
use App\Models\SystemSetting;
use App\Models\Tenant;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TelegramNotificationService
{
    /**
     * Get active Telegram Bot Token from database or env.
     */
    public function getBotToken(): string
    {
        $dbToken = SystemSetting::get('telegram_bot_token');
        if (! empty($dbToken)) {
            return (string) $dbToken;
        }

        return (string) config('services.telegram.bot_token', env('TELEGRAM_BOT_TOKEN', ''));
    }

    /**
     * Get active Telegram Bot Username.
     */
    public function getBotUsername(): string
    {
        $dbUsername = SystemSetting::get('telegram_bot_username');
        if (! empty($dbUsername)) {
            return ltrim((string) $dbUsername, '@');
        }

        return ltrim((string) config('services.telegram.bot_username', env('TELEGRAM_BOT_USERNAME', 'Agent1CallBot')), '@');
    }

    /**
     * Send HTML message via Telegram Bot.
     */
    public function sendMessage(string $chatId, string $text): bool
    {
        $token = $this->getBotToken();
        if (empty($token) || empty($chatId)) {
            return false;
        }

        try {
            $response = Http::asJson()->post("https://api.telegram.org/bot{$token}/sendMessage", [
                'chat_id' => $chatId,
                'text' => $text,
                'parse_mode' => 'HTML',
                'disable_web_page_preview' => true,
            ]);

            return $response->successful();
        } catch (\Throwable $e) {
            Log::error('Telegram alert failed: '.$e->getMessage());

            return false;
        }
    }

    /**
     * Verify Bot Token and retrieve bot identity from Telegram.
     */
    public function getMe(?string $customToken = null): ?array
    {
        $token = $customToken ?: $this->getBotToken();
        if (empty($token)) {
            return null;
        }

        try {
            $response = Http::timeout(10)->get("https://api.telegram.org/bot{$token}/getMe");
            if ($response->successful() && $response->json('ok')) {
                return $response->json('result');
            }
        } catch (\Throwable $e) {
            Log::error('Telegram getMe failed: '.$e->getMessage());
        }

        return null;
    }

    /**
     * Register or update Webhook URL with Telegram API.
     */
    public function setWebhook(string $webhookUrl, ?string $customToken = null): array
    {
        $token = $customToken ?: $this->getBotToken();
        if (empty($token)) {
            return ['ok' => false, 'description' => 'Bot tokeni mavjud emas.'];
        }

        try {
            $response = Http::timeout(15)->post("https://api.telegram.org/bot{$token}/setWebhook", [
                'url' => $webhookUrl,
                'drop_pending_updates' => true,
                'allowed_updates' => ['message', 'my_chat_member'],
            ]);

            return $response->json() ?: ['ok' => false, 'description' => 'Javob qabul qilinmadi.'];
        } catch (\Throwable $e) {
            Log::error('Telegram setWebhook failed: '.$e->getMessage());

            return ['ok' => false, 'description' => $e->getMessage()];
        }
    }

    /**
     * Get Webhook Info from Telegram API.
     */
    public function getWebhookInfo(?string $customToken = null): ?array
    {
        $token = $customToken ?: $this->getBotToken();
        if (empty($token)) {
            return null;
        }

        try {
            $response = Http::timeout(10)->get("https://api.telegram.org/bot{$token}/getWebhookInfo");
            if ($response->successful() && $response->json('ok')) {
                return $response->json('result');
            }
        } catch (\Throwable $e) {
            Log::error('Telegram getWebhookInfo failed: '.$e->getMessage());
        }

        return null;
    }

    /**
     * Send missed call notification to company Telegram chat.
     */
    public function sendMissedCallAlert(Tenant $tenant, Call $call): bool
    {
        if (empty($tenant->telegram_chat_id)) {
            return false;
        }

        $time = $call->call_timestamp->format('d.m.Y H:i:s');
        $device = $call->device?->name ?? 'Noma\'lum qurilma';

        $text = "⚠️ <b>Qoldirilgan qo'ng'iroq!</b>\n\n".
                "📞 <b>Raqam:</b> <code>{$call->phone_number}</code>\n".
                "📱 <b>Qurilma:</b> {$device}\n".
                "🕒 <b>Vaqt:</b> {$time}\n\n".
                '<i>Iltimos, mijozga zudlik bilan qayta aloqaga chiqing.</i>';

        return $this->sendMessage($tenant->telegram_chat_id, $text);
    }

    /**
     * Send alert to Superadmin when card payment screenshot is uploaded.
     */
    public function sendReceiptUploadedAlert(Invoice $invoice): bool
    {
        $adminChatId = env('TELEGRAM_SUPERADMIN_CHAT_ID', '');
        if (empty($adminChatId)) {
            return false;
        }

        $tenantName = $invoice->tenant?->name ?? 'Noma\'lum';
        $amount = number_format($invoice->amount, 0, '.', ' ');

        $text = "💳 <b>Yangi to'lov skrinshoti yuklandi!</b>\n\n".
                "🏢 <b>Kompaniya:</b> {$tenantName}\n".
                "🧾 <b>Invoys:</b> <code>{$invoice->invoice_number}</code>\n".
                "💰 <b>Summa:</b> {$amount} UZS\n\n".
                '<i>Tekshirish va tasdiqlash uchun admin panelga kiring.</i>';

        return $this->sendMessage($adminChatId, $text);
    }
}
