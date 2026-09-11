package uz.onecall.agent.service

import android.accessibilityservice.AccessibilityService
import android.app.Notification
import android.app.NotificationManager
import android.content.Context
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import androidx.core.app.NotificationCompat
import androidx.work.Constraints
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import uz.onecall.agent.OneCallApplication
import uz.onecall.agent.core.AudioRecorderManager
import uz.onecall.agent.core.CallLogHelper
import uz.onecall.agent.core.DualSimFilter
import uz.onecall.agent.core.SamsungRecordingFinder
import uz.onecall.agent.core.WorkHoursFilter
import uz.onecall.agent.data.local.LocalCallRecord
import uz.onecall.agent.data.remote.ApiClient
import uz.onecall.agent.data.remote.RingingRequest
import uz.onecall.agent.workers.CallSyncWorker

class CallAccessibilityService : AccessibilityService() {

    private val serviceScope = CoroutineScope(Dispatchers.IO)
    private lateinit var recorderManager: AudioRecorderManager

    var activePhoneNumber: String? = null
        private set
    private var activeDirection: String = "INCOMING"
    private var activeSimSlot: Int = 1
    private var isCallInProgress = false
    private var callStartTime: Long = 0

    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this
        try {
            recorderManager = AudioRecorderManager(this)
            Log.i(TAG, "1Call Accessibility Service Connected")
        } catch (e: Exception) {
            Log.e(TAG, "Error initializing recorderManager", e)
        }
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null) return

        try {
            val packageName = event.packageName?.toString() ?: ""
            // Common dialer packages (Google, Samsung, Xiaomi, etc.)
            if (packageName.contains("dialer") || packageName.contains("telecom") || 
                packageName.contains("phone") || packageName.contains("incall") ||
                packageName.contains("samsung.android.incallui")) {
                val rootNode = rootInActiveWindow ?: return
                inspectCallNodes(rootNode)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error in onAccessibilityEvent", e)
        }
    }

    private fun inspectCallNodes(node: AccessibilityNodeInfo) {
        try {
            val text = node.text?.toString()
            if (!text.isNullOrBlank()) {
                val cleanPhone = text.replace(Regex("[^0-9+]"), "")
                // Detect phone numbers with length >= 9 (Uzbekistan numbers are 9-13 digits)
                if (cleanPhone.length >= 9 && activePhoneNumber == null) {
                    activePhoneNumber = cleanPhone
                    Log.d(TAG, "Detected phone from UI: $activePhoneNumber")
                }
            }

            for (i in 0 until node.childCount) {
                val child = node.getChild(i) ?: continue
                inspectCallNodes(child)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error inspecting call nodes", e)
        }
    }

    fun handleRinging(phoneNumber: String, simSlot: Int = 1) {
        try {
            activePhoneNumber = phoneNumber
            activeDirection = "INCOMING"
            activeSimSlot = if (simSlot >= 1) simSlot else 1

            val prefs = OneCallApplication.instance.preferences
            if (!prefs.isPaired) return

            // Instant Ringing Webhook -> send to Reverb and CRM right away
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
        } catch (e: Exception) {
            Log.e(TAG, "Error in handleRinging", e)
        }
    }

    fun handleCallStarted(phoneNumber: String, direction: String, simSlot: Int = 1) {
        try {
            if (isCallInProgress) return

            activePhoneNumber = phoneNumber
            activeDirection = direction
            activeSimSlot = if (simSlot >= 1) simSlot else 1

            val prefs = OneCallApplication.instance.preferences
            if (!prefs.isPaired) return

            // Check Dual-SIM filter
            if (!DualSimFilter.shouldRecordSim(simSlot, prefs)) {
                Log.i(TAG, "Call bypassed by Dual-SIM filter (Slot: $simSlot, Preferred: ${prefs.selectedSimSlot})")
                return
            }

            // Check Work Hours and Privacy Blacklist
            if (phoneNumber.isNotBlank() && phoneNumber != "Noma'lum") {
                if (!WorkHoursFilter.shouldRecordCall(phoneNumber, prefs)) {
                    Log.i(TAG, "Call bypassed by Work Hours / Privacy Blacklist filter: $phoneNumber")
                    return
                }
            }

            callStartTime = System.currentTimeMillis()
            isCallInProgress = true

            val displayPhone = if (phoneNumber.isNotBlank() && phoneNumber != "Noma'lum") phoneNumber else "Qo'ng'iroq"
            showRecordingNotification(displayPhone)

            try {
                recorderManager.startRecording(displayPhone, direction)
            } catch (e: Exception) {
                Log.e(TAG, "Failed to start recorderManager", e)
            }

            Log.i(TAG, "Call recording started for $phoneNumber ($direction, SIM: $simSlot)")
        } catch (e: Exception) {
            Log.e(TAG, "Error in handleCallStarted", e)
        }
    }

    fun handleCallEnded(context: Context? = null) {
        try {
            if (!isCallInProgress) return

            val endedAt = System.currentTimeMillis()
            val result = try { recorderManager.stopRecording() } catch (e: Exception) { null }
            hideRecordingNotification()

            var phone = activePhoneNumber ?: "Noma'lum"
            var direction = activeDirection
            val sim = activeSimSlot

            isCallInProgress = false
            activePhoneNumber = null

            var duration = result?.durationSeconds ?: ((endedAt - callStartTime) / 1000).toInt()
            val audioPath = result?.file?.absolutePath
            val fileSize = result?.sizeBytes ?: 0L

            val appContext = context ?: applicationContext

            serviceScope.launch {
                try {
                    // Delay 800ms for OS to write CallLog.Calls
                    delay(1200)

                    val latestLog = CallLogHelper.getLatestCall(appContext)
                    if (latestLog != null) {
                        val diffMs = Math.abs(endedAt - latestLog.date)
                        if (diffMs < 60000) {
                            if (latestLog.number.isNotBlank()) {
                                phone = latestLog.number
                            }
                            if (latestLog.duration > 0) {
                                duration = latestLog.duration
                            }
                            if (latestLog.type == android.provider.CallLog.Calls.OUTGOING_TYPE) {
                                direction = "OUTGOING"
                            } else if (latestLog.type == android.provider.CallLog.Calls.INCOMING_TYPE) {
                                direction = "INCOMING"
                            }
                        }
                    }

                    // Prioritize native Samsung two-way hardware recording
                    var finalAudioPath = audioPath
                    var finalFileSize = fileSize

                    try {
                        var nativeFile = SamsungRecordingFinder.findLatestNativeCallRecording(
                            context = appContext,
                            phoneNumber = phone,
                            callStartTime = callStartTime,
                            callEndedTime = endedAt
                        )

                        // Retry if Samsung dialer is still finishing encoding / indexing
                        if (nativeFile == null || !nativeFile.exists() || nativeFile.length() == 0L) {
                            delay(1000)
                            nativeFile = SamsungRecordingFinder.findLatestNativeCallRecording(
                                context = appContext,
                                phoneNumber = phone,
                                callStartTime = callStartTime,
                                callEndedTime = System.currentTimeMillis()
                            )
                        }

                        if (nativeFile != null && nativeFile.exists() && nativeFile.length() > 0) {
                            Log.i(TAG, "Found native Samsung two-way call recording: ${nativeFile.absolutePath} (${nativeFile.length()} bytes)")
                            finalAudioPath = nativeFile.absolutePath
                            finalFileSize = nativeFile.length()
                        } else {
                            Log.i(TAG, "Native recording not found, using in-app mic recording: $audioPath ($fileSize bytes)")
                        }
                    } catch (e: Exception) {
                        Log.e(TAG, "Error checking Samsung native recording", e)
                    }

                    val record = LocalCallRecord(
                        phoneNumber = phone,
                        direction = direction,
                        simSlot = if (sim >= 1) sim else 1,
                        durationSeconds = duration,
                        audioFilePath = finalAudioPath,
                        fileSizeBytes = finalFileSize,
                        startedAt = callStartTime / 1000,
                        endedAt = endedAt / 1000,
                        syncStatus = LocalCallRecord.STATUS_PENDING
                    )

                    val id = OneCallApplication.instance.database.callDao().insert(record)
                    Log.i(TAG, "Saved call record to local Room DB with ID: $id ($phone, $direction, dur: ${duration}s, audio: ${fileSize > 0})")

                    // Trigger background sync worker
                    enqueueSyncWorker()
                } catch (e: Exception) {
                    Log.e(TAG, "Error saving call record in coroutine", e)
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error in handleCallEnded", e)
            isCallInProgress = false
            hideRecordingNotification()
        }
    }

    fun handleMissedCall(phoneNumber: String, simSlot: Int = 0) {
        try {
            val prefs = OneCallApplication.instance.preferences
            if (!prefs.isPaired) return

            val now = System.currentTimeMillis() / 1000

            serviceScope.launch {
                try {
                    val record = LocalCallRecord(
                        phoneNumber = phoneNumber,
                        direction = "INCOMING",
                        simSlot = simSlot,
                        durationSeconds = 0,
                        audioFilePath = null,
                        fileSizeBytes = 0L,
                        startedAt = now,
                        endedAt = now,
                        syncStatus = LocalCallRecord.STATUS_PENDING
                    )
                    val id = OneCallApplication.instance.database.callDao().insert(record)
                    Log.i(TAG, "Saved missed call record with ID: $id ($phoneNumber)")
                    enqueueSyncWorker()
                } catch (e: Exception) {
                    Log.e(TAG, "Error saving missed call", e)
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error in handleMissedCall", e)
        }
    }

    private fun showRecordingNotification(phoneNumber: String) {
        try {
            val notification: Notification = NotificationCompat.Builder(this, OneCallApplication.CHANNEL_RECORDING_ID)
                .setContentTitle("Qo'ng'iroq yozilmoqda...")
                .setContentText("Raqam: $phoneNumber")
                .setSmallIcon(android.R.drawable.stat_sys_phone_call)
                .setOngoing(true)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .build()

            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.notify(NOTIFICATION_ID, notification)
        } catch (e: Throwable) {
            Log.w(TAG, "Notification show failed (non-fatal)", e)
        }
    }

    private fun hideRecordingNotification() {
        try {
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.cancel(NOTIFICATION_ID)
        } catch (e: Throwable) {
            Log.w(TAG, "Notification hide failed", e)
        }
    }

    private fun enqueueSyncWorker() {
        try {
            val constraints = Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build()

            val syncWork = OneTimeWorkRequestBuilder<CallSyncWorker>()
                .setConstraints(constraints)
                .build()

            WorkManager.getInstance(applicationContext).enqueue(syncWork)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to enqueue CallSyncWorker", e)
        }
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
        private const val NOTIFICATION_ID = 1001
        var instance: CallAccessibilityService? = null
            private set
    }
}
