package uz.onecall.agent.core

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.telephony.SubscriptionInfo
import android.telephony.SubscriptionManager
import android.telephony.TelephonyManager
import android.util.Log
import androidx.core.content.ContextCompat
import uz.onecall.agent.OneCallApplication
import uz.onecall.agent.workers.HeartbeatWorker

data class SimCardInfo(
    val slot: Int, // 1 for SIM 1, 2 for SIM 2
    val carrier: String,
    val phoneNumber: String
)

object SimHelper {
    private const val TAG = "SimHelper"

    fun autoDetectPhoneNumber(context: Context): String {
        val prefs = OneCallApplication.instance.preferences
        if (!prefs.sim1PhoneNumber.isNullOrBlank()) {
            return prefs.sim1PhoneNumber!!
        }

        val cards = getActiveSimCards(context)
        for (card in cards) {
            if (card.phoneNumber.isNotBlank()) {
                prefs.sim1PhoneNumber = card.phoneNumber
                HeartbeatWorker.enqueueImmediate(context)
                Log.i(TAG, "Auto-detected operator phone number: ${card.phoneNumber}")
                return card.phoneNumber
            }
        }
        return ""
    }

    fun getActiveSimCards(context: Context): List<SimCardInfo> {
        val result = mutableListOf<SimCardInfo>()
        if (ContextCompat.checkSelfPermission(context, Manifest.permission.READ_PHONE_STATE) != PackageManager.PERMISSION_GRANTED) {
            return result
        }

        try {
            val sm = context.getSystemService(Context.TELEPHONY_SUBSCRIPTION_SERVICE) as? SubscriptionManager
            val tm = context.getSystemService(Context.TELEPHONY_SERVICE) as? TelephonyManager
            val subList: List<SubscriptionInfo>? = sm?.activeSubscriptionInfoList
            val prefs = OneCallApplication.instance.preferences

            if (subList != null && subList.isNotEmpty()) {
                for (info in subList) {
                    val slot = if (info.simSlotIndex >= 0) info.simSlotIndex + 1 else 1 // 1-indexed (1 or 2)
                    val carrier = info.carrierName?.toString() ?: info.displayName?.toString() ?: "SIM $slot"

                    var num = if (slot == 1) (prefs.sim1PhoneNumber ?: "") else (prefs.sim2PhoneNumber ?: "")

                    if (num.isBlank()) {
                        num = extractPhoneNumberFromSubscription(info, sm, tm)
                        if (num.isNotBlank() && slot == 1) {
                            prefs.sim1PhoneNumber = num
                            HeartbeatWorker.enqueueImmediate(context)
                        }
                    }

                    result.add(SimCardInfo(slot, carrier, num))
                }
            } else {
                val p1 = prefs.sim1PhoneNumber ?: ""
                result.add(SimCardInfo(1, "Asosiy SIM", p1))
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to read active SIM cards", e)
        }
        return result
    }

    private fun extractPhoneNumberFromSubscription(
        info: SubscriptionInfo,
        sm: SubscriptionManager?,
        tm: TelephonyManager?
    ): String {
        // 1. SubscriptionManager.getPhoneNumber (Android 13+ / API 33+)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU && sm != null) {
            try {
                val n = sm.getPhoneNumber(info.subscriptionId)
                if (!n.isNullOrBlank()) return formatPhone(n)
            } catch (_: Throwable) {}
        }

        // 2. TelephonyManager.line1Number
        if (tm != null) {
            try {
                val n = tm.line1Number
                if (!n.isNullOrBlank()) return formatPhone(n)
            } catch (_: Throwable) {}
        }

        // 3. SubscriptionInfo.number (Legacy)
        try {
            @Suppress("DEPRECATION")
            val n = info.number
            if (!n.isNullOrBlank()) return formatPhone(n)
        } catch (_: Throwable) {}

        // 4. Samsung Korean firmware often puts the MSISDN phone number in displayName or carrierName
        val display = info.displayName?.toString() ?: ""
        val carrier = info.carrierName?.toString() ?: ""
        val phoneRegex = Regex("(\\+?998[0-9]{9}|01[0-9]{8,9}|[0-9]{9,12})")
        phoneRegex.find(display)?.value?.let { return formatPhone(it) }
        phoneRegex.find(carrier)?.value?.let { return formatPhone(it) }

        return ""
    }

    private fun formatPhone(raw: String): String {
        val clean = raw.trim().replace(" ", "").replace("-", "")
        if (clean.startsWith("998") && !clean.startsWith("+")) {
            return "+$clean"
        }
        if (clean.length == 9 && !clean.startsWith("+")) {
            return "+998$clean"
        }
        return clean
    }

    fun getSimCardsMap(context: Context): Map<String, Any> {
        val map = mutableMapOf<String, Any>()
        val list = getActiveSimCards(context)
        val prefs = OneCallApplication.instance.preferences

        if (list.isEmpty()) {
            val p1 = prefs.sim1PhoneNumber ?: ""
            map["sim1"] = mapOf(
                "slot" to 1,
                "carrier" to "Asosiy SIM",
                "phone_number" to p1
            )
            return map
        }

        for (sim in list) {
            val userPhone = if (sim.slot == 1) prefs.sim1PhoneNumber else prefs.sim2PhoneNumber
            val phone = if (!userPhone.isNullOrBlank()) userPhone else sim.phoneNumber
            map["sim${sim.slot}"] = mapOf(
                "slot" to sim.slot,
                "carrier" to sim.carrier,
                "phone_number" to phone
            )
        }
        return map
    }
}
