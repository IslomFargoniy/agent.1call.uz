# Multi-Tenant SaaS "ZvonkiPro" — Texnik Arxitektura va Implementatsiya Rejasi
**(Single Database + Centralized Auth + PostgreSQL RLS + amoCRM/Bitrix24/MoySklad/BitoERP)**

---

## Arxitektura Xulosasi
| Qaror | Tanlangan Variant |
|-------|-------------------|
| **Multi-Tenancy modeli** | Single Database with Row-Level / Tenant Scoping (`tenant_id`) |
| **Tenantni aniqlash (Web)** | A-Variant: Markazlashgan Login → `user.tenant_id` → sessiya |
| **Tenantni aniqlash (Mobil)** | Sanctum Device Token → `device.tenant_id` |
| **Izolyatsiya** | 2 bosqichli: Laravel Eloquent TenantScope + PostgreSQL RLS |
| **DBMS** | PostgreSQL 16+ |
| **CRM/ERP** | amoCRM, Bitrix24, MoySklad, BitoERP (Driver Pattern) |

---

## 1. Tenant Izolyatsiyasi Mexanizmi

```mermaid
flowchart TD
    Req["So'rov keladi"] --> RouteCheck{"Kanal turi"}
    
    RouteCheck -->|"Web (/login)"| WebAuth["Email + Parol"]
    RouteCheck -->|"API (/api/v1/*)"| ApiAuth["Bearer Token"]
    
    WebAuth --> UserFound["user.tenant_id"]
    ApiAuth --> DeviceFound["device.tenant_id"]
    
    UserFound --> SetCtx["TenantContext::setTenant"]
    DeviceFound --> SetCtx
    
    SetCtx --> SetRLS["DB: SET app.current_tenant_id"]
    SetRLS --> AppExec["Controller amallari"]
    
    AppExec --> Scope["Eloquent TenantScope"]
    Scope --> PG["PostgreSQL RLS Policy"]
    PG --> Result["Xavfsiz javob"]
```

### 1.1. TenantContext Singleton
```php
namespace App\Services\Tenancy;

use App\Models\Tenant;
use Illuminate\Support\Facades\DB;

class TenantContext
{
    protected ?Tenant $tenant = null;

    public function setTenant(?Tenant $tenant): void
    {
        $this->tenant = $tenant;

        if ($tenant) {
            // Sessiya darajasida (SET LOCAL emas! — tranzaksiyaga bog'liq emas)
            DB::statement("SET app.current_tenant_id = '{$tenant->id}'");
        } else {
            DB::statement("RESET app.current_tenant_id");
        }
    }

    public function getTenant(): ?Tenant { return $this->tenant; }
    public function id(): ?int { return $this->tenant?->id; }
    public function check(): bool { return $this->tenant !== null; }
}
```

### 1.2. TenantScope
```php
namespace App\Models\Scopes;

use App\Services\Tenancy\TenantContext;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

class TenantScope implements Scope
{
    public function apply(Builder $builder, Model $model): void
    {
        $ctx = app(TenantContext::class);
        if ($ctx->check()) {
            $builder->where($model->qualifyColumn('tenant_id'), $ctx->id());
        }
    }
}
```

### 1.3. BelongsToTenant Trait
```php
namespace App\Models\Concerns;

use App\Models\Scopes\TenantScope;
use App\Services\Tenancy\TenantContext;

trait BelongsToTenant
{
    protected static function bootBelongsToTenant(): void
    {
        static::addGlobalScope(new TenantScope());

        static::creating(function ($model) {
            $ctx = app(TenantContext::class);
            if (empty($model->tenant_id) && $ctx->check()) {
                $model->tenant_id = $ctx->id();
            }
        });
    }

    public function tenant()
    {
        return $this->belongsTo(\App\Models\Tenant::class);
    }
}
```

