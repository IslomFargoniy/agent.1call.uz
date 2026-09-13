package uz.onecall.agent.core

import androidx.compose.runtime.Composable
import androidx.compose.runtime.State
import androidx.compose.runtime.mutableStateOf
import uz.onecall.agent.OneCallApplication

interface Strings {
    val langCode: String
    val langName: String

    // Common
    val ok: String
    val cancel: String
    val save: String
    val retry: String
    val back: String
    val close: String
    val settings: String
    val language: String
    val active: String
    val unknown: String
    val notPaired: String
    val success: String
    val error: String
    val refresh: String
    val continueBtn: String
    val changeBtn: String
    val secShort: String
    val minShort: String

    // Languages
    val langUz: String
    val langRu: String
    val langEn: String

    // Permissions Screen
    val permissionsTitle: String
    val permissionsSubtitle: String
    val permissionsRefresh: String
    val permissionsGrantAll: String
    val permissionsGranted: String
    val permissionsGrantBtn: String
    val permPhoneTitle: String
    val permPhoneDesc: String
    val permAudioTitle: String
    val permAudioDesc: String
    val permCallLogTitle: String
    val permCallLogDesc: String
    val permAccessibilityTitle: String
    val permAccessibilityDesc: String
    val permStorageTitle: String
    val permStorageDesc: String
    val permBatteryTitle: String
    val permBatteryDesc: String
    val permInstallTitle: String
    val permInstallDesc: String

    // Pairing Screen
    val pairingTitle: String
    val pairingSubtitle: String
    val tabQr: String
    val tabCode: String
    val codeInputLabel: String
    val codeInputPlaceholder: String
    val pairBtn: String
    val pairingInProgress: String
    val cameraPermissionRequired: String
    val grantCameraBtn: String
    val serverUrlLabel: String

    // Home Screen
    val homeHeaderOperator: String
    val homeHeaderActive: String
    val homeHeaderSyncPending: String
    val statsTodayTitle: String
    val statsTotal: String
    val statsRecorded: String
    val statsDuration: String
    val statsSynced: String
    val simCardTitle: String
    val simActive: String
    val simNotDetected: String
    val simAutoDetected: String
    val operatorNumberLabel: String
    val enterPhonePlaceholder: String
    val editPhoneDialogTitle: String
    val samsungRecordTitle: String
    val samsungRecordDesc: String
    val samsungSettingsBtn: String
    val recentCallsTitle: String
    val noCallsTitle: String
    val noCallsDesc: String
    val syncNowBtn: String
    val syncing: String
    val updateAvailableBanner: String
    val updateClickHint: String
    val callIncoming: String
    val callOutgoing: String

    // Settings Screen
    val settingsTitle: String
    val languageCardTitle: String
    val deviceInfoTitle: String
    val model: String
    val company: String
    val operator: String
    val server: String
    val version: String
    val hardwareUid: String
    val appUpdateTitle: String
    val currentVersionDesc: String
    val checkUpdateBtn: String
    val checkingUpdate: String
    val batteryTitle: String
    val batteryDesc: String
    val openSettingsBtn: String
    val unpairBtn: String
    val unpairConfirmTitle: String
    val unpairConfirmDesc: String
    val unpairConfirmAction: String

    // Bottom Navigation Tabs
    val tabHome: String
    val tabCalls: String
    val tabProfile: String
}

object UzStrings : Strings {
    override val langCode = "uz"
    override val langName = "O'zbekcha"

    override val ok = "OK"
    override val cancel = "Bekor qilish"
    override val save = "Saqlash"
    override val retry = "Qayta urinish"
    override val back = "Orqaga"
    override val close = "Yopish"
    override val settings = "Sozlamalar"
    override val language = "Ilova Tili"
    override val active = "Faol"
    override val unknown = "Noma'lum"
    override val notPaired = "Ulanmagan"
    override val success = "Muvaffaqiyatli"
    override val error = "Xatolik"
    override val refresh = "Yangilash"
    override val continueBtn = "Davom etish"
    override val changeBtn = "O'zgartirish"
    override val secShort = "soniya"
    override val minShort = "daqiqa"

    override val langUz = "O'zbekcha (UZ)"
    override val langRu = "Русский (RU)"
    override val langEn = "English (EN)"

