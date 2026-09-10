# agent.1call.uz - Multi-Tenant SaaS Platform

Korporativ **Multi-Tenant SaaS** telefoniya va qo'ng'iroqlar monitoringi platformasi ("Moi Zvonki" analogi).

## Texnologik Stack
| Qatlam | Texnologiya |
|--------|-------------|
| **Backend** | Laravel 12, PostgreSQL 16+, Laravel Sanctum |
| **Dashboard** | Inertia.js v3, React 19, Tailwind CSS 4 |
| **Multi-Tenancy** | Single DB + Row-Level Security (RLS) + Eloquent TenantScope |
| **Mobil Agent** | Native Kotlin (Jetpack Compose, Foreground Service, Room DB, WorkManager) |
| **CRM/ERP** | amoCRM, Bitrix24, MoySklad, BitoERP (Driver Pattern) |

## Arxitektura va Yo'l Xaritasi
👉 **[docs/ARCHITECTURE_AND_ROADMAP.md](docs/ARCHITECTURE_AND_ROADMAP.md)**
