package uz.onecall.agent.core

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.provider.CallLog
import android.util.Log
import androidx.core.content.ContextCompat

object CallLogHelper {
    private const val TAG = "CallLogHelper"

    data class CallLogEntry(
        val number: String,
        val type: Int, // CallLog.Calls.INCOMING_TYPE, OUTGOING_TYPE, MISSED_TYPE
        val duration: Int,
        val date: Long
    )

    fun getLatestCall(context: Context): CallLogEntry? {
        if (ContextCompat.checkSelfPermission(context, Manifest.permission.READ_CALL_LOG)
            != PackageManager.PERMISSION_GRANTED) {
            Log.w(TAG, "READ_CALL_LOG permission not granted")
            return null
        }

        try {
            val cursor = context.contentResolver.query(
                CallLog.Calls.CONTENT_URI,
                arrayOf(
                    CallLog.Calls.NUMBER,
                    CallLog.Calls.TYPE,
                    CallLog.Calls.DURATION,
                    CallLog.Calls.DATE
                ),
                null,
                null,
                "${CallLog.Calls.DATE} DESC"
            )

            cursor?.use {
                if (it.moveToFirst()) {
                    val number = it.getString(it.getColumnIndexOrThrow(CallLog.Calls.NUMBER)) ?: ""
                    val type = it.getInt(it.getColumnIndexOrThrow(CallLog.Calls.TYPE))
                    val duration = it.getInt(it.getColumnIndexOrThrow(CallLog.Calls.DURATION))
                    val date = it.getLong(it.getColumnIndexOrThrow(CallLog.Calls.DATE))

                    Log.d(TAG, "Fetched latest CallLog: num=$number, type=$type, dur=$duration, date=$date")
                    return CallLogEntry(number, type, duration, date)
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to query CallLog", e)
        }
        return null
    }
}
