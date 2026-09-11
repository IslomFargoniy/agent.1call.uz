package uz.onecall.agent.workers

import android.accessibilityservice.AccessibilityServiceInfo
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.BatteryManager
import android.util.Log
import android.view.accessibility.AccessibilityManager
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import uz.onecall.agent.OneCallApplication
import uz.onecall.agent.data.remote.ApiClient
import uz.onecall.agent.data.remote.HeartbeatRequest

class HeartbeatWorker(
    context: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(context, workerParams) {

    override suspend fun doWork(): Result {
        val app = OneCallApplication.instance
        val prefs = app.preferences

        if (!prefs.isPaired || prefs.deviceToken.isNullOrEmpty()) {
            return Result.success()
        }

        // 1. Check battery level and charging status
        val batteryStatus: Intent? = IntentFilter(Intent.ACTION_BATTERY_CHANGED).let { filter ->
            app.registerReceiver(null, filter)
        }

        val level: Int = batteryStatus?.getIntExtra(BatteryManager.EXTRA_LEVEL, -1) ?: -1
        val scale: Int = batteryStatus?.getIntExtra(BatteryManager.EXTRA_SCALE, -1) ?: -1
        val batteryPct = if (level >= 0 && scale > 0) ((level / scale.toFloat()) * 100).toInt() else 100

        val status: Int = batteryStatus?.getIntExtra(BatteryManager.EXTRA_STATUS, -1) ?: -1
        val isCharging = status == BatteryManager.BATTERY_STATUS_CHARGING ||
                status == BatteryManager.BATTERY_STATUS_FULL

        // 2. Check accessibility service status
        val am = app.getSystemService(Context.ACCESSIBILITY_SERVICE) as AccessibilityManager
        val enabledServices = am.getEnabledAccessibilityServiceList(AccessibilityServiceInfo.FEEDBACK_ALL_MASK)
        var accessibilityEnabled = false
        for (service in enabledServices) {
            if (service.resolveInfo.serviceInfo.packageName == app.packageName) {
                accessibilityEnabled = true
                break
            }
        }

        val simMap = uz.onecall.agent.core.SimHelper.getSimCardsMap(app)

        // 3. Send Heartbeat to server
        try {
            val response = ApiClient.getService().sendHeartbeat(
                HeartbeatRequest(
                    batteryLevel = batteryPct,
                    isCharging = isCharging,
                    accessibilityEnabled = accessibilityEnabled,
                    isActive = true,
                    simSlotsInfo = if (simMap.isNotEmpty()) simMap else null
                )
            )

            if (response.isSuccessful) {
                Log.d(TAG, "Heartbeat sent successfully (Battery: $batteryPct%, Acc: $accessibilityEnabled)")
            } else {
                Log.w(TAG, "Heartbeat failed with code: ${response.code()}")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error sending heartbeat", e)
        }

        return Result.success()
    }

    companion object {
        private const val TAG = "HeartbeatWorker"

        fun enqueueImmediate(context: Context) {
            try {
                val work = androidx.work.OneTimeWorkRequestBuilder<HeartbeatWorker>().build()
                androidx.work.WorkManager.getInstance(context).enqueue(work)
            } catch (e: Exception) {
                Log.e(TAG, "Failed to enqueue immediate heartbeat", e)
            }
        }
    }
}
