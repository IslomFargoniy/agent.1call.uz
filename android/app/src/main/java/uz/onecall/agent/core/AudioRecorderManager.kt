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

            // On modern Android (10-15), VOICE_RECOGNITION avoids telephony AEC hardware mute
            // conflicts on Samsung/Pixel and captures clear speech during calls. MIC is the standard fallback.
            val sourcesToTry = listOf(
                MediaRecorder.AudioSource.VOICE_COMMUNICATION,
                MediaRecorder.AudioSource.VOICE_RECOGNITION,
                MediaRecorder.AudioSource.MIC,
                MediaRecorder.AudioSource.DEFAULT
            )

            var recorderStarted = false
            for (source in sourcesToTry) {
                try {
                    val mr = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                        MediaRecorder(context)
                    } else {
                        @Suppress("DEPRECATION")
                        MediaRecorder()
                    }

                    mr.apply {
                        setAudioSource(source)
                        setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
                        setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
                        setAudioSamplingRate(44100) // Standard 44.1kHz AAC
                        setAudioEncodingBitRate(64000) // 64kbps high quality speech
                        setAudioChannels(1) // Mono
                        setOutputFile(outputFile.absolutePath)

                        prepare()
                        start()
                    }

                    recorder = mr
                    currentOutputFile = outputFile
                    recordStartTime = System.currentTimeMillis()
                    isRecording = true
                    recorderStarted = true

                    Log.i(TAG, "Recording started with source: $source to ${outputFile.absolutePath}")
                    return outputFile
                } catch (e: Throwable) {
                    Log.w(TAG, "AudioSource $source failed: ${e.message}, trying next...")
                    try {
                        recorder?.reset()
                        recorder?.release()
                    } catch (_: Throwable) {}
                    recorder = null
                }
            }

            if (!recorderStarted) {
                Log.e(TAG, "All audio sources failed to start recording")
                isRecording = false
                return null
            }
            return outputFile
        } catch (e: Exception) {
            Log.e(TAG, "Failed to start recording: ${e.message}", e)
            isRecording = false
            return null
        }
    }

    fun stopRecording(): RecordResult? {
        if (!isRecording) return null

        var durationSec = 0
        var maxAmp = 0
        try {
            durationSec = ((System.currentTimeMillis() - recordStartTime) / 1000).toInt()
            recorder?.apply {
                try {
                    maxAmp = maxAmplitude
                } catch (_: Throwable) {}
                stop()
                reset()
                release()
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error stopping recorder", e)
        } finally {
            recorder = null
            isRecording = false
        }

        val file = currentOutputFile
        currentOutputFile = null

        if (file != null && file.exists() && file.length() > 0) {
            Log.i(TAG, "Recording finished: ${file.name}, duration: ${durationSec}s, size: ${file.length()} bytes, maxAmp: $maxAmp")
            return RecordResult(
                file = file,
                durationSeconds = durationSec,
                sizeBytes = file.length()
            )
        }

        return null
    }

    companion object {
        private const val TAG = "AudioRecorderManager"
    }

    data class RecordResult(
        val file: File,
        val durationSeconds: Int,
        val sizeBytes: Long
    )
}
