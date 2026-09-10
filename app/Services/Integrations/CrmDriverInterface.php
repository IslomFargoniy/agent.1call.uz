<?php

namespace App\Services\Integrations;

use App\Models\Call;
use App\Models\TenantIntegration;

interface CrmDriverInterface
{
    /**
     * Connect or refresh authorization tokens.
     */
    public function authorize(TenantIntegration $integration, array $params): array;

    /**
     * Synchronize a completed call record into the CRM.
     */
    public function syncCall(TenantIntegration $integration, Call $call): array;

    /**
     * Notify CRM that an incoming call is ringing (pop-up card).
     */
    public function notifyRinging(TenantIntegration $integration, array $callData): void;

    /**
     * Find contact or lead by phone number.
     */
    public function findContact(TenantIntegration $integration, string $phone): ?array;
}
