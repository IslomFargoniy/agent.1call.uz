# 1Call Agent — Android Native Telephony Client

`1Call Agent` — korporativ telefoniyani markaziy server (`https://agent.1call.uz`) hamda amoCRM va MoySklad bilan real-vaqtda sinxronlashtiruvchi Android ilovasi.

## Asosiy Texnologiyalar va Arxitektura
- **Til & Platforma:** Kotlin 2.0+, Android 8.0 - Android 15 (API 26 - 35).
- **UI:** Jetpack Compose + Material 3 dizayn tizimi.
- **Audio Capture:** `AccessibilityService` (`CallAccessibilityService`) + `MediaRecorder` (AAC / Opus mono 16kHz, 24 kbps, `.m4a` formati). 1 daqiqa suhbat hajmi ~180-200 KB.
- **Instant Ringing Webhook:** Kiruvchi qo'ng'iroq jiringlagan zahoti `POST /api/v1/telemetry/ringing` orqali serverga signal yuboriladi (Reverb WebSocket orqali CRM va veb panelda darhol mijoz kartasi chiqadi).
- **Dual-SIM Filtrlash:** `selected_sim_slot` sozlamasi orqali faqat korporativ SIM qo'ng'iroqlari yoziladi, shaxsiy SIM chetlab o'tiladi.
- **Ish Grafigi va Maxfiylik Filtr:** `WorkHoursFilter` kompaniyaning ish grafigi (masalan 09:00 - 18:00) hamda maxfiy qora ro'yxatdagi raqamlarni yozib olishdan himoyalaydi.
- **Offline Navbat & Sinxronizatsiya:** Room Database (`LocalCallRecord`) + Android `WorkManager` (`CallSyncWorker`). Internet uzilgan holatda audio fayllar lokal saqlanib, aloqa tiklanganda avtomatik yuklanadi.
- **Heartbeat:** `HeartbeatWorker` har 15 daqiqada batareya foizi va xizmat faolligini serverga yetkazadi.
- **Ulash Oqimi:** 6 xonali PIN-kod yoki CameraX + ML Kit yordamida QR-kod skanerlash.

## Loyihani Yig'ish (Build)
1. Loyihani Android Studio (Ladybug / Koala yoki yangiroq) da oching (`android/` papkasi).
2. Yoki terminal orqali:
```bash
./gradlew assembleDebug
```
APK fayl `app/build/outputs/apk/debug/` papkasida hosil bo'ladi.
