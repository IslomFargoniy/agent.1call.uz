# Multi-Tenant SaaS "agent.1call.uz" — Texnik Arxitektura va Implementatsiya Rejasi
**(Single Database + Centralized Auth + PostgreSQL RLS + Click/Payme Billing + Telegram Bot + CRM/ERP)**

---

## Arxitektura Xulosasi
| Qaror | Tanlangan Variant |
|-------|-------------------|
| **Multi-Tenancy modeli** | Single Database with Row-Level / Tenant Scoping (`tenant_id`) |
| **Tenantni aniqlash (Web)** | A-Variant: Markazlashgan Login → `user.tenant_id` → sessiya |
| **Tenantni aniqlash (Mobil)** | Sanctum Device Token → `device.tenant_id` |
| **Izolyatsiya** | 2 bosqichli: Laravel Eloquent TenantScope + PostgreSQL RLS |
| **Foydalanuvchi Rollari (RBAC)** | 3 ta aniq rol: `superadmin` (Platforma egasi), `admin` (Kompaniya rahbari), `operator` (Xodim) |
| **DBMS** | PostgreSQL 16+ |
| **Billing & To'lov Usullari** | 1) Click, 2) Payme (`goodoneuz/pay-uz`), 3) Karta orqali to'lov (P2P + Skrinshot yuklash & Superadmin tasdiqlashi) |
| **To'lov Tizimlari Boshqaruvi** | Superadmin to'lov usullarini Active/Passive qila oladi va Karta raqamlarini kirita oladi (`payment_methods` jadvali) |
| **Tarif Modeli** | Bazada boshqariluvchi (`tariffs`, `tariff_discounts`): Har bir telefon uchun (Dual-SIM = 1 telefon) |
| **Chegirmalar Modeli** | Oylar kesimida (3/6/12 oy) VA Qurilmalar soni kesimida (5+, 10+, 20+ telefon) chegirma foizlari |
| **Billing Dinamikasi** | Yangi telefonlar uchun **Pro-rata (Co-terming)** + **3 kunlik Grace Period** |
| **Android Audio Capture** | **AccessibilityService** + MediaRecorder AudioSource fallback (Android 10+ qo'llab-quvvatlash) |
| **Maxfiylik (Privacy)** | **Ish vaqti rejimi (Work Schedule)** va shaxsiy raqamlar filtri (Blacklist) |
| **Tezkor Bildirishnomalar** | **Telegram Bot:** Qoldirilgan qo'ng'iroqlar, kunlik hisobotlar va to'lov eslatmalari |
| **CRM/ERP Integratsiyalari** | amoCRM, Bitrix24, MoySklad, BitoERP (Driver Pattern) |
| **Server va Joylashtirish** | Linux VPS (Ubuntu 24.04, Nginx, PHP 8.3, PostgreSQL 16, Redis) |
| **Audio Saqlash & Arxiv** | Sukut bo'yicha **30 kun** saqlanadi. Uzoqroq saqlash (60, 90, 180, 365 kun) uchun alohida narx belgilash imkoniyati |
| **Audio Xotirasi** | VPS Private Storage (`storage/app/private/recordings/`) + HTTP Range streaming |
| **Superadmin Paneli** | Ichki Inertia.js/React boshqaruvi (`/admin/users`, `/admin/tenants`, `/admin/tariffs`, `/admin/payment-methods`, `/admin/invoices`) |

---

## 1. Tenant Izolyatsiyasi va RBAC Ruxsatlar Tizimi

```mermaid
flowchart TD
    Req["So'rov keladi"] --> RouteCheck{"Kanal turi"}
    
    RouteCheck -->|"Web (/login)"| WebAuth["Email + Parol"]
    RouteCheck -->|"API (/api/v1/*)"| ApiAuth["Bearer Token"]
    
    UserFound["user.tenant_id + role"]
    DeviceFound["device.tenant_id"]
    
    WebAuth --> UserFound
    ApiAuth --> DeviceFound
    
    UserFound --> SetCtx["TenantContext::setTenant"]
    DeviceFound --> SetCtx
    
    SetCtx --> SetRLS["DB: SET app.current_tenant_id"]
    SetRLS --> AppExec["Controller + RBAC Policy"]
    
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

### 1.2. 3 Ta Asosiy Rol (Superadmin, Admin, Operator) Ruxsatlar Matritsasi
| Imkoniyat / Bo'lim | Superadmin (Platforma egasi) | Admin (Kompaniya rahbari) | Operator (Xodim) |
|---|---|---|---|
| **Barcha tenantlar va tizim sozlamalari (`/admin/*`)** | ✅ To'liq nazorat | ❌ Kirish taqiqlangan | ❌ Kirish taqiqlangan |
| **To'lovlar, Tariflar va Karta sozlamalari** | ✅ Tasdiqlaydi / Narx belgilaydi | ✅ Obuna sotib oladi / To'laydi | ❌ Kirish taqiqlangan |
| **Kompaniyaning barcha qo'ng'iroqlarini ko'rish va eshitish** | ✅ Barcha kompaniyalarni | ✅ O'z kompaniyasining barcha qo'ng'iroqlarini | ❌ Faqat o'zining qo'ng'iroqlarini |
| **Audio yozuvlarni yuklab olish (Download)** | ✅ Ha | ✅ Ha | ❌ Faqat eshitish (yuklab ololmaydi) |
| **Qurilmalar qo'shish va QR-kod chiqarish** | ✅ Ha | ✅ Ha | ❌ Yo'q |
| **CRM/ERP integratsiyalari sozlash (amoCRM, MoySklad)** | ✅ Ha | ✅ Ha | ❌ Kirish taqiqlangan |
| **Ish grafigi va maxfiylik sozlamalari** | ✅ Ha | ✅ Ha | ❌ Kirish taqiqlangan |

### 1.3. Superadmin Ichki Boshqaruv Sahifasi (`/admin/users` va `/admin/tenants`)
Alohida og'ir paketlar (masalan Filament) o'rnatilmaydi. Mavjud Inertia.js + React stekida faqat `role === 'superadmin'` foydalanuvchilari uchun yengil boshqaruv sahifalari yaratiladi:
1. **`/admin/users`:**
   - Platformadagi barcha tenantlar xodimlarining yagona jadvali.
   - Filtrlash (Tenant bo'yicha, rol bo'yicha, status bo'yicha).
   - Foydalanuvchini bloklash, faollashtirish yoki parolini yangilash.
2. **`/admin/tenants`:**
   - Barcha kompaniyalar (tenantlar) ro'yxati, ularning joriy tarifi, faol telefonlari soni va obuna tugash sanasi.
   - Obunani qo'lda uzaytirish (masalan, to'lov bank orqali kelib tushganda yoki do'stona trial berilganda).
3. **`/admin/tariffs`:**
   - Asosiy tariflar va baza narxini belgilash (1 ta telefon uchun oylik narx).
   - **Audio arxiv saqlash muddati narxlari:** Standart kunlar (30 kun) va 60, 90, 180, 365 kunlik arxiv saqlash uchun qo'shimcha oylik narxlarni belgilash.
   - **Oylar kesimidagi chegirmalar:** 3, 6, 12 oylik chegirma foizlarini qo'shish/tahrirlash.
   - **Qurilmalar soni kesimidagi chegirmalar:** Qanchadir miqdordan ortiq telefonlar uchun hajm chegirmalarini (masalan, 5+, 10+, 20+ telefon) belgilash.
4. **`/admin/payment-methods` (To'lov Tizimlari Sozlamalari):**
   - Click, Payme va Karta to'lov usullarini **Active / Passive** (yoqish/o'chirish) boshqaruvi.
   - Karta to'lovi uchun Karta raqami (masalan: `8600 1234 5678 9012`), Karta egasi ismi va bank nomini kiritish/yangilash.
5. **`/admin/invoices` (To'lovlarni Tasdiqlash Navbati):**
   - Karta orqali qilingan to'lovlar skrinshotlarini kattalashtirib ko'rish.
   - Bitta tugma bilan **"Tasdiqlash" (Approve)** → tenant obunasini avtomatik uzaytirish yoki **"Rad etish" (Reject)**.
   - RLS bu sahifalarda `SuperadminBypassTenant` middleware orqali avtomatik chetlab o'tiladi.

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
    allowed_devices_count INTEGER NOT NULL DEFAULT 2, -- Sotib olingan faol telefon slotlari
    audio_retention_days INTEGER NOT NULL DEFAULT 30, -- Audio saqlash muddati (standart: 30 kun)
    subscription_expires_at TIMESTAMPTZ NULL,        -- Obuna rasmiy tugash sanasi
    grace_period_ends_at TIMESTAMPTZ NULL,           -- 3 kunlik imtiyozli davr tugash sanasi
    trial_ends_at TIMESTAMPTZ NULL,                  -- Bepul sinov davri (masalan, 14 kun)
    work_schedule JSONB NOT NULL DEFAULT '{
        "enabled": false,
        "work_days": [1, 2, 3, 4, 5],
        "start_time": "09:00",
        "end_time": "18:00",
        "timezone": "Asia/Tashkent"
    }',                                              -- Kompaniya umumiy ish grafigi
    privacy_blacklist JSONB NOT NULL DEFAULT '[]',   -- Yozilmaydigan maxfiy/shaxsiy raqamlar maskalari
    telegram_chat_id VARCHAR(100) NULL,             -- Bildirishnomalar uchun Telegram guruh/kanal ID si
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NULL,
    updated_at TIMESTAMPTZ NULL
);
```

### 2.2. `users` (3 darajali RBAC bilan)
```sql
ALTER TABLE users
    ADD COLUMN tenant_id BIGINT REFERENCES tenants(id) ON DELETE CASCADE,
    ADD COLUMN role VARCHAR(50) NOT NULL DEFAULT 'operator', -- superadmin, admin, operator
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
> [!IMPORTANT]
> **Dual-SIM Qoidasi:** Bitta jismoniy smartfonda 2 ta SIM karta bo'lishi billing va litsenziyaga ta'sir qilmaydi! SIM ma'lumotlari `sim_slots_info` ustunida saqlanadi va 1 ta litsenziya deb hisoblanadi.
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
    accessibility_service_enabled BOOLEAN NOT NULL DEFAULT FALSE, -- Ovoz yozish xizmati holati
    battery_level SMALLINT NULL,
    is_charging BOOLEAN NOT NULL DEFAULT FALSE,
    work_schedule_override JSONB NULL,           -- Xodim uchun maxsus individual grafik (agar kerak bo'lsa)
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
    direction VARCHAR(20) NOT NULL,              -- inbound, outbound, missed
    phone_number VARCHAR(50) NOT NULL,
    contact_name VARCHAR(255) NULL,
    duration_seconds INTEGER NOT NULL DEFAULT 0,
    sim_slot SMALLINT NOT NULL DEFAULT 0,        -- 0 (SIM 1) yoki 1 (SIM 2)
    sim_operator VARCHAR(100) NULL,
    recording_disk VARCHAR(50) NOT NULL DEFAULT 'private_storage',
    recording_path VARCHAR(500) NULL,
    recording_size_bytes BIGINT NULL,
    recording_status VARCHAR(30) NOT NULL DEFAULT 'none', -- none, uploaded, processing, failed
    audio_source_type VARCHAR(50) NULL,          -- accessibility_service, mic, voice_communication
    is_work_hours BOOLEAN NOT NULL DEFAULT TRUE, -- Ish vaqtida bo'lganmi
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

### 2.5. `tariffs` (Asosiy Bosh Tariflar Jadvali)
> [!NOTE]
> Ushbu jadval global konfiguratsiya hisoblanadi (barcha tenantlar uchun umumiy, RLS talab etilmaydi). Superadmin tomonidan boshqariladi.
```sql
CREATE TABLE tariffs (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,                 -- Masalan: "Standart Korporativ"
    code VARCHAR(50) UNIQUE NOT NULL,           -- Masalan: "standard"
    description TEXT NULL,
    base_price_monthly NUMERIC(12, 2) NOT NULL, -- 1 ta telefon uchun 1 oylik baza narxi (masalan: 50 000 UZS)
    currency VARCHAR(3) NOT NULL DEFAULT 'UZS',
    min_devices INTEGER NOT NULL DEFAULT 1,     -- Minimal sotib olinadigan slotlar
    default_retention_days INTEGER NOT NULL DEFAULT 30, -- Standart kiritilgan audio arxiv muddati (30 kun)
    trial_days INTEGER NOT NULL DEFAULT 14,     -- Bepul sinov kunlari
    trial_device_slots INTEGER NOT NULL DEFAULT 2, -- Sinovdagi bepul qurilmalar
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NULL,
    updated_at TIMESTAMPTZ NULL
);
```

### 2.6. `tariff_discounts` (Qurilmalar Soni va Oylar Kesimidagi Chegirmalar)
> [!IMPORTANT]
> Superadmin istalgan paytda ushbu jadval orqali oylar yoki qurilmalar miqdori bo'yicha chegirma foizlarini erkin boshqara oladi.
```sql
CREATE TABLE tariff_discounts (
    id BIGSERIAL PRIMARY KEY,
    tariff_id BIGINT NOT NULL REFERENCES tariffs(id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL,                  -- 'period' (oylar bo'yicha) yoki 'device_volume' (qurilmalar soni bo'yicha)
    min_value INTEGER NOT NULL,                 -- Minimal chegara (oylar soni: 3, 6, 12 yoki qurilmalar soni: 5, 10, 20)
    max_value INTEGER NULL,                     -- Maksimal chegara (masalan: 9 ta telefon, NULL = cheksiz)
    discount_percent NUMERIC(5, 2) NOT NULL,    -- Chegirma foizi (masalan: 5.00, 10.00, 15.00, 20.00 %)
    description VARCHAR(255) NULL,              -- Masalan: "10 tadan ortiq telefon uchun 10% chegirma"
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NULL,
    updated_at TIMESTAMPTZ NULL,
    CONSTRAINT uq_tariff_discount UNIQUE (tariff_id, type, min_value)
);
CREATE INDEX idx_tariff_discounts ON tariff_discounts(tariff_id, type, is_active);
```

### 2.7. `tariff_retention_options` (Audio Arxivini Uzoqroq Saqlash Narxlari)
> [!NOTE]
> Standart holatda audio arxiv 30 kun bepul saqlanadi. Mijoz audiolarni 60, 90, 180 yoki 365 kun saqlashni xohlasa, Superadmin ushbu jadval orqali qo'shimcha oylik narx belgilaydi.
```sql
CREATE TABLE tariff_retention_options (
    id BIGSERIAL PRIMARY KEY,
    tariff_id BIGINT NOT NULL REFERENCES tariffs(id) ON DELETE CASCADE,
    retention_days INTEGER NOT NULL,               -- 60, 90, 180, 365 kun
    name VARCHAR(100) NOT NULL,                    -- Masalan: "60 kunlik arxiv (+30 kun)", "1 yillik arxiv"
    additional_price_monthly NUMERIC(12, 2) NOT NULL DEFAULT 0, -- 1 ta telefon uchun oylik qo'shimcha narx
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NULL,
    updated_at TIMESTAMPTZ NULL,
    CONSTRAINT uq_retention_days UNIQUE (tariff_id, retention_days)
);
```

### 2.8. `subscriptions` (Tarif va Obunalar)
```sql
CREATE TABLE subscriptions (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    tenant_id BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    tariff_id BIGINT NULL REFERENCES tariffs(id) ON DELETE SET NULL,
    period_months SMALLINT NOT NULL,              -- 3, 6, 12 oy
    device_count INTEGER NOT NULL,               -- Obunadagi telefonlar soni
    unit_price_monthly NUMERIC(12, 2) NOT NULL,  -- 1 ta telefon uchun 1 oylik baza narxi
    retention_days INTEGER NOT NULL DEFAULT 30,  -- Tanlangan audio arxiv muddati (30, 60, 90, 180, 365 kun)
    retention_addon_price_monthly NUMERIC(12, 2) NOT NULL DEFAULT 0, -- Arxiv muddati uchun oylik qo'shimcha narx
    period_discount_percent NUMERIC(5, 2) NOT NULL DEFAULT 0, -- Oylar kesimidagi chegirma foizi
    volume_discount_percent NUMERIC(5, 2) NOT NULL DEFAULT 0, -- Qurilmalar soni bo'yicha chegirma foizi
    total_discount_percent NUMERIC(5, 2) NOT NULL DEFAULT 0,  -- Jami qo'llangan chegirma foizi
    total_amount NUMERIC(14, 2) NOT NULL,        -- Umumiy to'lov summasi
    is_prorated BOOLEAN NOT NULL DEFAULT FALSE,  -- Pro-rata orqali qo'shilgan slotmi
    currency VARCHAR(3) NOT NULL DEFAULT 'UZS',
    starts_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'pending', -- pending, active, expired, cancelled
    created_at TIMESTAMPTZ NULL,
    updated_at TIMESTAMPTZ NULL
);
CREATE INDEX idx_subscriptions_tenant ON subscriptions(tenant_id, status);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY subscriptions_tenant_isolation ON subscriptions
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::bigint)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::bigint);
```

### 2.9. `payment_methods` (To'lov Tizimlari va Karta Sozlamalari)
> [!NOTE]
> Global konfiguratsiya jadvali (RLS talab etilmaydi). Superadmin qaysi to'lov usullari faol bo'lishini va karta rekvizitlarini boshqaradi.
```sql
CREATE TABLE payment_methods (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,            -- 'click', 'payme', 'card_transfer'
    name VARCHAR(100) NOT NULL,                  -- 'Click', 'Payme', 'Karta orqali to''lov (P2P)'
    is_active BOOLEAN NOT NULL DEFAULT TRUE,     -- Active / Passive holati
    settings JSONB NULL DEFAULT '{}',            -- Karta uchun: {"card_number": "8600 1234 5678 9012", "card_holder": "Islombek F.", "bank_name": "Kapitalbank"}
    instructions TEXT NULL,                      -- To'lov ko'rsatmalari (mijozga ko'rsatiladigan matn)
    sort_order SMALLINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NULL,
    updated_at TIMESTAMPTZ NULL
);
```

### 2.10. `invoices` (Hisob-fakturalar, Skrinshotlar va To'lovlar)
```sql
CREATE TABLE invoices (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    tenant_id BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    subscription_id BIGINT NULL REFERENCES subscriptions(id) ON DELETE SET NULL,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,    -- Masalan: INV-202609-00042
    amount NUMERIC(14, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'UZS',
    payment_method VARCHAR(30) NOT NULL,          -- 'click', 'payme', 'card_transfer'
    transaction_id VARCHAR(100) NULL,             -- Provider / pay_uz tranzaksiya ID si
    receipt_image_path VARCHAR(500) NULL,         -- Karta to'lovida yuklangan skrinshot fayl yo'li
    status VARCHAR(30) NOT NULL DEFAULT 'pending', -- 'pending', 'reviewing' (skrinshot tekshiruvda), 'paid', 'rejected', 'cancelled'
    rejection_reason TEXT NULL,                   -- Rad etilgan bo'lsa sababi
    approved_by BIGINT NULL REFERENCES users(id), -- Tasdiqlagan superadmin ID si
    approved_at TIMESTAMPTZ NULL,
    paid_at TIMESTAMPTZ NULL,
    meta JSONB NULL,
    created_at TIMESTAMPTZ NULL,
    updated_at TIMESTAMPTZ NULL
);
CREATE INDEX idx_invoices_tenant ON invoices(tenant_id, status);
CREATE INDEX idx_invoices_status ON invoices(status);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY invoices_tenant_isolation ON invoices
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::bigint)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::bigint);
```

---

## 3. Billing, Pro-rata va Grace Period Mexanizmi

### 3.1. Tariflash Qoidalari va Dinamik Chegirmalar Dvigateli (Bazada boshqariladi)
To'lov summasi bazadagi `tariffs` va `tariff_discounts` jadvallari qoidalariga asosan dinamik hisoblanadi:

1. **Hisob-kitob Birligi:** Faqat ulangan **mobil telefonlar (Handset / Qurilma)** soni bo'yicha. Bitta telefonda 2 ta SIM-karta bo'lsa ham, 1 ta litsenziya narxida to'lanadi.
2. **Ikkitalik Dinamik Chegirmalar (Combined Discounts):**
   - **A) Oylar kesimidagi chegirmalar (`type = 'period'`):**
     * 3 oy: 0%
     * 6 oy: 10%
     * 12 oy: 20%
   - **B) Qurilmalar soni (Hajm) kesimidagi chegirmalar (`type = 'device_volume'`):**
     * 1 - 4 ta telefon: 0%
     * 5 - 9 ta telefon: 5% chegirma
     * 10 - 19 ta telefon: 10% chegirma
     * 20+ ta telefon: 15% chegirma
3. **Hisoblash Formulalari:**
   $$\\text{Baza Summa} = \\text{Telefonlar Soni} \\times \\text{Baza Narx (tariffs.base_price_monthly)} \\times \\text{Oylar Soni}$$
   $$\\text{Jami Chegirma \\%} = \\text{Davr Chegirmasi \\%} + \\text{Hajm Chegirmasi \\%}$$
   $$\\text{Yakuniy To'lov Summasi} = \\text{Baza Summa} \\times \\left(1 - \\frac{\\text{Jami Chegirma \\%}}{100}\\right)$$

*Misollar jadvali (Baza narx = 50 000 UZS):*
| Telefonlar | Davr | Baza Summa | Davr Chegirmasi | Hajm Chegirmasi | Jami Chegirma | Yakuniy To'lov | Tejamkorlik |
|---|---|---|---|---|---|---|---|
| **3 ta** | 3 oy | 450 000 UZS | 0% | 0% | **0%** | **450 000 UZS** | 0 UZS |
| **5 ta** | 6 oy | 1 500 000 UZS | 10% | 5% | **15%** | **1 275 000 UZS** | 225 000 UZS |
| **10 ta** | 12 oy | 6 000 000 UZS | 20% | 10% | **30%** | **4 200 000 UZS** | 1 800 000 UZS |
| **25 ta** | 12 oy | 15 000 000 UZS | 20% | 15% | **35%** | **9 750 000 UZS** | 5 250 000 UZS |

4. **Audio Arxivini Saqlash Muddati va Narxi (Retention Extension):**
   - **Standart (Default): 30 kun** — Har qanday tarif ichida mutlaqo bepul (0 UZS).
   - **Qo'shimcha muddatlar:** Agar kompaniya audiolarni 30 kundan uzoqroq saqlamoqchi bo'lsa, Superadmin belgilagan qo'shimcha oylik tarif qo'shiladi:
     * 30 kun (Standart): +0 UZS / oy / telefon
     * 60 kun: +10 000 UZS / oy / telefon
     * 90 kun: +20 000 UZS / oy / telefon
     * 180 kun (6 oy): +35 000 UZS / oy / telefon
     * 365 kun (1 yil): +60 000 UZS / oy / telefon
   - **Hisoblash Formulasi:**
     $$\\text{1 ta Telefon Oylik Narxi} = \\text{Baza Narx (50 000)} + \\text{Arxiv Muddati Narxi}$$
     $$\\text{Baza Summa} = \\text{Telefonlar Soni} \\times \\text{1 ta Telefon Oylik Narxi} \\times \\text{Oylar Soni}$$
     $$\\text{Yakuniy To'lov} = \\text{Baza Summa} \\times \\left(1 - \\frac{\\text{Jami Chegirma \\%}}{100}\\right)$$
5. **Eskirgan Audiolarni Avtomatik Tozalash (Retention Cleanup Job):**
   - Har kecha ishga tushadigan `PruneExpiredRecordingsJob` cron-vazifasi:
     * Har bir tenantning `audio_retention_days` muddatini o'qiydi (masalan, 30 kun).
     * `call_timestamp < (NOW() - audio_retention_days)` bo'lgan qo'ng'iroqlarning diskdagi audio faylini o'chiradi (`unlink`).
     * Qo'ng'iroqning o'zi, statistikasi (raqam, davomiylik, xodim, sana) bazada abadiy saqlanadi, faqat `recording_status = 'expired'` qilib qo'yiladi.


### 3.2. To'lov Usullari va Karta Orqali To'lov (P2P + Skrinshot) Oqimi

Tizimda 3 xil to'lov usuli mavjud:
1. **Click** (Avtomatik merchant to'lovi via `goodoneuz/pay-uz`)
2. **Payme** (Avtomatik merchant to'lovi via `goodoneuz/pay-uz`)
3. **Karta orqali to'lov (P2P o'tkazma):**
   - Mijoz tarifni tanlaganda ekranda Superadmin kiritgan faol karta raqami ko'rsatiladi (masalan: `8600 1234 5678 9012`, Islombek F., Kapitalbank).
   - Mijoz to'lovni amalga oshirib, chek skrinshotini (PNG/JPG) tizimga yuklaydi.
   - Invoys statusi `reviewing` (Tekshiruvda) holatiga o'tadi.
   - Superadminga Telegram orqali darhol xabarnoma boradi: *"🔔 Yangi to'lov skrinshoti! Tenant: 'Artel', Summa: 1 275 000 UZS"*.
   - Superadmin `/admin/invoices` sahifasida skrinshotni tekshirib, **"Tasdiqlash" (Approve)** tugmasini bosadi.
   - Tasdiqlanishi bilan obuna avtomatik uzaytiriladi va tenantga Telegramda xabar boradi.

```mermaid
sequenceDiagram
    autonumber
    actor Client as Tenant Admin
    participant Web as Web Dashboard
    participant Backend as Laravel Backend
    actor Super as Superadmin
    participant TG as Telegram Bot
    participant DB as PostgreSQL DB

    Client->>Web: Tarif (5 ta telefon, 6 oy) va "Karta orqali to'lash"ni tanlaydi
    Web->>Client: Superadmin kartasi (8600...) va to'lov summasi ko'rsatiladi
    Client->>Client: Bank ilovasidan (Click/Payme/Uzum) kartaga pul o'tkazadi
    Client->>Web: To'lov skrinshotini yuklaydi (PNG/JPG)
    Web->>Backend: POST /billing/upload-receipt {invoice_id, image}
    Backend->>DB: Invoices status = 'reviewing', receipt_image_path saqlanadi
    Backend->>TG: Superadminga xabar: "🔔 Yangi to'lov skrinshoti keldi! Summa: 1 275 000 UZS"
    Web-->>Client: "To'lovingiz qabul qilindi. Superadmin tasdiqlashi kutilmoqda..."
    Super->>Web: /admin/invoices sahifasiga kiradi, skrinshotni tekshiradi
    Super->>Web: "Tasdiqlash (Approve)" tugmasini bosadi
    Web->>Backend: POST /admin/invoices/{id}/approve
    Backend->>DB: Invoices status = 'paid', Subscriptions status = 'active'
    Backend->>DB: Tenant: allowed_devices_count va subscription_expires_at yangilanadi
    Backend->>TG: Tenantga xabar: "✅ To'lovingiz tasdiqlandi! Obuna faollashdi."
```

### 3.3. Pro-rata (Co-terming) Yangi Telefon Qo'shish Kalkulyatori
Mijozda joriy obuna davom etayotgan bo'lsa va qo'shimcha yangi telefonlar ulamoqchi bo'lsa, ularning muddati alohida hisoblanmaydi, balki **mavjud obunaning tugash sanasiga moslanadi**:

$$\text{Qolgan Kunlar} = \text{tenant.subscription\_expires\_at} - \text{NOW()}$$
$$\text{Kunlik Narx} = \frac{\text{1 ta telefonning oylik narxi}}{30}$$
$$\text{Pro-rata To'lov} = \text{Yangi Telefonlar Soni} \times \text{Kunlik Narx} \times \text{Qolgan Kunlar}$$

*Natija:* Barcha telefonlarning tugash sanasi yagona bo'ladi, hisob-kitobda chalkashlik bo'lmaydi.

### 3.4. 3 Kunlik "Grace Period" (Imtiyozli Davr) Siyosati
- Obuna muddati tugagach (`subscription_expires_at < now()`), xizmat darhol o'chirilmaydi.
- Avtomatik `grace_period_ends_at = subscription_expires_at + INTERVAL '3 days'` faollashadi:
  - **Ilova va qo'ng'iroqlar:** 3 kun davomida odatdagidek yoziladi va serverga qabul qilinadi.
  - **Dashboard:** Qizil ogohlantirish bannari chiqadi: *"Obuna muddati tugadi! Xizmat to'xtatilishiga X kun qoldi. Hozir to'lang."*
  - **Telegram Bot:** Rahbarga har kuni ertalab to'lov havolasi yuboriladi.
- 3 kunlik Grace Period ham tugagach (`now() > grace_period_ends_at`):
  - Telemetriya qabul qilish to'xtatiladi (`402 Payment Required`).
  - Web panelda faqat Billing sahifasi ochiq qoladi.

---

## 4. Android Audio Capture (AccessibilityService) & Maxfiylik Rejimi

### 4.1. Android 10+ (API 29+) Ovoz Yozish Strategiyasi
Google Android 10 dan boshlab standart `VOICE_CALL` manbasini cheklaganligi sababli, ilovada ko'p bosqichli mexanizm ishlatiladi:
1. **AccessibilityService (Asosiy Yechim):**
   - Ilova o'rnatilganda foydalanuvchidan "Maxsus imkoniyatlar" (Accessibility Service) ruxsatnomasi so'raladi.
   - Bu servis qo'ng'iroqning aniq audio oqimini har qanday Android versiyasida (Android 10, 11, 12, 13, 14, 15) to'liq va ikki tomonlama sifatli yozib olish imkonini beradi.
2. **Fallback Audio Manbalari:**
   - Agar biror qurilmada Accessibility ruxsati berilmasa: `MediaRecorder.AudioSource.VOICE_COMMUNICATION` -> `MediaRecorder.AudioSource.MIC` kombinatsiyasi ishlatiladi.

### 4.2. "Ish Vaqti" va Maxfiylik Rejimi (Work Schedule & Privacy)
Xodimlarning shaxsiy hayotini himoya qilish va korporativ axloq qoidalariga rioya qilish uchun:
1. **Ish Grafigi Tekshiruvi:**
   - Har bir qo'ng'iroq boshlanganda Android agent qurilma vaqti va tenantning `work_schedule` (masalan: Dush-Juma, 09:00 - 18:00) jadvalini solishtiradi.
   - Ish vaqtidan tashqaridagi qo'ng'iroqlar ilova tomonidan **umuman yozilmaydi va audio fayl saqlanmaydi**.
2. **Qora Ro'yxat (Blacklist):**
   - Shaxsiy yoki yaqin qarindoshlar raqamlari qora ro'yxatga kiritilsa, bu raqamlar bilan bo'lgan suhbatlar avtomatik filtrlanadi va serverga jo'natilmaydi.

---

## 5. agent.1call.uz Telegram Boti (Real-time Xabarnomalar)

### 5.1. Bot Funksional Imkoniyatlari
- **Qoldirilgan Qo'ng'iroqlar (Missed Call Alert):** Operator mijoz qo'ng'irog'iga javob bermasa, 60 soniya ichida rahbar yoki bo'lim guruhiga xabar keladi:
  > ⚠️ **Qoldirilgan qo'ng'iroq!**  
  > 📞 Raqam: `+998 90 123 45 67`  
  > 👤 Biriktirilgan xodim: Sardor Karimov (SIM 1 - Ucell)  
  > 🕒 Vaqt: 14:32:10  
  > 🔗 *[Mijozga qayta qo'ng'iroq qilish](tel:+998901234567)*
- **Kunlik Xulosa (Daily Digest):** Har kuni soat 19:00 da:
  > 📊 **Bugungi qo'ng'iroqlar hisoboti (10.09.2026):**  
  > • Jami qo'ng'iroqlar: **284 ta**  
  > • Kiruvchi: **192 ta** (Javob berildi: 95%)  
  > • Chiquvchi: **92 ta**  
  > • Qoldirilgan: **10 ta**  
  > 🏆 Eng faol operator: **Shahnoza Rahimova** (64 ta qo'ng'iroq)
- **Billing Eslatmalari:** Obuna tugashiga 7 kun, 3 kun qolganda va Grace Period davrida to'g'ridan-to'g'ri Click va Payme to'lov havolalari yuboriladi.

---

## 6. Monorepo Fayl Daraxti
```
agent.1call.uz/
├── .github/workflows/
│   ├── backend-ci.yml
│   └── android-ci.yml
├── android/                         # Native Kotlin
│   ├── app/src/main/java/uz/onecall/agent/
│   │   ├── data/{local, remote, repository}/
│   │   ├── service/
│   │   │   ├── CallAccessibilityService.kt   # Android 10+ audio capture servisi
│   │   │   ├── CallDetectionService.kt
│   │   │   ├── AudioRecorderService.kt
│   │   │   └── KeepAliveService.kt
│   │   ├── filter/
│   │   │   └── WorkHoursFilter.kt            # Ish vaqti va blacklist filtri
│   │   ├── workers/{CallSyncWorker, HeartbeatWorker}.kt
│   │   └── ui/{pairing, permissions, status}/
│   └── build.gradle.kts
├── app/                             # Laravel 12
│   ├── Http/Controllers/Api/
│   │   ├── DevicePairingController.php
│   │   ├── TelemetryIngestController.php
│   │   └── PaymentWebhookController.php      # Click va Payme callbacklari
│   ├── Http/Controllers/Web/
│   │   ├── Admin/
│   │   │   ├── SuperadminUsersController.php    # Superadmin barcha foydalanuvchilar sahifasi
│   │   │   ├── SuperadminTenantsController.php  # Superadmin barcha tenantlar sahifasi
│   │   │   └── SuperadminTariffsController.php  # Tariflar va chegirmalarni boshqarish
│   │   ├── DashboardController.php
│   │   ├── CallsController.php
│   │   ├── DevicesController.php
│   │   ├── BillingController.php             # Pro-rata, Click/Payme to'lov
│   │   ├── SettingsController.php            # Ish grafigi va maxfiylik
│   │   └── IntegrationsController.php
│   ├── Http/Middleware/
│   │   ├── SetTenantContext.php
│   │   ├── SuperadminBypassTenant.php
│   │   ├── CheckTenantSubscription.php       # Grace period & Expiry tekshiruvi
│   │   └── RoleMiddleware.php                # Superadmin / Admin / Operator RBAC
│   ├── Models/
│   │   ├── Tenant.php
│   │   ├── User.php
│   │   ├── Device.php
│   │   ├── Call.php
│   │   ├── Tariff.php                       # Asosiy tarif modeli
│   │   ├── TariffDiscount.php               # Oylar va qurilmalar hajm chegirmalari
│   │   ├── TariffRetentionOption.php        # Audio arxivini uzoqroq saqlash narxlari modeli
│   │   ├── PaymentMethod.php                # To'lov usuli modeli (Click, Payme, Karta)
│   │   ├── Subscription.php
│   │   ├── Invoice.php
│   │   └── TenantIntegration.php
│   ├── Services/Billing/
│   │   ├── BillingCalculator.php             # 3/6/12 oy, chegirmalar, Pro-rata
│   │   └── SubscriptionService.php
│   ├── Services/Telegram/
│   │   └── TelegramNotificationService.php   # Qoldirilgan qo'ng'iroq va hisobotlar
│   ├── Services/Integrations/{CrmManager, AmoCrmDriver, Bitrix24Driver, MoySkladDriver, BitoErpDriver}.php
│   └── Jobs/{SyncCallToIntegrationsJob, SendTelegramAlertJob, PruneExpiredRecordingsJob}.php
├── resources/js/pages/
│   ├── {Dashboard, Calls/Index, Devices/Index}.tsx
│   ├── Admin/
│   │   ├── Users/Index.tsx                      # Superadmin Users sahifasi
│   │   ├── Tenants/Index.tsx                    # Superadmin Tenants sahifasi
│   │   ├── Tariffs/Index.tsx                    # Tariflar va oylar/hajm chegirmalari boshqaruvi
│   │   ├── PaymentMethods/Index.tsx             # To'lov tizimlarini active/passive qilish & karta raqami
│   │   └── Invoices/Index.tsx                   # Skrinshotlarni ko'rish va tasdiqlash (Approve/Reject)
│   ├── Billing/{Index, Invoices}.tsx
│   ├── Settings/{WorkSchedule, Privacy}.tsx
│   └── Integrations/{Index, AmoCrmConfig, UserMapping}.tsx
├── docs/ARCHITECTURE_AND_ROADMAP.md
└── .gitignore
```

---

## 7. Qadam-baqadam Ishga Tushirish Yo'l Xaritasi (Phase 1 — Phase 6)

### **Phase 1: Multi-Tenant Backend Core & RBAC Ingest API**
- [ ] **1.0.** PostgreSQL o'rnatish va `.env` da `DB_CONNECTION=pgsql` ga o'tish.
- [ ] **1.1.** Paketlarni o'rnatish: `laravel/sanctum`, `goodoneuz/pay-uz`.
- [ ] **1.2.** `tenants` jadvali migratsiyasi (`allowed_devices_count`, `subscription_expires_at`, `grace_period_ends_at`, `work_schedule`, `privacy_blacklist`).
- [ ] **1.3.** `users` jadvaliga `tenant_id`, `role` (`superadmin`, `admin`, `operator`) ustunlarini qo'shish.
- [ ] **1.4.** Baza migratsiyalari: `tariffs`, `tariff_discounts` (boshlang'ich qiymatlar bilan seed), `devices`, `calls`, `subscriptions` (chegirmalar ustunlari bilan), `invoices`, `tenant_integrations`, `integration_user_mappings`, `integration_sync_logs` va `pay-uz`.
- [ ] **1.5.** Barcha tenant-jadvallarga PostgreSQL RLS siyosatlarini qo'llash.
- [ ] **1.6.** `TenantContext` singleton va `SetTenantContext` middleware.
- [ ] **1.7.** `RoleMiddleware` (Superadmin, Admin, Operator ruxsatlarini ajratish).
- [ ] **1.8.** `SuperadminBypassTenant` middleware.
- [ ] **1.9.** `POST /api/v1/devices/pair` APIsi (`allowed_devices_count` kvotasi tekshiruvi bilan).
- [ ] **1.10.** Telemetriya qabul qilish APIsi: `POST /api/v1/telemetry/calls`.
- [ ] **1.11.** Heartbeat APIsi: `POST /api/v1/telemetry/heartbeat`.
- [ ] **1.12.** Pest testlar: RLS izolyatsiyasi, RBAC tekshiruvlari, device kvotasi.

---

### **Phase 2: Android Native Core & Accessibility Setup**
- [ ] **2.1.** Jetpack Compose, Material3 va Hilt asosida Android loyiha skeletini yaratish.
- [ ] **2.2.** Ruxsatnomalar onboardingi: `READ_PHONE_STATE`, `RECORD_AUDIO`, `POST_NOTIFICATIONS`, `CAMERA`.
- [ ] **2.3.** `AccessibilityService` ruxsatnoma oqimi va xizmatni sozlash ekrani.
- [ ] **2.4.** CameraX + ML Kit asosida QR-kod skanerlash va token olish.
- [ ] **2.5.** `EncryptedSharedPreferences` xavfsiz token saqlash.

---

### **Phase 3: Android Audio Yozish, Maxfiylik va Offline Sync**
- [ ] **3.1.** `CallAccessibilityService` — Android 10+ da qo'ng'iroq ovozini ishonchli yozib olish servisi.
- [ ] **3.2.** `WorkHoursFilter` — Ish grafigi va qora ro'yxat tekshiruvi (shaxsiy qo'ng'iroqlarni yozmaslik).
- [ ] **3.3.** Dual-SIM aniqlash (`SubscriptionManager` orqali ikkala SIMni aniqlab, 1 ta qurilma telemetriyasi sifatida uzatish).
- [ ] **3.4.** Room Database (`LocalCallRecord`, DAO, Repository).
- [ ] **3.5.** `CallSyncWorker` (WorkManager, avtomatik sinxronizatsiya va qayta urinish).
- [ ] **3.6.** Batareya optimallashtirish chetlab o'tish onboardingi (MIUI, OneUI, HarmonyOS).

---

### **Phase 4: Tenant Dashboard, RBAC & Audio Player (Inertia.js + React)**
- [ ] **4.1.** `TenantLayout` va rollar bo'yicha navigatsiya (Admin barcha bo'limlarga, Operator faqat o'z qo'ng'iroqlariga kiradi).
- [ ] **4.2.** Grace Period ogohlantirish banneri.
- [ ] **4.3.** Qo'ng'iroqlar jurnali: Filtrlar, KPI kartalari, qoldirilgan qo'ng'iroqlar belgisi.
- [ ] **4.4.** `WaveformPlayer.tsx` — Audio to'lqin vizualizatsiyasi (wavesurfer.js), xavfsiz streaming (Signed URL, yuklab olishni taqiqlash).
- [ ] **4.5.** Qurilmalar monitoringi va QR-kod generatsiya modali.
- [ ] **4.6.** Ish grafigi va Maxfiylik sozlamalari sahifasi (`Settings/WorkSchedule.tsx`).
- [ ] **4.7.** **Superadmin Sahifalari:**
  - `/admin/users` (barcha xodimlar boshqaruvi).
  - `/admin/tenants` (kompaniyalar va obuna boshqaruvi).
  - `/admin/tariffs` (baza narx, oylar kesimidagi chegirmalar va qurilmalar soni bo'yicha chegirma foizlarini boshqarish).

---

### **Phase 5: Billing, Pro-rata va To'lov Tizimi (Click, Payme, goodoneuz/pay-uz)**
- [ ] **5.1.** `config/pay-uz.php` sozlash (Click va Payme merchant kalitlari).
- [ ] **5.2.** `BillingCalculator` servisi:
  - Baza narx + tanlangan arxiv muddati qo'shimcha narxi (30 kun bepul, 60/90/180/365 kunlik narxlar).
  - Oylar va qurilmalar soni bo'yicha dinamik chegirmalar kalkulyatori.
  - Bazadagi `tariffs` va `tariff_discounts` jadvallaridan oylar va qurilmalar soni chegirmalarini dinamik o'qib hisoblovchi dvigatel.
  - Yangi telefonlar uchun **Pro-rata (Co-terming)** kalkulyatori.
- [ ] **5.3.** `SubscriptionService` (yangi obuna, hisob-faktura, slotlar soni va muddatni yangilash).
- [ ] **5.4.** Gateway Webhook integratsiyasi: `POST /payment/payme` va `POST /payment/click`.
- [ ] **5.5.** **3 kunlik Grace Period** mexanizmi va `CheckTenantSubscription` middleware.
- [ ] **5.6.** Billing UI: `Billing/Index.tsx` (tarif kalkulyatori, Pro-rata qo'shimcha slotlar, Click/Payme tugmalari), `Billing/Invoices.tsx`.

---

### **Phase 6: Telegram Bot, CRM Integratsiyalari va Production**
- [ ] **6.1.** **Telegram Bot integratsiyasi:**
  - Real-vaqtda qoldirilgan qo'ng'iroqlar haqida ogohlantirish (`SendTelegramAlertJob`).
  - Kunlik soat 19:00 statistik hisobot.
  - Obuna tugashiga 7, 3, 1 kun qolganda to'lov eslatmalari.
- [ ] **6.2.** `CrmDriverInterface` va `CrmManager` (Driver Pattern).
- [ ] **6.3.** **amoCRM Integratsiyasi (panel.1call.uz asosida):**
  - `AmoCrmService` (OAuth2, 5 xil formatdagi telefon qidiruvi, auto-contact/lead, HMAC SHA-256 audio link).
  - `SendCallToAmoCrmJob` (Cache Lock bilan dublikatsiz sinxronlash, javobsiz qo'ng'iroq avto-vazifasi).
  - `amocrm-widget` ZIP arxivi va Events API v2 bildirishnomalari.
- [ ] **6.4.** **Bitrix24 Drayveri:** `telephony.externalcall` integratsiyasi.
- [ ] **6.5.** **MoySklad Integratsiyasi (panel.1call.uz asosida):**
  - `MoySkladService` (Phone API 1.0 + Remap JSON API 1.2, xodimlar mappingi).
  - `SendCallToMoySkladJob` (UTC+3 -> UTC+5 vaqt korreksiyasi, kontragent nomi sinxroni).
  - `moysklad-app.xml` ilova deskriptori va iframe interfeysi.
- [ ] **6.6.** **BitoERP & Universal Webhook Drayveri:** REST Webhook (HMAC SHA-256).
- [ ] **6.7.** `SyncCallToIntegrationsJob` asinxron navbat va Retry Policy.
- [ ] **6.8.** Integratsiyalar Dashboard UI.
- [ ] **6.9.** GitHub Actions CI/CD (`backend-ci.yml`, `android-ci.yml`) va yuklama sinovlari.
- [ ] **6.10.** **VPS Production Deploy:** Ubuntu 24.04 sozlash, Nginx, PHP 8.3-FPM, PostgreSQL 16, Redis, Supervisor (queues), Certbot SSL va deploy skripti.

---

## 8. amoCRM va MoySklad Integratsiya Mantig'i (panel.1call.uz tajribasi asosida)

Loyihada amoCRM va MoySklad integratsiyalari `panel.1call.uz` repozitoriyasida muvaffaqiyatli sinovdan o'tgan, amaliy nozik jihatlar (edge cases) hisobga olingan to'liq ishlab turgan logika asosida quriladi.

### 8.1. amoCRM Integratsiya Arxitekturasi (`AmoCrmService`)
1. **OAuth2 Ulanish va Tokenlarni Avtomatik Yangilash:**
   - Standart `client_id`, `client_secret`, `subdomain` orqali avtorizatsiya havolasi generatsiya qilinadi:
     `https://www.amocrm.ru/oauth?client_id={id}&redirect_uri={callback}&state={tenant_id}&mode=post_message`
   - Callbackda olingan `authorization_code` orqali dastlabki `access_token` va `refresh_token` olinadi.
   - Har bir so'rov oldidan token muddati tekshiriladi (`token_expires_at`). Agar eskirgan bo'lsa yoki so'rov 401 qaytarsa, `refreshToken()` avtomatik yangi token olib, bazani yangilaydi.
2. **O'zbekiston Telefon Raqamlari Qidiruvi (Dublikatlarni oldini olish):**
   - amoCRM ba'zi raqamlarni xalqaro (`+998 90 123 45 67`), ba'zilarini mahalliy (`90 123 45 67`), hatto ba'zi operator kodlarini (masalan, 33...) Frantsiya formati (`+33 ...`) sifatida formatlab saqlaydi.
   - `findContactByPhone()` funksiyasi bitta raqam uchun 5 xil format variatsiyasini (toza raqam, 998 bilan, oraliq bo'shliqlar bilan) hosil qiladi va `GET /api/v4/contacts?query=...` orqali qidiradi (100ms interval bilan so'rovlar limiti saqlanadi).
3. **Avtomatik Kontakt va Lid (Bitim) Yaratish Qoidalari:**
   - Sozlamalarda 3 xil holat uchun alohida harakat belgilanadi:
     * `incoming_action` (kiruvchi qo'ng'iroq) $
ightarrow$ `contact`, `lead`, yoki `nothing`.
     * `outgoing_action` (chiquvchi qo'ng'iroq) $
ightarrow$ `contact`, `lead`, yoki `nothing`.
     * `missed_action` (javobsiz qo'ng'iroq) $
ightarrow$ `contact`, `lead`, yoki `nothing`.
   - Agar kontakt topilmasa, `createContact()` chaqiriladi.
   - Agar amal `lead` bo'lsa, `createLead()` orqali belgilangan `pipeline_id` voronkasiga yangi bitim ochiladi.
4. **Qo'ng'iroqni amoCRM ga Yozish (`POST /api/v4/calls`):**
   - `direction`: `inbound` yoki `outbound`.
   - `call_status`: 4 (muvaffaqiyatli suhbat) yoki 6 (javobsiz qo'ng'iroq).
   - `responsible_user_id`: Operatorning telefoni `operator_mapping` orqali amoCRM menejeriga moslanadi.
   - **Xavfsiz Audio Havolasi:** HMAC SHA-256 xeshi bilan imzolangan havola uzatiladi:
     `url("/api/amocrm/play/{call_id}?token={hmac_token}")`.
   - Qo'ng'iroq bahosi (agar mavjud bo'lsa): `"Mijoz bahosi: ⭐⭐⭐⭐⭐ (5/5)"`.
5. **Javobsiz Qo'ng'iroq uchun Avto-Vazifa (`POST /api/v4/tasks`):**
   - Agar qo'ng'iroq javobsiz qolsa va `create_task_on_missed` yoqilgan bo'lsa, mas'ul xodimga 2 soat muddat bilan "Qayta qo'ng'iroq qiling" vazifasi qo'yiladi.
6. **amoCRM Vidjeti (`amocrm-widget`):**
   - `manifest.json` va `script.js` dan iborat ZIP arxivi.
   - amoCRM kartochkasida Click-to-call (bir bosishda qo'ng'iroq qilish) va qo'ng'iroq kelganda brauzerda mijoz kartochkasini chiqarish (Events API v2 `notifyRinging`) ta'minlanadi.

---

### 8.2. MoySklad Integratsiya Arxitekturasi (`MoySkladService`)
1. **Ikki Qatlamli API:**
   - **Phone API 1.0 (`api.moysklad.ru/api/phone/1.0/`):** Telefoniya hodisalari, qo'ng'iroqni kiritish (`POST /call`), yangilash (`PUT /call/{id}`), va kartochkani boshqarish (`SHOW`, `STARTTIME`, `HIDE`).
   - **Remap JSON API 1.2 (`api.moysklad.ru/api/remap/1.2/`):** Kontragentlar (`/entity/counterparty`) va xodimlarni (`/entity/employee`) qidirish.
2. **Xodimlar va Operatorlar Moslashuvi (`operator_mapping`):**
   - MoySklad xodimlari ro'yxati olinadi (`getEmployees`) va ularning `href` havolasi bizning telefonlarimizga biriktiriladi.
3. **Kontragent Qidiruvi va Kontakt Nomini Yangilash:**
   - `findCounterpartyByPhone`: Telefon raqami va oxirgi 9 ta raqami bo'yicha MoySklad qidiriladi.
   - Agar MoySkladda mijoz nomi mavjud bo'lsa, `1call` dagi kontakt nomi avtomatik MoySkladdagi kontragent nomiga yangilanadi.
4. **Toshkent Vaqtini To'g'rilash (Timezone Offset):**
   - MoySklad serveri kelgan vaqtga avtomatik +2 soat qo'shib saqlaydi.
   - Toshkent (UTC+5) vaqtida to'g'ri ko'rinishi uchun, serverimizdan vaqt Moskva (UTC+3) vaqt zonasida yuboriladi:
     $$\\text{UTC+3} + 2\\text{h} = \\text{UTC+5 (Toshkent vaqti)}$$
5. **MoySklad Ilovasi (App Descriptor XML):**
   - `moysklad-app.xml` deskriptori orqali MoySklad shaxsiy ilovasi ulanadi va kontragent kartochkasida `1call` telefoniya iframe vidjeti paydo bo'ladi.
