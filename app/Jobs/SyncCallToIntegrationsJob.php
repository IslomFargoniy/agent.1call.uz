<?php

namespace App\Jobs;

use App\Models\Call;
use App\Models\IntegrationSyncLog;
use App\Models\TenantIntegration;
use App\Services\Integrations\CrmManager;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class SyncCallToIntegrationsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public function __construct(
        public Call $call
    ) {}

    /**
     * Execute the job.
     */
    public function handle(CrmManager $crmManager): void
    {
        $lockKey = "crm_sync_call_{$this->call->id}";
        $lock = Cache::lock($lockKey, 30);

        if (! $lock->get()) {
            return; // already being processed
        }

        try {
            $integrations = TenantIntegration::withoutGlobalScopes()
                ->where('tenant_id', $this->call->tenant_id)
                ->where('is_active', true)
                ->get();

            foreach ($integrations as $integration) {
                try {
                    $driver = $crmManager->driver($integration->crm_type);
                    $result = $driver->syncCall($integration, $this->call);

                    IntegrationSyncLog::create([
                        'tenant_id' => $this->call->tenant_id,
                        'crm_type' => $integration->crm_type,
                        'call_id' => $this->call->id,
                        'status' => ($result['success'] ?? false) ? 'success' : 'failed',
                        'error_message' => $result['error'] ?? null,
                        'response' => $result,
                    ]);
                } catch (\Throwable $e) {
                    Log::error("Failed to sync call {$this->call->id} to {$integration->crm_type}: ".$e->getMessage());

                    IntegrationSyncLog::create([
                        'tenant_id' => $this->call->tenant_id,
                        'crm_type' => $integration->crm_type,
                        'call_id' => $this->call->id,
                        'status' => 'failed',
                        'error_message' => $e->getMessage(),
                    ]);
                }
            }
        } finally {
            $lock->release();
        }
    }
}