### 1.4. SetTenantContext Middleware
```php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Services\Tenancy\TenantContext;

class SetTenantContext
{
    public function handle(Request $request, Closure $next)
    {
        $tenantContext = app(TenantContext::class);

        if (auth()->check()) {
            $tenantContext->setTenant(auth()->user()->tenant);
        } elseif ($request->bearerToken()) {
            // Sanctum device guard orqali
            $device = $request->user('device');
            if ($device) {
                $tenantContext->setTenant($device->tenant);
            }
        }

        return $next($request);
    }
}
```

### 1.5. Superadmin RLS Bypass
Platforma egasi (superadmin) barcha tenantlar ma'lumotlarini ko'rishi uchun RLS ni chetlab o'tish:
```php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SuperadminBypassTenant
{
    public function handle(Request $request, Closure $next)
    {
        if (auth()->check() && auth()->user()->role === 'superadmin') {
            // RLS ni o'chirish — faqat superadmin uchun
            DB::statement("SET app.current_tenant_id = ''");
        }
        return $next($request);
    }
}
```

---

## 2. Jadvallar Strukturasi (PostgreSQL DDL + RLS)

### 2.1. `tenants` (Kompaniyalar)
```sql
CREATE TABLE tenants (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    plan VARCHAR(50) NOT NULL DEFAULT 'standard',
    plan_limits JSONB NOT NULL DEFAULT '{"max_devices": 10, "retention_days": 90, "audio_storage_gb": 20}',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NULL,
    updated_at TIMESTAMPTZ NULL
);
```

### 2.2. `users` (Mavjud migratsiyaga tenant ustunlari qo'shiladi)
```sql
-- Mavjud users jadvaliga qo'shiladigan ustunlar:
ALTER TABLE users
    ADD COLUMN tenant_id BIGINT REFERENCES tenants(id) ON DELETE CASCADE,
    ADD COLUMN role VARCHAR(50) NOT NULL DEFAULT 'operator',
    ADD COLUMN phone_number VARCHAR(50) NULL,
    ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX idx_users_tenant ON users(tenant_id);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY users_tenant_isolation ON users
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::bigint)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::bigint);
```

### 2.3. `devices` (Android Mobil Agentlar)
```sql
CREATE TABLE devices (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    tenant_id BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id BIGINT NULL REFERENCES users(id) ON DELETE SET NULL,
    device_uid VARCHAR(128) NOT NULL,
    name VARCHAR(255) NOT NULL,
    model VARCHAR(150) NULL,
    manufacturer VARCHAR(100) NULL,
    os_version VARCHAR(50) NULL,
    app_version VARCHAR(50) NULL,
    sim_slots_info JSONB NULL DEFAULT '[]',
    battery_level SMALLINT NULL,
    is_charging BOOLEAN NOT NULL DEFAULT FALSE,
    pairing_code VARCHAR(16) NULL,
    pairing_code_expires_at TIMESTAMPTZ NULL,
    last_seen_at TIMESTAMPTZ NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NULL,
    updated_at TIMESTAMPTZ NULL,
    CONSTRAINT uq_devices_tenant_uid UNIQUE (tenant_id, device_uid)
);
CREATE INDEX idx_devices_tenant_seen ON devices(tenant_id, last_seen_at);

ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
CREATE POLICY devices_tenant_isolation ON devices
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::bigint)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::bigint);
```

### 2.4. `calls` (Qo'ng'iroqlar va Audio Yozuvlar)
```sql
CREATE TABLE calls (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    tenant_id BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    device_id BIGINT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    user_id BIGINT NULL REFERENCES users(id) ON DELETE SET NULL,
    direction VARCHAR(20) NOT NULL,
    phone_number VARCHAR(50) NOT NULL,
    contact_name VARCHAR(255) NULL,
    duration_seconds INTEGER NOT NULL DEFAULT 0,
    sim_slot SMALLINT NOT NULL DEFAULT 0,
    sim_operator VARCHAR(100) NULL,
    recording_disk VARCHAR(50) NOT NULL DEFAULT 'private_storage',
    recording_path VARCHAR(500) NULL,
    recording_size_bytes BIGINT NULL,
    recording_status VARCHAR(30) NOT NULL DEFAULT 'none',
    call_timestamp TIMESTAMPTZ NOT NULL,
    synced_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ NULL,
    updated_at TIMESTAMPTZ NULL
);
CREATE INDEX idx_calls_tenant_ts ON calls(tenant_id, call_timestamp DESC);
CREATE INDEX idx_calls_tenant_phone ON calls(tenant_id, phone_number);
CREATE INDEX idx_calls_tenant_device ON calls(tenant_id, device_id);

ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
CREATE POLICY calls_tenant_isolation ON calls
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::bigint)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::bigint);
```

