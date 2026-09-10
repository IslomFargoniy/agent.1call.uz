package uz.onecall.agent.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "calls")
data class LocalCallRecord(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val remoteCallId: String? = null,
    val phoneNumber: String,
    val direction: String, // INCOMING or OUTGOING
    val simSlot: Int, // 0 for SIM 1, 1 for SIM 2
    val durationSeconds: Int = 0,
    val audioFilePath: String? = null,
    val fileSizeBytes: Long = 0,
    val startedAt: Long,
    val endedAt: Long,
    val syncStatus: String = STATUS_PENDING, // PENDING, UPLOADING, SYNCED, FAILED
    val retryCount: Int = 0,
    val errorMessage: String? = null,
    val createdAt: Long = System.currentTimeMillis()
) {
    companion object {
        const val STATUS_PENDING = "PENDING"
        const val STATUS_UPLOADING = "UPLOADING"
        const val STATUS_SYNCED = "SYNCED"
        const val STATUS_FAILED = "FAILED"
    }
}
