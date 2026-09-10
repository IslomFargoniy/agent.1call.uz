package uz.onecall.agent.core

import org.json.JSONObject
import uz.onecall.agent.data.preferences.PreferenceManager
import java.util.Calendar
import java.util.Locale

object WorkHoursFilter {

    /**
     * Checks if a call should be recorded based on work hours schedule and privacy blacklist.
     */
    fun shouldRecordCall(phoneNumber: String, preferences: PreferenceManager): Boolean {
        // 1. Check privacy blacklist
        val blacklist = preferences.privacyBlacklist
        if (!blacklist.isNullOrBlank()) {
            val cleanIncoming = phoneNumber.replace(Regex("[^0-9+]"), "")
            val numbers = blacklist.split(",").map { it.trim().replace(Regex("[^0-9+]"), "") }
            for (blocked in numbers) {
                if (blocked.isNotEmpty() && (cleanIncoming == blocked || cleanIncoming.endsWith(blocked))) {
                    return false // Blacklisted contact, do not record
                }
            }
        }

        // 2. Check work schedule if defined
        val scheduleJson = preferences.workScheduleJson
        if (!scheduleJson.isNullOrBlank()) {
            try {
                val json = JSONObject(scheduleJson)
                if (json.optBoolean("enabled", false)) {
                    val calendar = Calendar.getInstance()
                    val dayOfWeek = calendar.get(Calendar.DAY_OF_WEEK)
                    val daysMap = mapOf(
                        Calendar.MONDAY to "mon",
                        Calendar.TUESDAY to "tue",
                        Calendar.WEDNESDAY to "wed",
                        Calendar.THURSDAY to "thu",
                        Calendar.FRIDAY to "fri",
                        Calendar.SATURDAY to "sat",
                        Calendar.SUNDAY to "sun"
                    )

                    val currentDayKey = daysMap[dayOfWeek] ?: "mon"
                    val daysArray = json.optJSONArray("days")
                    var isWorkDay = false
                    if (daysArray != null) {
                        for (i in 0 until daysArray.length()) {
                            if (daysArray.getString(i).lowercase(Locale.US) == currentDayKey) {
                                isWorkDay = true
                                break
                            }
                        }
                    }

                    if (!isWorkDay) {
                        return false // Day off, do not record
                    }

                    val startHour = json.optInt("start_hour", 9)
                    val startMinute = json.optInt("start_minute", 0)
                    val endHour = json.optInt("end_hour", 18)
                    val endMinute = json.optInt("end_minute", 0)

                    val currentHour = calendar.get(Calendar.HOUR_OF_DAY)
                    val currentMinute = calendar.get(Calendar.MINUTE)

                    val currentTotalMinutes = currentHour * 60 + currentMinute
                    val startTotalMinutes = startHour * 60 + startMinute
                    val endTotalMinutes = endHour * 60 + endMinute

                    if (currentTotalMinutes < startTotalMinutes || currentTotalMinutes > endTotalMinutes) {
                        return false // Outside work hours, do not record
                    }
                }
            } catch (e: Exception) {
                // If invalid JSON, fallback to default allow
            }
        }

        return true
    }
}
