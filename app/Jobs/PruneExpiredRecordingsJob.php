<?php

namespace App\Jobs;

use App\Models\Call;
use App\Models\Tenant;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class PruneExpiredRecordingsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $tenants = Tenant::all();

        foreach ($tenants as $tenant) {
            $retentionDays = $tenant->audio_retention_days ?: 30;
            $cutoffDate = Carbon::now()->subDays($retentionDays);

            $expiredCalls = Call::withoutGlobalScopes()
                ->where('tenant_id', $tenant->id)
                ->where('call_timestamp', '<', $cutoffDate)
                ->where('recording_status', 'uploaded')
                ->whereNotNull('recording_path')
                ->limit(500)
                ->get();

            foreach ($expiredCalls as $call) {
                try {
                    $disk = $call->recording_disk ?: config('filesystems.default');
                    if (Storage::disk($disk)->exists($call->recording_path)) {
                        Storage::disk($disk)->delete($call->recording_path);
                    }

                    $call->update([
                        'recording_path' => null,
                        'recording_status' => 'deleted',
                    ]);
                } catch (\Throwable $e) {
                    Log::error("Failed to delete expired recording for call {$call->id}: ".$e->getMessage());
                }
            }
        }
    }
}