    override val permissionsTitle = "Kerakli Ruxsatlar"
    override val permissionsSubtitle = "Agent1Call qo'ng'iroqlarni yozib olishi va CRM bilan sinxronlashi uchun barcha ruxsatlar zarur"
    override val permissionsRefresh = "Ruxsatlarni qayta tekshirish"
    override val permissionsGrantAll = "Barcha Ruxsatlarni Berish"
    override val permissionsGranted = "Berilgan"
    override val permissionsGrantBtn = "Ruxsat Berish"
    override val permPhoneTitle = "Telefon Holati va Raqami"
    override val permPhoneDesc = "Kiruvchi va chiquvchi qo'ng'iroqlarni hamda SIM karta ma'lumotlarini aniqlash."
    override val permAudioTitle = "Ovoz Yozish (Audio)"
    override val permAudioDesc = "Qo'ng'iroq audio yozuvlarini yuqori sifatda yaratish uchun zarur."
    override val permCallLogTitle = "Qo'ng'iroqlar Jurnali"
    override val permCallLogDesc = "Qo'ng'iroq davomiyligi, vaqti va mijoz telefon raqamini aniqlash."
    override val permAccessibilityTitle = "Maxsus Imkoniyatlar (Accessibility)"
    override val permAccessibilityDesc = "Qo'ng'iroq boshlangan va tugagan vaqtni avtomatik aniqlash."
    override val permStorageTitle = "Xotira va Fayllar (Samsung)"
    override val permStorageDesc = "Samsung tizimidagi 2 tomonlama yozuvlarni ilovaga yuklash uchun zarur."
    override val permBatteryTitle = "Batareya Cheklovisiz Rejim"
    override val permBatteryDesc = "Ilova fonda to'xtab qolmasdan ishlashi uchun fon cheklovlarini o'chirish."
    override val permInstallTitle = "Ilovalarni Yangilash Ruxsati"
    override val permInstallDesc = "Yangi versiya chiqqanda avtomatik yangilash uchun ruxsat."

    override val pairingTitle = "Qurilmani Ulash"
    override val pairingSubtitle = "Boshqaruv panelidagi QR kodni skanerlang yoki 6 xonali ulanish kodini kiriting"
    override val tabQr = "QR Kod"
    override val tabCode = "Ulanish Kodi"
    override val codeInputLabel = "6 xonali ulanish kodi"
    override val codeInputPlaceholder = "Masalan: 123456"
    override val pairBtn = "Qurilmani Faollashtirish"
    override val pairingInProgress = "Ulanmoqda..."
    override val cameraPermissionRequired = "QR kodni skanerlash uchun kamera ruxsati zarur"
    override val grantCameraBtn = "Kameraga ruxsat berish"
    override val serverUrlLabel = "Server manzili"

    override val homeHeaderOperator = "Operator"
    override val homeHeaderActive = "Tizim faol va sinxronlanmoqda"
    override val homeHeaderSyncPending = "Sinxronizatsiya kutilmoqda"
    override val statsTodayTitle = "Bugungi Statistika"
    override val statsTotal = "Jami"
    override val statsRecorded = "Yozilgan"
    override val statsDuration = "Davomiyligi"
    override val statsSynced = "Serverda"
    override val simCardTitle = "SIM Karta va Operator Raqami"
    override val simActive = "Faol SIM"
    override val simNotDetected = "Raqam aniqlanmadi"
    override val simAutoDetected = "SIM raqami tizim orqali avtomatik aniqlandi"
    override val operatorNumberLabel = "Operator telefon raqami"
    override val enterPhonePlaceholder = "+998901234567"
    override val editPhoneDialogTitle = "Operator telefon raqamini kiritish"
    override val samsungRecordTitle = "Samsung Avtomatik Yozish"
    override val samsungRecordDesc = "Samsung Telefon > Sozlamalar > 'Qo'ng'iroqlarni avtomatik yozish' yoqilishi shart."
    override val samsungSettingsBtn = "Sozlash"
    override val recentCallsTitle = "Oxirgi Qo'ng'iroqlar"
    override val noCallsTitle = "Hozircha qo'ng'iroqlar mavjud emas"
    override val noCallsDesc = "Qurilmadan amalga oshirilgan qo'ng'iroqlar bu yerda ko'rinadi"
    override val syncNowBtn = "Hozir sinxronlash"
    override val syncing = "Sinxronlanmoqda..."
    override val updateAvailableBanner = "Yangi versiya mavjud"
    override val updateClickHint = "Ilovani yangilash uchun bosing"
    override val callIncoming = "Kiruvchi"
    override val callOutgoing = "Chiquvchi"