### 2.5. `tenant_integrations` (amoCRM, Bitrix24, MoySklad, BitoERP)
```sql
CREATE TABLE tenant_integrations (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    tenant_id BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    name VARCHAR(150) NOT NULL,
    credentials JSONB NOT NULL,
    settings JSONB NOT NULL DEFAULT '{"auto_create_lead": true, "sync_recordings": true, "sync_missed_calls": true}',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_synced_at TIMESTAMPTZ NULL,
    status_message TEXT NULL,
    created_at TIMESTAMPTZ NULL,
    updated_at TIMESTAMPTZ NULL,
    CONSTRAINT uq_integrations_provider UNIQUE (tenant_id, provider)
);

ALTER TABLE tenant_integrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY integrations_tenant_isolation ON tenant_integrations
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::bigint)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::bigint);
```

### 2.6. `integration_user_mappings` (Qurilma ↔ CRM Menejer)
```sql
CREATE TABLE integration_user_mappings (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    integration_id BIGINT NOT NULL REFERENCES tenant_integrations(id) ON DELETE CASCADE,
    device_id BIGINT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    crm_user_id VARCHAR(100) NOT NULL,
    crm_user_name VARCHAR(255) NULL,
    created_at TIMESTAMPTZ NULL,
    updated_at TIMESTAMPTZ NULL,
    CONSTRAINT uq_user_mappings UNIQUE (integration_id, device_id)
);
```

### 2.7. `integration_sync_logs` (Integratsiya audit jurnali)
```sql
CREATE TABLE integration_sync_logs (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    integration_id BIGINT NOT NULL REFERENCES tenant_integrations(id) ON DELETE CASCADE,
    call_id BIGINT NOT NULL REFERENCES calls(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    status VARCHAR(30) NOT NULL,
    request_payload JSONB NULL,
    response_payload JSONB NULL,
    response_code INTEGER NULL,
    error_message TEXT NULL,
    attempts SMALLINT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NULL
);
CREATE INDEX idx_sync_logs_tenant ON integration_sync_logs(tenant_id, created_at DESC);
```

---

## 3. Auth Konfiguratsiyasi — config/auth.php

Sanctum orqali mobil qurilmalarni avtorizatsiya qilish uchun alohida `device` guard va provider:
```php
'guards' => [
    'web' => ['driver' => 'session', 'provider' => 'users'],
    'device' => ['driver' => 'sanctum', 'provider' => 'devices'],
],
'providers' => [
    'users' => ['driver' => 'eloquent', 'model' => App\Models\User::class],
    'devices' => ['driver' => 'eloquent', 'model' => App\Models\Device::class],
],
```

---

