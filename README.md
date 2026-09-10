# ZvonkiPro - Multi-Tenant SaaS Platform

"Moi Zvonki" servisining to'liq analogi bo'lgan korporativ **Multi-Tenant SaaS** platformasi (Laravel 12 Backend & Inertia/React Dashboard + Android Native Kotlin Agent).

## Texnologik Stack:
- **Backend & Dashboard:** Laravel 12, Inertia.js, React, Tailwind CSS, PostgreSQL.
- **Multi-Tenancy modeli:** Single Database with Row-Level / Tenant Scoping (PostgreSQL Native RLS + Laravel Eloquent `TenantScope`).
- **Mobil Agent:** `android/` subdirektoriyasida Native Kotlin (Jetpack Compose, Foreground Service, TelephonyCallback, Room DB, WorkManager, Retrofit).
- **Muloqot va Auth:** Laravel Sanctum (Tenant doirasida generatsiya qilinadigan Device Tokenlar) va HMAC imzolangan CRM Webhook tizimi.

---

## Batafsil Arxitektura va Yo'l Xaritasi:
Loyiha arxitekturasi, ma'lumotlar bazasi sxemalari, RLS xavfsizlik siyosatlari, Android fon arxitekturasi va 5 bosqichli amaliy implementatsiya rejasi bilan tanishish uchun quyidagi hujjatga qarang:

👉 **[docs/ARCHITECTURE_AND_ROADMAP.md](docs/ARCHITECTURE_AND_ROADMAP.md)**
