package uz.onecall.agent.service

import android.app.Notification
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat
import uz.onecall.agent.OneCallApplication

class CallRecordingForegroundService : Service() {

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        try {
            val phoneNumber = intent?.getStringExtra(EXTRA_PHONE_NUMBER) ?: "Noma'lum"

            val notification: Notification = NotificationCompat.Builder(this, OneCallApplication.CHANNEL_RECORDING_ID)
                .setContentTitle("Qo'ng'iroq yozilmoqda...")
                .setContentText("Raqam: $phoneNumber")
                .setSmallIcon(android.R.drawable.stat_sys_phone_call)
                .setOngoing(true)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .build()

            startForeground(NOTIFICATION_ID, notification)
        } catch (t: Throwable) {
            Log.w("CallRecordingFGS", "startForeground suppressed error: ${t.message}")
        }

        return START_NOT_STICKY
    }

    companion object {
        private const val NOTIFICATION_ID = 1001
        const val EXTRA_PHONE_NUMBER = "extra_phone_number"

        fun start(context: Context, phoneNumber: String) {
            try {
                val intent = Intent(context, CallRecordingForegroundService::class.java).apply {
                    putExtra(EXTRA_PHONE_NUMBER, phoneNumber)
                }
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    context.startForegroundService(intent)
                } else {
                    context.startService(intent)
                }
            } catch (t: Throwable) {
                Log.w("CallRecordingFGS", "Cannot start foreground service: ${t.message}")
            }
        }

        fun stop(context: Context) {
            try {
                context.stopService(Intent(context, CallRecordingForegroundService::class.java))
            } catch (t: Throwable) {
                Log.w("CallRecordingFGS", "Cannot stop foreground service: ${t.message}")
            }
        }
    }
}
