package uz.onecall.agent.ui.screens.main

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import uz.onecall.agent.OneCallApplication
import uz.onecall.agent.ui.components.AppleBottomNavBar
import uz.onecall.agent.ui.screens.calls.CallsScreen
import uz.onecall.agent.ui.screens.home.HomeScreen
import uz.onecall.agent.ui.screens.settings.SettingsScreen

@Composable
fun MainContainerScreen(
    onUnpaired: () -> Unit
) {
    var selectedTab by rememberSaveable { mutableIntStateOf(0) }
    val dao = OneCallApplication.instance.database.callDao()
    val pendingCount by dao.getPendingCallsCountFlow().collectAsState(initial = 0)

    // If user is on Calls or Profile tab and presses system back, navigate to Home tab first
    BackHandler(enabled = selectedTab != 0) {
        selectedTab = 0
    }

    Scaffold(
        bottomBar = {
            AppleBottomNavBar(
                selectedTab = selectedTab,
                onTabSelected = { selectedTab = it },
                pendingCallsCount = pendingCount
            )
        }
    ) { padding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            when (selectedTab) {
                0 -> HomeScreen(
                    onNavigateToCalls = { selectedTab = 1 },
                    onNavigateToSettings = { selectedTab = 2 }
                )
                1 -> CallsScreen()
                2 -> SettingsScreen(
                    onNavigateBack = null,
                    onUnpaired = onUnpaired
                )
            }
        }
    }
}
