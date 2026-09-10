package uz.onecall.agent.core

import android.content.Context
import android.media.MediaRecorder
import android.os.Build
import android.util.Log
import java.io.File
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class AudioRecorderManager(private val context: Context) {

    private var recorder: MediaRecorder? = null
    private var currentOutputFile: File? = null
    private var recordStartTime: Long = 0
    private var isRecording = false

    fun startRecording(phoneNumber: String, direction: String): File? {
        if (isRecording) {
            stopRecording()
        }

        try {
            val recordsDir = File(context.filesDir, "recordings")
            if (!recordsDir.exists()) {
                recordsDir.mkdirs()
            }

            val timestampStr = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.US).format(Date())
            val cleanPhone = phoneNumber.replace(Regex("[^0-9+]"), "")
            val fileName = "call_${direction}_${cleanPhone}_${timestampStr}.m4a"
            val outputFile = File(recordsDir, fileName)

            recorder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                MediaRecorder(context)
            } else {
                @Suppress("DEPRECATION")
                MediaRecorder()
            }

            recorder?.apply {
                // Voice communication / recognition gives clearest two-way audio on Android 10-15
                setAudioSource(MediaRecorder.AudioSource.VOICE_COMMUNICATION)
                setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
                setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
                setAudioSamplingRate(16000) // 16kHz high quality voice
                setAudioEncodingBitRate(24000) // 24kbps (~180KB per minute)
                setAudioChannels(1) // Mono
                setOutputFile(outputFile.absolutePath)

                prepare()
                start()
            }

            currentOutputFile = outputFile
            recordStartTime = System.currentTimeMillis()
            isRecording = true

            Log.i("AudioRecorderManager", "Recording started: ${outputFile.absolutePath}")
            return outputFile
        } catch (e: Exception) {
            Log.e("AudioRecorderManager", "Failed to start recording with VOICE_COMMUNICATION, trying MIC fallback", e)
            return startRecordingFallback(phoneNumber, direction)
        }
    }

    private fun startRecordingFallback(phoneNumber: String, direction: String): File? {
        try {
            val recordsDir = File(context.filesDir, "recordings")
            val timestampStr = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.US).format(Date())
            val cleanPhone = phoneNumber.replace(Regex("[^0-9+]"), "")
            val fileName = "call_${direction}_${cleanPhone}_${timestampStr}.m4a"
            val outputFile = File(recordsDir, fileName)

            recorder?.reset()
            recorder?.release()

            recorder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                MediaRecorder(context)
            } else {
                @Suppress("DEPRECATION")
                MediaRecorder()
            }

            recorder?.apply {
                setAudioSource(MediaRecorder.AudioSource.MIC)
                setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
                setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
                setAudioSamplingRate(16000)
                setAudioEncodingBitRate(24000)
                setAudioChannels(1)
                setOutputFile(outputFile.absolutePath)

                prepare()
                start()
            }

            currentOutputFile = outputFile
            recordStartTime = System.currentTimeMillis()
            isRecording = true
            return outputFile
        } catch (e: Exception) {
            Log.e("AudioRecorderManager", "Recording failed completely: ${e.message}", e)
            recorder?.release()
            recorder = null
            isRecording = false
            return null
        }
    }

    fun stopRecording(): RecordResult? {
        if (!isRecording) return null

        var durationSec = 0
        try {
            durationSec = ((System.currentTimeMillis() - recordStartTime) / 1000).toInt()
            recorder?.apply {
                stop()
                reset()
                release()
            }
        } catch (e: Exception) {
            Log.e("AudioRecorderManager", "Error stopping recorder", e)
        } finally {
            recorder = null
            isRecording = false
        }

        val file = currentOutputFile
        currentOutputFile = null

        if (file != null && file.exists() && file.length() > 0) {
            return RecordResult(
                file = file,
                durationSeconds = durationSec,
                sizeBytes = file.length()
            )
        }

        return null
    }

    data class RecordResult(
        val file: File,
        val durationSeconds: Int,
        val sizeBytes: Long
    )
}
