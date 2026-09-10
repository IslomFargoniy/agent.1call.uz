<?php

namespace App\Services\Telegram;

use App\Models\Call;
use App\Models\Invoice;
use App\Models\Tenant;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TelegramNotificationService
{
    protected string $botToken;

    public function __construct()
    {
        $this->botToken = config('services.telegram.bot_token', env('TELEGRAM_BOT_TOKEN', ''));
    }

    /**
     * Send Markdown message via Telegram Bot.
     */
    public function sendMessage(string $chatId, string $text): bool
    {
        if (empty($this->botToken) || empty($chatId)) {
            return false;
        }

        try {
            $response = Http::asJson()->post("https://api.telegram.org/bot{$this->botToken}/sendMessage", [
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
