package uz.onecall.agent.workers

import android.content.Context
import android.util.Log
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import okhttp3.RequestBody.Companion.toRequestBody
import uz.onecall.agent.OneCallApplication
import uz.onecall.agent.data.local.LocalCallRecord
import uz.onecall.agent.data.remote.ApiClient
import java.io.File
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

class CallSyncWorker(
    context: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(context, workerParams) {

    override suspend fun doWork(): Result {
        val app = OneCallApplication.instance
        val dao = app.database.callDao()
        val prefs = app.preferences

        if (!prefs.isPaired || prefs.deviceToken.isNullOrEmpty()) {
            Log.w(TAG, "Device is not paired. Skipping sync.")
            return Result.success()
        }

        val pendingCalls = dao.getPendingCalls()
        if (pendingCalls.isEmpty()) {
            Log.d(TAG, "No pending calls to sync.")
            return Result.success()
        }

        Log.i(TAG, "Starting sync for ${pendingCalls.size} pending calls")
        val apiService = ApiClient.getService()
        val isoFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US).apply {
            timeZone = TimeZone.getTimeZone("UTC")
        }

        for (call in pendingCalls) {
            try {
                dao.update(call.copy(syncStatus = LocalCallRecord.STATUS_UPLOADING))

                var audioPart: MultipartBody.Part? = null
                if (!call.audioFilePath.isNullOrEmpty()) {
                    val audioFile = File(call.audioFilePath)
                    if (audioFile.exists() && audioFile.length() > 0) {
                        val requestBody = audioFile.asRequestBody("audio/mp4".toMediaTypeOrNull())
                        audioPart = MultipartBody.Part.createFormData("audio", audioFile.name, requestBody)
                    }
                }

                val phoneBody = call.phoneNumber.toRequestBody("text/plain".toMediaTypeOrNull())
                val dirBody = call.direction.toRequestBody("text/plain".toMediaTypeOrNull())
                val simBody = call.simSlot.toString().toRequestBody("text/plain".toMediaTypeOrNull())
                val durBody = call.durationSeconds.toString().toRequestBody("text/plain".toMediaTypeOrNull())
                val startIso = isoFormat.format(Date(call.startedAt * 1000))
                val endIso = isoFormat.format(Date(call.endedAt * 1000))
                val startBody = startIso.toRequestBody("text/plain".toMediaTypeOrNull())
                val endBody = endIso.toRequestBody("text/plain".toMediaTypeOrNull())

                val response = apiService.uploadCall(
                    audio = audioPart,
                    phoneNumber = phoneBody,
                    direction = dirBody,
                    simSlot = simBody,
                    durationSeconds = durBody,
                    startedAt = startBody,
                    endedAt = endBody
                )

                if (response.isSuccessful) {
                    Log.i(TAG, "Successfully synced call #${call.id} (${call.phoneNumber})")
                    dao.update(
                        call.copy(
                            syncStatus = LocalCallRecord.STATUS_SYNCED,
                            remoteCallId = response.body()?.callId,
                            errorMessage = null
                        )
                    )

                    // Optional: remove local file after successful sync to save phone memory
                    if (!call.audioFilePath.isNullOrEmpty()) {
                        try {
                            File(call.audioFilePath).delete()
                        } catch (e: Exception) {
                            Log.w(TAG, "Failed to delete uploaded audio file", e)
                        }
                    }
                } else {
                    val errorMsg = "HTTP ${response.code()}: ${response.errorBody()?.string()}"
                    Log.e(TAG, "Failed to sync call #${call.id}: $errorMsg")
                    val newRetry = call.retryCount + 1
                    val newStatus = if (newRetry >= 5) LocalCallRecord.STATUS_FAILED else LocalCallRecord.STATUS_PENDING
                    dao.update(call.copy(syncStatus = newStatus, retryCount = newRetry, errorMessage = errorMsg))
                }
            } catch (e: Exception) {
                Log.e(TAG, "Network exception during sync call #${call.id}", e)
                val newRetry = call.retryCount + 1
                val newStatus = if (newRetry >= 5) LocalCallRecord.STATUS_FAILED else LocalCallRecord.STATUS_PENDING
                dao.update(call.copy(syncStatus = newStatus, retryCount = newRetry, errorMessage = e.message))
            }
        }

        return Result.success()
    }

    companion object {
        private const val TAG = "CallSyncWorker"
    }
}