    override val settingsTitle = "Sozlamalar"
    override val languageCardTitle = "Ilova Tili"
    override val deviceInfoTitle = "Qurilma Ma'lumotlari"
    override val model = "Model"
    override val company = "Kompaniya"
    override val operator = "Operator"
    override val server = "Server"
    override val version = "Versiya"
    override val hardwareUid = "Hardware UID"
    override val appUpdateTitle = "Dastur Yangilanishi"
    override val currentVersionDesc = "Joriy versiya: v%s. Yangi imkoniyatlar va barqarorlik uchun yangilanishlarni doimiy tekshirib turing."
    override val checkUpdateBtn = "Yangilanishlarni Tekshirish"
    override val checkingUpdate = "Tekshirilmoqda..."
    override val batteryTitle = "Batareya va Fon Rejimi"
    override val batteryDesc = "Ilova fonda to'xtamasdan ishlashi uchun batareya cheklovlarini 'Cheklovsiz' qilib qo'ying."
    override val openSettingsBtn = "Tizim Ilova Sozlamalarini Ochish"
    override val unpairBtn = "Qurilmani Tizimdan Uzish"
    override val unpairConfirmTitle = "Qurilmani uzishni tasdiqlaysizmi?"
    override val unpairConfirmDesc = "Qurilma kompaniya tizimidan uziladi va qayta ulanmaguncha qo'ng'iroqlar CRM ga yozilmaydi."
    override val unpairConfirmAction = "Tizimdan Uzish"

    override val tabHome = "Asosiy"
    override val tabCalls = "Qo'ng'iroqlar"
    override val tabProfile = "Profil"
}

object RuStrings : Strings {
    override val langCode = "ru"
    override val langName = "Русский"

    override val ok = "OK"
    override val cancel = "Отмена"
    override val save = "Сохранить"
    override val retry = "Повторить"
    override val back = "Назад"
    override val close = "Закрыть"
    override val settings = "Настройки"
    override val language = "Язык приложения"
    override val active = "Активен"
    override val unknown = "Неизвестно"
    override val notPaired = "Не подключено"
    override val success = "Успешно"
    override val error = "Ошибка"
    override val refresh = "Обновить"
    override val continueBtn = "Продолжить"
    override val changeBtn = "Изменить"
    override val secShort = "сек"
    override val minShort = "мин"

    override val langUz = "O'zbekcha (UZ)"
    override val langRu = "Русский (RU)"
    override val langEn = "English (EN)"

    override val permissionsTitle = "Необходимые разрешения"
    override val permissionsSubtitle = "Для записи звонков и синхронизации с CRM требуются все системные разрешения"
    override val permissionsRefresh = "Проверить разрешения снова"
    override val permissionsGrantAll = "Предоставить все разрешения"
    override val permissionsGranted = "Предоставлено"
    override val permissionsGrantBtn = "Разрешить"
    override val permPhoneTitle = "Состояние телефона и номер"
    override val permPhoneDesc = "Определение входящих и исходящих звонков, информации о SIM-картах."
    override val permAudioTitle = "Запись звука (Аудио)"
    override val permAudioDesc = "Создание качественных аудиозаписей телефонных разговоров."
    override val permCallLogTitle = "Журнал вызовов"
    override val permCallLogDesc = "Определение длительности звонка, точного времени и номера абонента."
    override val permAccessibilityTitle = "Специальные возможности"
    override val permAccessibilityDesc = "Автоматическое определение событий начала и завершения вызова."
    override val permStorageTitle = "Память и файлы (Samsung)"
    override val permStorageDesc = "Необходимо для доступа к двухсторонним аудиозаписям звонков Samsung."
    override val permBatteryTitle = "Работа без ограничений батареи"
    override val permBatteryDesc = "Отключение оптимизации батареи для стабильной работы приложения в фоне."
    override val permInstallTitle = "Разрешение на обновление"
    override val permInstallDesc = "Разрешение на установку новых версий и обновлений приложения."

    override val pairingTitle = "Подключение устройства"
    override val pairingSubtitle = "Отсканируйте QR-код из панели управления или введите 6-значный код подключения"
    override val tabQr = "QR-код"
    override val tabCode = "Код подключения"
    override val codeInputLabel = "6-значный код подключения"
    override val codeInputPlaceholder = "Например: 123456"
    override val pairBtn = "Активировать устройство"
    override val pairingInProgress = "Подключение..."
    override val cameraPermissionRequired = "Для сканирования QR требуется разрешение на доступ к камере"
    override val grantCameraBtn = "Разрешить камеру"
    override val serverUrlLabel = "Адрес сервера"