## 4. Monorepo Fayl Daraxti
```
zvonkipro/
├── .github/workflows/
│   ├── backend-ci.yml
│   └── android-ci.yml
├── android/                         # Native Kotlin
│   ├── app/src/main/java/com/zvonkipro/agent/
│   │   ├── data/{local, remote, repository}/
│   │   ├── service/{CallDetectionService, AudioRecorderService, KeepAliveService}.kt
│   │   ├── workers/{CallSyncWorker, HeartbeatWorker}.kt
│   │   └── ui/{pairing, status}/
│   └── build.gradle.kts
├── app/                             # Laravel 12
│   ├── Http/Controllers/{Api, Web}/
│   ├── Http/Middleware/{SetTenantContext, SuperadminBypassTenant}.php
│   ├── Models/{Tenant, User, Device, Call, TenantIntegration}.php
│   ├── Models/Concerns/BelongsToTenant.php
│   ├── Models/Scopes/TenantScope.php
│   ├── Services/Tenancy/TenantContext.php
│   ├── Services/Integrations/{CrmManager, AmoCrmDriver, Bitrix24Driver, MoySkladDriver, BitoErpDriver}.php
│   └── Jobs/{SyncCallToIntegrationsJob, DispatchWebhookJob}.php
├── resources/js/pages/
│   ├── {Dashboard, Calls/Index, Devices/Index}.tsx
│   └── Integrations/{Index, AmoCrmConfig, UserMapping}.tsx
├── docs/ARCHITECTURE_AND_ROADMAP.md
└── .gitignore
```

---

## 5. Mobil Agent (Kotlin Native) — QR-Kod Orqali Ulanish

1. **Dashboardda QR-kod chiqarish:** Admin "Yangi telefon ulash" tugmasini bosadi. Server bir martalik `pairing_token` generatsiya qiladi:
   ```json
   {
     "endpoint": "https://app.zvonkipro.com/api/v1",
     "pairing_token": "PAIR_7xK9pQ2m",
     "tenant_name": "Artel Call Center",
     "expires_at": "2026-09-10T12:00:00Z"
   }
   ```
2. **QR-kod skanerlash:** Xodim ilovada kamerani ochib QR-kodni skanerlaydi (CameraX + ML Kit).
3. **Bog'lanish:** `POST /api/v1/devices/pair` (qurilma modeli, Android ID xeshi, SIM-kartalar).
4. **Token olish:** Server doimiy `Sanctum Device Token` qaytaradi.
5. **Xavfsiz saqlash:** `EncryptedSharedPreferences` (MasterKey AES-256 GCM).
6. **Avtomatik ishlash:** Bundan keyin foydalanuvchiga qayta login talab etilmaydi.

---

## 6. Qadam-baqadam Ishga Tushirish Yo'l Xaritasi (Phase 1 — Phase 5)

### **Phase 1: Multi-Tenant Backend Core & Ingest API**
- [ ] **1.0.** PostgreSQL o'rnatish va `.env` da `DB_CONNECTION=pgsql` ga o'tish.
- [ ] **1.1.** `composer require laravel/sanctum` o'rnatish va konfiguratsiya.
- [ ] **1.2.** `tenants` jadval migratsiyasi.
- [ ] **1.3.** Mavjud `users` migratsiyasiga `tenant_id`, `role`, `phone_number`, `is_active` ustunlarini qo'shish.
- [ ] **1.4.** `devices`, `calls`, `tenant_integrations`, `integration_user_mappings`, `integration_sync_logs` migratsiyalarini yaratish.
- [ ] **1.5.** Barcha tenant-jadvallarga PostgreSQL RLS siyosatlarini qo'llash (`users`, `devices`, `calls`, `tenant_integrations` — hammasi).
- [ ] **1.6.** `TenantContext` singleton va `SetTenantContext` middleware yaratish (`SET app.current_tenant_id` — `SET LOCAL` emas!).
- [ ] **1.7.** `BelongsToTenant` Trait va `TenantScope` ni modellar uchun tatbiq etish.
- [ ] **1.8.** `config/auth.php` da `device` guard va provider sozlash.
- [ ] **1.9.** `SuperadminBypassTenant` middleware yaratish (platforma egasi uchun RLS bypass).
- [ ] **1.10.** QR-kod orqali qurilma ulash APIsi: `POST /api/v1/devices/pair`.
- [ ] **1.11.** Telemetriya qabul qilish APIsi: `POST /api/v1/telemetry/calls` (Multipart/JSON).
- [ ] **1.12.** Heartbeat APIsi: `POST /api/v1/telemetry/heartbeat`.
- [ ] **1.13.** Pest testlar: RLS izolyatsiyasi, tenant scoping, superadmin bypass tekshiruvlari.

