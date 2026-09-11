package uz.onecall.agent.data.preferences

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

class PreferenceManager(context: Context) {

    private val sharedPreferences: SharedPreferences = try {
        val masterKey = MasterKey.Builder(context)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build()

        EncryptedSharedPreferences.create(
            context,
            "onecall_secure_prefs",
            masterKey,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        )
    } catch (e: Exception) {
        context.getSharedPreferences("onecall_fallback_prefs", Context.MODE_PRIVATE)
    }

    var baseUrl: String
        get() = sharedPreferences.getString(KEY_BASE_URL, "https://agent.1call.uz") ?: "https://agent.1call.uz"
        set(value) = sharedPreferences.edit().putString(KEY_BASE_URL, value.trimEnd('/')).apply()

    var deviceToken: String?
        get() = sharedPreferences.getString(KEY_DEVICE_TOKEN, null)
        set(value) = sharedPreferences.edit().putString(KEY_DEVICE_TOKEN, value).apply()

    var hardwareUid: String
        get() {
            var uid = sharedPreferences.getString(KEY_HARDWARE_UID, null)
            if (uid.isNullOrEmpty()) {
                uid = java.util.UUID.randomUUID().toString()
                sharedPreferences.edit().putString(KEY_HARDWARE_UID, uid).apply()
            }
            return uid
        }
        set(value) = sharedPreferences.edit().putString(KEY_HARDWARE_UID, value).apply()

    var deviceName: String
        get() = sharedPreferences.getString(KEY_DEVICE_NAME, android.os.Build.MODEL) ?: android.os.Build.MODEL
        set(value) = sharedPreferences.edit().putString(KEY_DEVICE_NAME, value).apply()

    var tenantName: String?
        get() = sharedPreferences.getString(KEY_TENANT_NAME, null)
        set(value) = sharedPreferences.edit().putString(KEY_TENANT_NAME, value).apply()

    var operatorName: String?
        get() = sharedPreferences.getString(KEY_OPERATOR_NAME, null)
        set(value) = sharedPreferences.edit().putString(KEY_OPERATOR_NAME, value).apply()

    var isPaired: Boolean
        get() = sharedPreferences.getBoolean(KEY_IS_PAIRED, false) && !deviceToken.isNullOrEmpty()
        set(value) = sharedPreferences.edit().putBoolean(KEY_IS_PAIRED, value).apply()

    // 0 = All SIMs, 1 = SIM Slot 1 (index 0), 2 = SIM Slot 2 (index 1)
    var selectedSimSlot: Int
        get() = sharedPreferences.getInt(KEY_SELECTED_SIM_SLOT, 0)
        set(value) = sharedPreferences.edit().putInt(KEY_SELECTED_SIM_SLOT, value).apply()

    var workScheduleJson: String?
        get() = sharedPreferences.getString(KEY_WORK_SCHEDULE, null)
        set(value) = sharedPreferences.edit().putString(KEY_WORK_SCHEDULE, value).apply()

    var privacyBlacklist: String?
        get() = sharedPreferences.getString(KEY_PRIVACY_BLACKLIST, null)
        set(value) = sharedPreferences.edit().putString(KEY_PRIVACY_BLACKLIST, value).apply()

    var sim1PhoneNumber: String?
        get() = sharedPreferences.getString(KEY_SIM1_PHONE_NUMBER, null)
        set(value) = sharedPreferences.edit().putString(KEY_SIM1_PHONE_NUMBER, value).apply()

    var sim2PhoneNumber: String?
        get() = sharedPreferences.getString(KEY_SIM2_PHONE_NUMBER, null)
        set(value) = sharedPreferences.edit().putString(KEY_SIM2_PHONE_NUMBER, value).apply()

    fun clearAuth() {
        sharedPreferences.edit()
            .remove(KEY_DEVICE_TOKEN)
            .remove(KEY_IS_PAIRED)
            .remove(KEY_TENANT_NAME)
            .remove(KEY_OPERATOR_NAME)
            .apply()
    }

    companion object {
        private const val KEY_BASE_URL = "base_url"
        private const val KEY_DEVICE_TOKEN = "device_token"
        private const val KEY_HARDWARE_UID = "hardware_uid"
        private const val KEY_DEVICE_NAME = "device_name"
        private const val KEY_TENANT_NAME = "tenant_name"
        private const val KEY_OPERATOR_NAME = "operator_name"
        private const val KEY_IS_PAIRED = "is_paired"
        private const val KEY_SELECTED_SIM_SLOT = "selected_sim_slot"
        private const val KEY_WORK_SCHEDULE = "work_schedule"
        private const val KEY_PRIVACY_BLACKLIST = "privacy_blacklist"
        private const val KEY_SIM1_PHONE_NUMBER = "sim1_phone_number"
        private const val KEY_SIM2_PHONE_NUMBER = "sim2_phone_number"
    }
}
