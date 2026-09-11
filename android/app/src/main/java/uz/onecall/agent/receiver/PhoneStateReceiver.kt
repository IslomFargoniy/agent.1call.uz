package uz.onecall.agent.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.telephony.TelephonyManager
import android.util.Log
import uz.onecall.agent.service.CallAccessibilityService

class PhoneStateReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "PhoneStateReceiver"
        private var lastState = TelephonyManager.EXTRA_STATE_IDLE
        private var savedIncomingNumber: String? = null
        private var savedSimSlot = 0
    }

    override fun onReceive(context: Context?, intent: Intent?) {
        if (intent?.action != TelephonyManager.ACTION_PHONE_STATE_CHANGED) return

        val state = intent.getStringExtra(TelephonyManager.EXTRA_STATE) ?: return
        val incomingNumber = intent.getStringExtra(TelephonyManager.EXTRA_INCOMING_NUMBER) ?: ""
        val simSlot = intent.getIntExtra("simSlot", intent.getIntExtra("subscription", 0))

        val service = CallAccessibilityService.instance

        Log.d(TAG, "PhoneStateChanged: state=$state, lastState=$lastState, incomingNumber=$incomingNumber, simSlot=$simSlot")

        when (state) {
            TelephonyManager.EXTRA_STATE_RINGING -> {
                lastState = TelephonyManager.EXTRA_STATE_RINGING
                if (incomingNumber.isNotBlank()) {
                    savedIncomingNumber = incomingNumber
                }
                savedSimSlot = simSlot
                val num = savedIncomingNumber ?: service?.activePhoneNumber ?: incomingNumber
                Log.d(TAG, "Incoming call ringing: $num on SIM $simSlot")
                if (num.isNotBlank()) {
                    service?.handleRinging(num, simSlot)
                }
            }

            TelephonyManager.EXTRA_STATE_OFFHOOK -> {
                if (lastState == TelephonyManager.EXTRA_STATE_RINGING) {
                    // Incoming call answered
                    val num = incomingNumber.ifBlank { savedIncomingNumber ?: service?.activePhoneNumber ?: "Noma'lum" }
                    Log.d(TAG, "Incoming call connected (OFFHOOK): $num")
                    service?.handleCallStarted(num, "INCOMING", savedSimSlot)
                } else {
                    // Outgoing call started (transitions from IDLE to OFFHOOK)
                    val num = incomingNumber.ifBlank { service?.activePhoneNumber ?: "Noma'lum" }
                    Log.d(TAG, "Outgoing call connected (OFFHOOK): $num")
                    service?.handleCallStarted(num, "OUTGOING", simSlot)
                }
                lastState = TelephonyManager.EXTRA_STATE_OFFHOOK
            }

            TelephonyManager.EXTRA_STATE_IDLE -> {
                if (lastState == TelephonyManager.EXTRA_STATE_OFFHOOK) {
                    // Call connected and now ended
                    Log.d(TAG, "Call ended (OFFHOOK -> IDLE)")
                    service?.handleCallEnded(context)
                } else if (lastState == TelephonyManager.EXTRA_STATE_RINGING) {
                    // Missed call (caller hung up or rejected without answering)
                    Log.d(TAG, "Missed call (RINGING -> IDLE): $savedIncomingNumber")
                    val missedNum = savedIncomingNumber ?: service?.activePhoneNumber ?: "Noma'lum"
                    service?.handleMissedCall(missedNum, savedSimSlot)
                }
                lastState = TelephonyManager.EXTRA_STATE_IDLE
                savedIncomingNumber = null
            }
        }
    }
}
