package uz.onecall.agent.core

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.telephony.SubscriptionInfo
import android.telephony.SubscriptionManager
import android.util.Log
import androidx.core.content.ContextCompat

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
            if (subList != null) {
                for (info in subList) {
                    val slot = info.simSlotIndex + 1 // 1-indexed (1 or 2)
                    val carrier = info.carrierName?.toString() ?: info.displayName?.toString() ?: "SIM $slot"
                    var num = ""
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                        try {
                            num = sm.getPhoneNumber(info.subscriptionId)
                        } catch (_: Throwable) {}
                    }
                    if (num.isBlank()) {
                        @Suppress("DEPRECATION")
                        num = info.number ?: ""
                    }
                    result.add(SimCardInfo(slot, carrier, num))
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to read active SIM cards", e)
        }
        return result
    }

    fun getSimCardsMap(context: Context): Map<String, Any> {
        val map = mutableMapOf<String, Any>()
        val list = getActiveSimCards(context)
        for (sim in list) {
            map["sim${sim.slot}"] = mapOf(
                "slot" to sim.slot,
                "carrier" to sim.carrier,
                "phone_number" to sim.phoneNumber
            )
        }
        return map
    }
}