    override val homeHeaderOperator = "Оператор"
    override val homeHeaderActive = "Система активна и синхронизируется"
    override val homeHeaderSyncPending = "Ожидание синхронизации"
    override val statsTodayTitle = "Статистика за сегодня"
    override val statsTotal = "Всего"
    override val statsRecorded = "Записано"
    override val statsDuration = "Длительность"
    override val statsSynced = "На сервере"
    override val simCardTitle = "SIM-карта и номер оператора"
    override val simActive = "Активная SIM"
    override val simNotDetected = "Номер не определен"
    override val simAutoDetected = "Номер SIM определен автоматически системой"
    override val operatorNumberLabel = "Номер телефона оператора"
    override val enterPhonePlaceholder = "+998901234567"
    override val editPhoneDialogTitle = "Ввод номера телефона оператора"
    override val samsungRecordTitle = "Автозапись вызовов Samsung"
    override val samsungRecordDesc = "Samsung Телефон > Настройки > 'Автозапись вызовов' должна быть включена."
    override val samsungSettingsBtn = "Настроить"
    override val recentCallsTitle = "Последние звонки"
    override val noCallsTitle = "Пока нет звонков"
    override val noCallsDesc = "Совершенные с устройства звонки будут отображаться здесь"
    override val syncNowBtn = "Синхронизировать сейчас"
    override val syncing = "Синхронизация..."
    override val updateAvailableBanner = "Доступна новая версия"
    override val updateClickHint = "Нажмите для обновления приложения"
    override val callIncoming = "Входящий"
    override val callOutgoing = "Исходящий"

    override val settingsTitle = "Настройки"
    override val languageCardTitle = "Язык приложения"
    override val deviceInfoTitle = "Информация об устройстве"
    override val model = "Модель"
    override val company = "Компания"
    override val operator = "Оператор"
    override val server = "Сервер"
    override val version = "Версия"
    override val hardwareUid = "Hardware UID"
    override val appUpdateTitle = "Обновление приложения"
    override val currentVersionDesc = "Текущая версия: v%s. Проверяйте обновления для стабильной работы и новых функций."
    override val checkUpdateBtn = "Проверить обновления"
    override val checkingUpdate = "Проверка..."
    override val batteryTitle = "Оптимизация батареи и фон"
    override val batteryDesc = "Отключите ограничения батареи (выберите 'Без ограничений') для надежной фиксации вызовов."
    override val openSettingsBtn = "Открыть настройки приложения"
    override val unpairBtn = "Отключить устройство от системы"
    override val unpairConfirmTitle = "Подтвердить отключение устройства?"
    override val unpairConfirmDesc = "Устройство будет отключено от CRM и звонки перестанут синхронизироваться до повторного подключения."
    override val unpairConfirmAction = "Отключить"

    override val tabHome = "Главная"
    override val tabCalls = "Звонки"
    override val tabProfile = "Профиль"
}

object EnStrings : Strings {
    override val langCode = "en"
    override val langName = "English"

    override val ok = "OK"
    override val cancel = "Cancel"
    override val save = "Save"
    override val retry = "Retry"
    override val back = "Back"
    override val close = "Close"
    override val settings = "Settings"
    override val language = "App Language"
    override val active = "Active"
    override val unknown = "Unknown"
    override val notPaired = "Not Connected"
    override val success = "Success"
    override val error = "Error"
    override val refresh = "Refresh"
    override val continueBtn = "Continue"
    override val changeBtn = "Change"
    override val secShort = "sec"
    override val minShort = "min"

    override val langUz = "O'zbekcha (UZ)"
    override val langRu = "Русский (RU)"
    override val langEn = "English (EN)"

    override val permissionsTitle = "Required Permissions"
    override val permissionsSubtitle = "All permissions are required for Agent1Call to record calls and sync with CRM"
    override val permissionsRefresh = "Check permissions again"
    override val permissionsGrantAll = "Grant All Permissions"
    override val permissionsGranted = "Granted"
    override val permissionsGrantBtn = "Grant"
    override val permPhoneTitle = "Phone State & Number"
    override val permPhoneDesc = "Detect incoming and outgoing calls, and read SIM card information."
    override val permAudioTitle = "Audio Recording"
    override val permAudioDesc = "Required to capture high quality call audio recordings."
    override val permCallLogTitle = "Call Log"
    override val permCallLogDesc = "Detect call duration, timestamp, and client phone number."
    override val permAccessibilityTitle = "Accessibility Service"
    override val permAccessibilityDesc = "Automatically detect call start and call end events."
    override val permStorageTitle = "Storage & Files (Samsung)"
    override val permStorageDesc = "Required to access native Samsung 2-way call recordings."
    override val permBatteryTitle = "Unrestricted Battery"
    override val permBatteryDesc = "Disable battery restrictions so the app stays active in the background."
    override val permInstallTitle = "Install Updates Permission"
    override val permInstallDesc = "Allows seamless installation when a new version is released."

