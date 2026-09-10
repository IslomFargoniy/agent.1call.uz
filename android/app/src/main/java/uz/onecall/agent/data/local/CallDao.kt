package uz.onecall.agent.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import kotlinx.coroutines.flow.Flow

@Dao
interface CallDao {

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(call: LocalCallRecord): Long

    @Update
    suspend fun update(call: LocalCallRecord)

    @Query("SELECT * FROM calls WHERE syncStatus IN ('PENDING', 'FAILED') ORDER BY startedAt ASC")
    suspend fun getPendingCalls(): List<LocalCallRecord>

    @Query("SELECT * FROM calls ORDER BY startedAt DESC LIMIT 50")
    fun getRecentCallsFlow(): Flow<List<LocalCallRecord>>

    @Query("SELECT COUNT(*) FROM calls WHERE startedAt >= :startOfDayTimestamp")
    fun getTodayCallsCountFlow(startOfDayTimestamp: Long): Flow<Int>

    @Query("SELECT COUNT(*) FROM calls WHERE syncStatus IN ('PENDING', 'FAILED')")
    fun getPendingCallsCountFlow(): Flow<Int>

    @Query("DELETE FROM calls WHERE syncStatus = 'SYNCED' AND createdAt < :timestamp")
    suspend fun deleteOldSyncedCalls(timestamp: Long)
}
