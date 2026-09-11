package uz.onecall.agent.core

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.telephony.SubscriptionInfo
import android.telephony.SubscriptionManager
import android.util.Log
import androidx.core.content.ContextCompat
import uz.onecall.agent.OneCallApplication

data class SimCardInfo(
    val slot: Int, // 1 for SIM 1, 2 for SIM 2
    val carrier: String,
    val phoneNumber: String
)

object SimHelper {
    private const val TAG = "SimHelper"

    fun getActiveSimCards(context: Context): List<SimCardInfo> {
        val result = mutableListOf<SimCardInfo>()
        if (ContextCompat.checkSelfPermission(context, Manifest.permission.READ_PHONE_STATE) != PackageManager.PERMISSION_GRANTED) {
            return result
        }

        try {
            val sm = context.getSystemService(Context.TELEPHONY_SUBSCRIPTION_SERVICE) as? SubscriptionManager
            val subList: List<SubscriptionInfo>? = sm?.activeSubscriptionInfoList
            val prefs = OneCallApplication.instance.preferences
            if (subList != null && subList.isNotEmpty()) {
                for (info in subList) {
                    val slot = if (info.simSlotIndex >= 0) info.simSlotIndex + 1 else 1 // 1-indexed (1 or 2)
                    val carrier = info.carrierName?.toString() ?: info.displayName?.toString() ?: "SIM $slot"
                    var num = if (slot == 1) (prefs.sim1PhoneNumber ?: "") else (prefs.sim2PhoneNumber ?: "")
                    if (num.isBlank()) {
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                            try {
                                num = sm.getPhoneNumber(info.subscriptionId) ?: ""
                            } catch (_: Throwable) {}
                        }
                        if (num.isBlank()) {
                            @Suppress("DEPRECATION")
                            num = info.number ?: ""
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
