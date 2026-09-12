package uz.onecall.agent

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build
import androidx.work.Constraints
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.NetworkType
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import uz.onecall.agent.data.local.AppDatabase
import uz.onecall.agent.data.preferences.PreferenceManager
import uz.onecall.agent.workers.HeartbeatWorker
import java.util.concurrent.TimeUnit

class OneCallApplication : Application() {

    lateinit var database: AppDatabase
        private set

    lateinit var preferences: PreferenceManager
        private set

    override fun onCreate() {
        super.onCreate()
        instance = this

        database = AppDatabase.getDatabase(this)
        preferences = PreferenceManager(this)
        uz.onecall.agent.core.AppLanguageManager.init(preferences.language)

        createNotificationChannels()
        scheduleHeartbeatWorker()
    }

    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val recordingChannel = NotificationChannel(
                CHANNEL_RECORDING_ID,
                "Qo'ng'iroq Yozuvi Xizmati",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Qo'ng'iroq vaqtida fon xizmati ko'rsatgichi"
            }

            val alertsChannel = NotificationChannel(
                CHANNEL_ALERTS_ID,
                "Agent1Call Bildirishnomalari",
                NotificationManager.IMPORTANCE_DEFAULT
            )

            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(recordingChannel)
            manager.createNotificationChannel(alertsChannel)
        }
    }

    fun scheduleHeartbeatWorker() {
        val constraints = Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build()

        val heartbeatRequest = PeriodicWorkRequestBuilder<HeartbeatWorker>(15, TimeUnit.MINUTES)
            .setConstraints(constraints)
            .build()

        WorkManager.getInstance(this).enqueueUniquePeriodicWork(
            HEARTBEAT_WORK_NAME,
            ExistingPeriodicWorkPolicy.KEEP,
            heartbeatRequest
        )
    }

    companion object {
        const val CHANNEL_RECORDING_ID = "channel_call_recording"
        const val CHANNEL_ALERTS_ID = "channel_alerts"
        const val HEARTBEAT_WORK_NAME = "work_heartbeat"

        lateinit var instance: OneCallApplication
            private set
    }
}
