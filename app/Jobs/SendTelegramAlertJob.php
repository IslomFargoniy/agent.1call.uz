<?php

namespace App\Jobs;

use App\Models\Call;
use App\Models\Invoice;
use App\Services\Telegram\TelegramNotificationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendTelegramAlertJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public string $type, // 'missed_call', 'receipt_uploaded'
        public ?Call $call = null,
        public ?Invoice $invoice = null
    ) {}

    /**
     * Execute the job.
     */
    public function handle(TelegramNotificationService $telegramService): void
    {
        if ($this->type === 'missed_call' && $this->call) {
            $tenant = $this->call->tenant;
            if ($tenant) {
                $telegramService->sendMissedCallAlert($tenant, $this->call);
            }
        } elseif ($this->type === 'receipt_uploaded' && $this->invoice) {
            $telegramService->sendReceiptUploadedAlert($this->invoice);
        }
    }
}
