<?php

namespace App\Services\Integrations;

use App\Services\Integrations\AmoCrm\AmoCrmService;
use App\Services\Integrations\MoySklad\MoySkladService;
use InvalidArgumentException;

class CrmManager
{
    public function __construct(
        protected AmoCrmService $amoCrmService,
        protected MoySkladService $moySkladService
    ) {}

    /**
     * Get CRM driver instance by type.
     */
    public function driver(string $type): CrmDriverInterface
    {
        return match ($type) {
            'amocrm' => $this->amoCrmService,
            'moysklad' => $this->moySkladService,
            default => throw new InvalidArgumentException("Noma'lum CRM turi: {$type}"),
        };
    }
}
