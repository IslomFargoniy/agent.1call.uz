package uz.onecall.agent.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.telephony.TelephonyManager
import android.util.Log
import uz.onecall.agent.service.CallAccessibilityService

class PhoneStateReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context?, intent: Intent?) {
        if (intent?.action != TelephonyManager.ACTION_PHONE_STATE_CHANGED) return

        val state = intent.getStringExtra(TelephonyManager.EXTRA_STATE)
        val incomingNumber = intent.getStringExtra(TelephonyManager.EXTRA_INCOMING_NUMBER) ?: ""
        val simSlot = intent.getIntExtra("simSlot", intent.getIntExtra("subscription", 0))

        val service = CallAccessibilityService.instance

        when (state) {
            TelephonyManager.EXTRA_STATE_RINGING -> {
                Log.d("PhoneStateReceiver", "Incoming call ringing: $incomingNumber on SIM $simSlot")
                if (incomingNumber.isNotBlank()) {
                    service?.handleRinging(incomingNumber, simSlot)
                }
            }
            TelephonyManager.EXTRA_STATE_OFFHOOK -> {
                Log.d("PhoneStateReceiver", "Call connected (OFFHOOK): $incomingNumber")
                if (incomingNumber.isNotBlank()) {
                    service?.handleCallStarted(incomingNumber, "INCOMING", simSlot)
                }
            }
            TelephonyManager.EXTRA_STATE_IDLE -> {
                Log.d("PhoneStateReceiver", "Call terminated (IDLE)")
                service?.handleCallEnded()
            }
        }
    }
}
