package uz.onecall.agent.core

import android.content.Context
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.net.Uri
import android.util.Log
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import uz.onecall.agent.data.local.LocalCallRecord
import java.io.File

object AudioPlayerManager {
    private const val TAG = "AudioPlayerManager"

    private var mediaPlayer: MediaPlayer? = null
    private val scope = CoroutineScope(Dispatchers.Main)
    private var progressJob: Job? = null

    private val _playingCallId = MutableStateFlow<Long?>(null)
    val playingCallId: StateFlow<Long?> = _playingCallId.asStateFlow()

    private val _isPlaying = MutableStateFlow(false)
    val isPlaying: StateFlow<Boolean> = _isPlaying.asStateFlow()

    private val _currentPositionMs = MutableStateFlow(0)
    val currentPositionMs: StateFlow<Int> = _currentPositionMs.asStateFlow()

    private val _durationMs = MutableStateFlow(0)
    val durationMs: StateFlow<Int> = _durationMs.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    fun playOrToggle(
        context: Context,
        call: LocalCallRecord,
        baseUrl: String = "https://agent.1call.uz",
        token: String? = null
    ) {
        if (_playingCallId.value == call.id) {
            if (_isPlaying.value) {
                pause()
            } else {
                resume()
            }
            return
        }

        stop()
        _playingCallId.value = call.id
        _isLoading.value = true
        _currentPositionMs.value = 0
        _durationMs.value = call.durationSeconds * 1000

        scope.launch(Dispatchers.IO) {
            try {
                val mp = MediaPlayer().apply {
                    setAudioAttributes(
                        AudioAttributes.Builder()
                            .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                            .setUsage(AudioAttributes.USAGE_MEDIA)
                            .build()
                    )
                }

                var sourceSet = false

                // 1. Check local audio file first (zero data usage)
                if (!call.audioFilePath.isNullOrEmpty()) {
                    val localFile = File(call.audioFilePath)
                    if (localFile.exists() && localFile.length() > 0) {
                        mp.setDataSource(localFile.absolutePath)
                        sourceSet = true
                        Log.i(TAG, "Playing call #${call.id} from local file: ${localFile.absolutePath}")
                    }
                }

                // 2. Fallback to server stream URL if file was synced
                if (!sourceSet && !call.remoteCallId.isNullOrEmpty()) {
                    val cleanBase = baseUrl.trimEnd('/')
                    val streamUrl = "$cleanBase/api/v1/telemetry/calls/${call.remoteCallId}/audio"
                    val headers = mutableMapOf<String, String>()
                    if (!token.isNullOrEmpty()) {
                        headers["Authorization"] = "Bearer $token"
                    }
                    mp.setDataSource(context, Uri.parse(streamUrl), headers)
                    sourceSet = true
                    Log.i(TAG, "Streaming call #${call.id} from server: $streamUrl")
                }

                if (!sourceSet) {
                    Log.w(TAG, "No audio source available for call #${call.id}")
                    _isLoading.value = false
                    _playingCallId.value = null
                    return@launch
                }

                mp.setOnPreparedListener { player ->
                    _isLoading.value = false
                    val dur = player.duration
                    if (dur > 0) {
                        _durationMs.value = dur
                    }
                    player.start()
                    _isPlaying.value = true
                    startProgressTracker()
                }

                mp.setOnCompletionListener {
                    stop()
                }

                mp.setOnErrorListener { _, what, extra ->
                    Log.e(TAG, "MediaPlayer error: what=$what, extra=$extra")
                    stop()
                    true
                }

                mp.prepareAsync()
                mediaPlayer = mp
            } catch (e: Exception) {
                Log.e(TAG, "Failed to initialize MediaPlayer for call #${call.id}", e)
                stop()
            }
        }
    }

    fun pause() {
        try {
            mediaPlayer?.pause()
            _isPlaying.value = false
            progressJob?.cancel()
        } catch (e: Exception) {
            Log.e(TAG, "Error pausing player", e)
        }
    }

    fun resume() {
        try {
            mediaPlayer?.start()
            _isPlaying.value = true
            startProgressTracker()
        } catch (e: Exception) {
            Log.e(TAG, "Error resuming player", e)
        }
    }

    fun seekTo(positionMs: Int) {
        try {
            mediaPlayer?.seekTo(positionMs)
            _currentPositionMs.value = positionMs
        } catch (e: Exception) {
            Log.e(TAG, "Error seeking player", e)
        }
    }

    fun stop() {
        progressJob?.cancel()
        progressJob = null
        try {
            mediaPlayer?.stop()
            mediaPlayer?.release()
        } catch (e: Exception) {
            Log.e(TAG, "Error stopping player", e)
        }
        mediaPlayer = null
        _isPlaying.value = false
        _isLoading.value = false
        _playingCallId.value = null
        _currentPositionMs.value = 0
    }

    private fun startProgressTracker() {
        progressJob?.cancel()
        progressJob = scope.launch {
            while (isActive && _isPlaying.value) {
                try {
                    mediaPlayer?.let { mp ->
                        if (mp.isPlaying) {
                            _currentPositionMs.value = mp.currentPosition
                            if (mp.duration > 0) {
                                _durationMs.value = mp.duration
                            }
                        }
                    }
                } catch (e: Exception) {
                    // Ignore transient exceptions during seek/stop
                }
                delay(150)
            }
        }
    }
}
