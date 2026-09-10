package uz.onecall.agent.service

import android.accessibilityservice.AccessibilityService
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import androidx.work.Constraints
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import uz.onecall.agent.OneCallApplication
import uz.onecall.agent.core.AudioRecorderManager
import uz.onecall.agent.core.DualSimFilter
import uz.onecall.agent.core.WorkHoursFilter
import uz.onecall.agent.data.local.LocalCallRecord
import uz.onecall.agent.data.remote.ApiClient
import uz.onecall.agent.data.remote.RingingRequest
import uz.onecall.agent.workers.CallSyncWorker

class CallAccessibilityService : AccessibilityService() {

    private val serviceScope = CoroutineScope(Dispatchers.IO)
    private lateinit var recorderManager: AudioRecorderManager

    private var activePhoneNumber: String? = null
    private var activeDirection: String = "INCOMING"
    private var activeSimSlot: Int = 0
    private var isCallInProgress = false
    private var callStartTime: Long = 0

    override fun onServiceConnected() {
        super.onServiceConnected()
        recorderManager = AudioRecorderManager(this)
        Log.i(TAG, "1Call Accessibility Service Connected")
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null) return

        val packageName = event.packageName?.toString() ?: ""
        // Common dialer packages
        if (packageName.contains("dialer") || packageName.contains("telecom") || 
            packageName.contains("phone") || packageName.contains("incall")) {
            val rootNode = rootInActiveWindow ?: return
            inspectCallNodes(rootNode)
        }
    }

    private fun inspectCallNodes(node: AccessibilityNodeInfo) {
        val text = node.text?.toString()
        if (!text.isNullOrBlank()) {
            val cleanPhone = text.replace(Regex("[^0-9+]"), "")
            // Detect phone numbers with length >= 9 (Uzbekistan numbers are 9-12 digits)
            if (cleanPhone.length >= 9 && activePhoneNumber == null) {
                activePhoneNumber = cleanPhone
                Log.d(TAG, "Detected phone from UI: $activePhoneNumber")
            }
        }

        for (i in 0 until node.childCount) {
            val child = node.getChild(i) ?: continue
            inspectCallNodes(child)
        }
    }

    fun handleRinging(phoneNumber: String, simSlot: Int = 0) {
        activePhoneNumber = phoneNumber
        activeDirection = "INCOMING"
        activeSimSlot = simSlot

        val prefs = OneCallApplication.instance.preferences
        if (!prefs.isPaired) return

        // 1. Instant Ringing Webhook -> send to Reverb and amoCRM/MoySklad right away!
        serviceScope.launch {
            try {
                ApiClient.getService().sendRingingNotification(
                    RingingRequest(
                        phoneNumber = phoneNumber,
                        direction = "INCOMING",
                        simSlot = simSlot
                    )
                )
                Log.i(TAG, "Instant ringing notification dispatched for $phoneNumber")
            } catch (e: Exception) {
                Log.e(TAG, "Failed to send instant ringing notification", e)
            }
        }
    }

    fun handleCallStarted(phoneNumber: String, direction: String, simSlot: Int = 0) {
        if (isCallInProgress) return

        activePhoneNumber = phoneNumber
        activeDirection = direction
        activeSimSlot = simSlot

        val prefs = OneCallApplication.instance.preferences
        if (!prefs.isPaired) return

        // Check Dual-SIM filter
        if (!DualSimFilter.shouldRecordSim(simSlot, prefs)) {
            Log.i(TAG, "Call bypassed by Dual-SIM filter (Slot: $simSlot, Preferred: ${prefs.selectedSimSlot})")
            return
        }

        // Check Work Hours and Privacy Blacklist
        if (!WorkHoursFilter.shouldRecordCall(phoneNumber, prefs)) {
            Log.i(TAG, "Call bypassed by Work Hours / Privacy Blacklist filter: $phoneNumber")
            return
        }

        callStartTime = System.currentTimeMillis()
        isCallInProgress = true

        CallRecordingForegroundService.start(this, phoneNumber)
        recorderManager.startRecording(phoneNumber, direction)
        Log.i(TAG, "Call recording started for $phoneNumber ($direction, SIM: $simSlot)")
    }

    fun handleCallEnded() {
        if (!isCallInProgress) return

        val endedAt = System.currentTimeMillis()
        val result = recorderManager.stopRecording()
        CallRecordingForegroundService.stop(this)

        val phone = activePhoneNumber ?: "Noma'lum"
        val direction = activeDirection
        val sim = activeSimSlot

        isCallInProgress = false
        activePhoneNumber = null

        val duration = result?.durationSeconds ?: ((endedAt - callStartTime) / 1000).toInt()
        val audioPath = result?.file?.absolutePath
        val fileSize = result?.sizeBytes ?: 0L

        serviceScope.launch {
            val record = LocalCallRecord(
                phoneNumber = phone,
                direction = direction,
                simSlot = sim,
                durationSeconds = duration,
                audioFilePath = audioPath,
                fileSizeBytes = fileSize,
                startedAt = callStartTime / 1000,
                endedAt = endedAt / 1000,
                syncStatus = LocalCallRecord.STATUS_PENDING
            )

            val id = OneCallApplication.instance.database.callDao().insert(record)
            Log.i(TAG, "Saved call record to local Room DB with ID: $id")

            // Trigger immediate background sync
            enqueueSyncWorker()
        }
    }

    private fun enqueueSyncWorker() {
        val constraints = Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build()

        val syncWork = OneTimeWorkRequestBuilder<CallSyncWorker>()
            .setConstraints(constraints)
            .build()

        WorkManager.getInstance(applicationContext).enqueue(syncWork)
    }

    override fun onInterrupt() {
        Log.w(TAG, "Accessibility service interrupted")
    }

    override fun onDestroy() {
        super.onDestroy()
        instance = null
    }

    companion object {
        private const val TAG = "CallAccessibilityService"
        var instance: CallAccessibilityService? = null
            private set
    }
}