---

### **Phase 2: Android Native Core & Device Pairing**
- [ ] **2.1.** `android/` papkasida Jetpack Compose, Material3 va Hilt asosida loyiha skeletini yaratish.
- [ ] **2.2.** Ruxsatnomalar oqimini yaratish: `READ_PHONE_STATE`, `RECORD_AUDIO`, `POST_NOTIFICATIONS`, `READ_PHONE_NUMBERS`, `CAMERA`.
- [ ] **2.3.** CameraX + ML Kit asosida QR-kod skanerlash ekrani.
- [ ] **2.4.** `EncryptedSharedPreferences` va Retrofit interceptor (Bearer Token).
- [ ] **2.5.** `TelephonyCallback` bilan qo'ng'iroq holatlarini tutuvchi fon servisi.

---

### **Phase 3: Audio Yozish va Offline Sync (Room + WorkManager)**
- [ ] **3.1.** `ForegroundService` (`foregroundServiceType="microphone"`) — `MediaRecorder` AAC/M4A.
- [ ] **3.2.** `SubscriptionManager` — Dual-SIM aniqlash.
- [ ] **3.3.** Room Database (`LocalCallRecord`, DAO, Repository).
- [ ] **3.4.** `CallSyncWorker` (WorkManager, `NetworkType.CONNECTED`, Exponential Backoff).
- [ ] **3.5.** `HeartbeatWorker` (15 daqiqalik davriy ping).
- [ ] **3.6.** Batareya optimallashtirish chetlab o'tish onboardingi (MIUI, OneUI, HarmonyOS).

---

### **Phase 4: Tenant Dashboard & Audio Player (Inertia.js + React)**
- [ ] **4.1.** `TenantLayout` va navigatsiya.
- [ ] **4.2.** Qo'ng'iroqlar jurnali: Filtrlar, jadval, KPI kartalari.
- [ ] **4.3.** `WaveformPlayer.tsx` — Audio to'lqin vizualizatsiyasi (wavesurfer.js), tezlik nazorati (1x-2x).
- [ ] **4.4.** Qurilmalar monitoringi: Onlayn/oflayn, batareya, QR-kod generatsiya modali.
- [ ] **4.5.** Xavfsiz audio streaming marshruti (`/api/v1/calls/{uuid}/audio-stream`, HTTP Range qo'llab-quvvatlash).

---

### **Phase 5: CRM & ERP Integratsiyalari va Production Tayyorgarlik**
- [ ] **5.1.** `CrmDriverInterface` va `CrmManager` (Driver Pattern).
- [ ] **5.2.** **amoCRM Drayveri:** OAuth2 refresh oqimi, `/api/v4/contacts` qidirish/yaratish, `/api/v4/calls` voqea yozish, Redis Rate Limiter (7 req/sec).
- [ ] **5.3.** **Bitrix24 Drayveri:** `telephony.externalcall.register` va `telephony.externalcall.finish`, audio biriktirish.
- [ ] **5.4.** **MoySklad Drayveri:** JSON API 1.2 kontragent qidiruv va voqea kiritish.
- [ ] **5.5.** **BitoERP & Universal Webhook Drayveri:** REST Webhook (HMAC SHA-256).
- [ ] **5.6.** `SyncCallToIntegrationsJob` asinxron navbat va Retry Policy (3 urinish, Exponential Backoff).
- [ ] **5.7.** Integratsiyalar Dashboard UI: Ulanish modallari, User Mapping, audit loglari.
- [ ] **5.8.** Monorepo `.gitignore` yangilash (Android artefaktlar uchun).
- [ ] **5.9.** GitHub Actions CI/CD: `backend-ci.yml` va `android-ci.yml`.
- [ ] **5.10.** Yuqori yuklamada sinov (PostgreSQL indekslar, Redis navbatlar, PgBouncer).
