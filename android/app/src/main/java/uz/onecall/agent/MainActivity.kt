package uz.onecall.agent

import android.Manifest
import android.accessibilityservice.AccessibilityServiceInfo
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.view.accessibility.AccessibilityManager
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.core.content.ContextCompat
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import uz.onecall.agent.ui.screens.home.HomeScreen
import uz.onecall.agent.ui.screens.pairing.PairingScreen
import uz.onecall.agent.ui.screens.permissions.PermissionsScreen
import uz.onecall.agent.ui.screens.settings.SettingsScreen
import uz.onecall.agent.ui.theme.OneCallTheme

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setContent {
            OneCallTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    AppNavigation()
                }
            }
        }
    }

    private fun areCorePermissionsGranted(): Boolean {
        val phoneGranted = ContextCompat.checkSelfPermission(
            this,
            Manifest.permission.READ_PHONE_STATE
        ) == PackageManager.PERMISSION_GRANTED

        val audioGranted = ContextCompat.checkSelfPermission(
            this,
            Manifest.permission.RECORD_AUDIO
        ) == PackageManager.PERMISSION_GRANTED

        val am = getSystemService(Context.ACCESSIBILITY_SERVICE) as AccessibilityManager
        val enabledServices = am.getEnabledAccessibilityServiceList(AccessibilityServiceInfo.FEEDBACK_ALL_MASK)
        val accessibilityEnabled = enabledServices.any { it.resolveInfo.serviceInfo.packageName == packageName }

        return phoneGranted && audioGranted && accessibilityEnabled
    }

    @Composable
    fun AppNavigation() {
        val navController = rememberNavController()
        val prefs = OneCallApplication.instance.preferences

        val startDest = when {
            !areCorePermissionsGranted() -> "permissions"
            !prefs.isPaired -> "pairing"
            else -> "home"
        }

        NavHost(
            navController = navController,
            startDestination = startDest
        ) {
            composable("permissions") {
                PermissionsScreen(
                    onAllGranted = {
                        if (prefs.isPaired) {
                            navController.navigate("home") {
                                popUpTo("permissions") { inclusive = true }
                            }
                        } else {
                            navController.navigate("pairing") {
                                popUpTo("permissions") { inclusive = true }
                            }
                        }
                    }
                )
            }

            composable("pairing") {
                PairingScreen(
                    onPairedSuccess = {
                        navController.navigate("home") {
                            popUpTo("pairing") { inclusive = true }
                        }
                    }
                )
            }

            composable("home") {
                HomeScreen(
                    onNavigateToSettings = {
                        navController.navigate("settings")
                    }
                )
            }

            composable("settings") {
                SettingsScreen(
                    onNavigateBack = {
                        navController.popBackStack()
                    },
                    onUnpaired = {
                        navController.navigate("pairing") {
                            popUpTo("home") { inclusive = true }
                        }
                    }
                )
            }
        }
    }
}
