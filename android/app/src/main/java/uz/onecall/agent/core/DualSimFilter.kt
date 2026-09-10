package uz.onecall.agent.core

import uz.onecall.agent.data.preferences.PreferenceManager

object DualSimFilter {

    /**
     * Determines whether the call on the specified SIM slot should be recorded.
     * @param simSlot 0 for SIM 1, 1 for SIM 2
     * @param preferences Application preferences
     * @return true if call should be recorded, false if ignored
     */
    fun shouldRecordSim(simSlot: Int, preferences: PreferenceManager): Boolean {
        val selectedSlot = preferences.selectedSimSlot
        // 0 = All SIMs allowed
        // 1 = Only SIM 1 allowed (simSlot index 0)
        // 2 = Only SIM 2 allowed (simSlot index 1)
        return when (selectedSlot) {
            1 -> simSlot == 0
            2 -> simSlot == 1
            else -> true
        }
    }
}