    override val pairingTitle = "Device Pairing"
    override val pairingSubtitle = "Scan the QR code from the dashboard or enter the 6-digit pairing code"
    override val tabQr = "QR Code"
    override val tabCode = "Pairing Code"
    override val codeInputLabel = "6-digit pairing code"
    override val codeInputPlaceholder = "Example: 123456"
    override val pairBtn = "Activate Device"
    override val pairingInProgress = "Pairing..."
    override val cameraPermissionRequired = "Camera permission is required to scan QR code"
    override val grantCameraBtn = "Grant Camera"
    override val serverUrlLabel = "Server URL"

    override val homeHeaderOperator = "Operator"
    override val homeHeaderActive = "System active and syncing"
    override val homeHeaderSyncPending = "Sync pending"
    override val statsTodayTitle = "Today's Statistics"
    override val statsTotal = "Total"
    override val statsRecorded = "Recorded"
    override val statsDuration = "Duration"
    override val statsSynced = "On Server"
    override val simCardTitle = "SIM Card & Operator Number"
    override val simActive = "Active SIM"
    override val simNotDetected = "Number not detected"
    override val simAutoDetected = "SIM number auto-detected by system"
    override val operatorNumberLabel = "Operator phone number"
    override val enterPhonePlaceholder = "+998901234567"
    override val editPhoneDialogTitle = "Enter Operator Phone Number"
    override val samsungRecordTitle = "Samsung Auto Call Recording"
    override val samsungRecordDesc = "Samsung Phone > Settings > 'Auto record calls' must be enabled."
    override val samsungSettingsBtn = "Configure"
    override val recentCallsTitle = "Recent Calls"
    override val noCallsTitle = "No calls yet"
    override val noCallsDesc = "Calls made on this device will appear here"
    override val syncNowBtn = "Sync Now"
    override val syncing = "Syncing..."
    override val updateAvailableBanner = "Update available"
    override val updateClickHint = "Tap to update application"
    override val callIncoming = "Incoming"
    override val callOutgoing = "Outgoing"

    override val settingsTitle = "Settings"
    override val languageCardTitle = "App Language"
    override val deviceInfoTitle = "Device Information"
    override val model = "Model"
    override val company = "Company"
    override val operator = "Operator"
    override val server = "Server"
    override val version = "Version"
    override val hardwareUid = "Hardware UID"
    override val appUpdateTitle = "App Updates"
    override val currentVersionDesc = "Current version: v%s. Check regularly for stability and new features."
    override val checkUpdateBtn = "Check for Updates"
    override val checkingUpdate = "Checking..."
    override val batteryTitle = "Battery & Background"
    override val batteryDesc = "Disable battery restrictions (choose 'Unrestricted') so the app tracks calls reliably."
    override val openSettingsBtn = "Open App Settings"
    override val unpairBtn = "Disconnect Device"
    override val unpairConfirmTitle = "Confirm Device Disconnect?"
    override val unpairConfirmDesc = "This device will be disconnected from CRM and calls will not sync until paired again."
    override val unpairConfirmAction = "Disconnect"

    override val tabHome = "Home"
    override val tabCalls = "Calls"
    override val tabProfile = "Profile"
}

object AppLanguageManager {
    private val _currentLanguage = mutableStateOf("uz")
    val currentLanguage: State<String> = _currentLanguage

    fun init(savedLang: String) {
        _currentLanguage.value = if (savedLang in listOf("uz", "ru", "en")) savedLang else "uz"
    }

    fun setLanguage(lang: String) {
        val validated = if (lang in listOf("uz", "ru", "en")) lang else "uz"
        try {
            OneCallApplication.instance.preferences.language = validated
        } catch (_: Exception) {}
        _currentLanguage.value = validated
    }

    val strings: Strings
        get() = when (_currentLanguage.value) {
            "ru" -> RuStrings
            "en" -> EnStrings
            else -> UzStrings
        }
}

@Composable
fun appStrings(): Strings {
    return when (AppLanguageManager.currentLanguage.value) {
        "ru" -> RuStrings
        "en" -> EnStrings
        else -> UzStrings
    }
}
