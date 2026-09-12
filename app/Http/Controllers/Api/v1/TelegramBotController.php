<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Services\Telegram\TelegramNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class TelegramBotController extends Controller
{
    public function __construct(
        protected TelegramNotificationService $telegramService
    ) {}

    /**
     * Handle incoming Telegram webhook updates.
     */
    public function handleWebhook(Request $request): JsonResponse
    {
        $update = $request->all();

        if (empty($update)) {
            return response()->json(['status' => 'empty']);
        }

        try {
            if (isset($update['message'])) {
                $this->handleMessage($update['message']);
            } elseif (isset($update['my_chat_member'])) {
                $this->handleMyChatMember($update['my_chat_member']);
            }
        } catch (\Throwable $e) {
            Log::error('Error processing Telegram webhook: '.$e->getMessage(), [
                'exception' => $e,
            ]);
        }

        return response()->json(['status' => 'ok']);
    }

    protected function handleMessage(array $message): void
    {
        $chat = $message['chat'] ?? [];
        $chatId = (string) ($chat['id'] ?? '');
        $chatType = $chat['type'] ?? 'private';
        $chatTitle = $chat['title'] ?? 'Guruh';
        $from = $message['from'] ?? [];
        $firstName = htmlspecialchars($from['first_name'] ?? 'Foydalanuvchi');
        $text = trim($message['text'] ?? '');
        $botUsername = $this->telegramService->getBotUsername();

        // 1. Bot was added to a group/channel
        if (! empty($message['new_chat_members'])) {
            foreach ($message['new_chat_members'] as $member) {
                $memberUsername = $member['username'] ?? '';
                if (($member['is_bot'] ?? false) && (strcasecmp($memberUsername, $botUsername) === 0 || empty($botUsername))) {
                    $welcomeGroupText = "🎉 <b>Agent1Call Bildirishnomalar Boti guruhga muvaffaqiyatli qo'shildi!</b>\n\n".
                        '👥 <b>Guruh nomi:</b> '.htmlspecialchars($chatTitle)."\n".
                        "🆔 <b>Guruh Chat ID:</b> <code>{$chatId}</code>\n\n".
                        "📋 <b>Ulash bo'yicha yo'riqnoma:</b>\n".
                        "1. Yuqoridagi <code>{$chatId}</code> raqamini nusxalab oling.\n".
                        "2. Agent1Call tizimidagi <b>\"Ish Grafigi va Maxfiylik\"</b> sahifasiga o'ting.\n".
                        "3. <b>\"Telegram Bildirishnomalar Guruxi\"</b> maydoniga shu ID ni joylashtiring va saqlang.\n\n".
                        "<i>Endi kompaniyangizdagi barcha javobsiz qo'ng'iroqlar ushbu guruhga kelib tushadi!</i>";

                    $this->telegramService->sendMessage($chatId, $welcomeGroupText);

                    return;
                }
            }
        }

        // 2. Group commands (/id, /start, /help, /chatid)
        if (in_array($chatType, ['group', 'supergroup', 'channel'])) {
            if (str_starts_with($text, '/id') || str_starts_with($text, '/start') || str_starts_with($text, '/help') || str_starts_with($text, '/chatid')) {
                $groupInfoText = "ℹ️ <b>1Call Guruh Ma'lumotlari:</b>\n\n".
                    '👥 <b>Guruh:</b> '.htmlspecialchars($chatTitle)."\n".
                    "🆔 <b>Guruh Chat ID:</b> <code>{$chatId}</code>\n\n".
                    "<i>Ushbu ID ni Agent1Call kabinetingizdagi 'Telegram Bildirishnomalar Guruxi' maydoniga kiriting.</i>";

                $this->telegramService->sendMessage($chatId, $groupInfoText);
            }

            return;
        }

        // 3. Direct private chat with user (/start)
        if ($chatType === 'private') {
            $userText = "👋 <b>Assalomu alaykum, {$firstName}!</b>\n\n".
                "Bu <b>Agent1Call</b> tizimining rasmiy bildirishnomalar boti (@{$botUsername}).\n\n".
                "🆔 <b>Sizning shaxsiy Chat ID:</b> <code>{$chatId}</code>\n\n".
                "💡 <b>Qo'llanma:</b>\n".
                "• <b>Shaxsiy xabarlar uchun:</b> Ushbu <code>{$chatId}</code> raqamini Agent1Call kabinetingizga kiriting.\n".
                "• <b>Guruhga xabarlar uchun:</b> Botni o'z sotuv yoki operatorlar guruhiga qo'shing va bot taqdim etgan guruh ID sini tizimga kiriting.";

            $this->telegramService->sendMessage($chatId, $userText);
        }
    }

    protected function handleMyChatMember(array $memberUpdate): void
    {
        $chat = $memberUpdate['chat'] ?? [];
        $chatId = (string) ($chat['id'] ?? '');
        $chatTitle = $chat['title'] ?? 'Guruh';
        $newStatus = $memberUpdate['new_chat_member']['status'] ?? '';

        if (in_array($newStatus, ['member', 'administrator'])) {
            $text = "✅ <b>Agent1Call Bildirishnomalar Boti faollashtirildi!</b>\n\n".
                '👥 <b>Guruh:</b> '.htmlspecialchars($chatTitle)."\n".
                "🆔 <b>Guruh Chat ID:</b> <code>{$chatId}</code>\n\n".
                '<i>Ushbu ID ni Agent1Call tizimidagi kompaniyangiz sozlamalariga kiriting.</i>';

            $this->telegramService->sendMessage($chatId, $text);
        }
    }
}
