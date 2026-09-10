package uz.onecall.agent.ui.screens.permissions

import android.Manifest
import android.accessibilityservice.AccessibilityServiceInfo
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import android.view.accessibility.AccessibilityManager
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.BatteryChargingFull
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.SettingsAccessibility
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import uz.onecall.agent.ui.theme.AccentGreen
import uz.onecall.agent.ui.theme.PrimaryBlue

@Composable
fun PermissionsScreen(
    onAllGranted: () -> Unit
) {
    val context = LocalContext.current
    var isPhoneGranted by remember { mutableStateOf(false) }
    var isAudioGranted by remember { mutableStateOf(false) }
    var isNotificationGranted by remember { mutableStateOf(false) }
    var isAccessibilityEnabled by remember { mutableStateOf(false) }
    var isBatteryOptimized by remember { mutableStateOf(false) }

    fun checkStatus() {
        isPhoneGranted = androidx.core.content.ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.READ_PHONE_STATE
        ) == android.content.pm.PackageManager.PERMISSION_GRANTED

        isAudioGranted = androidx.core.content.ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.RECORD_AUDIO
        ) == android.content.pm.PackageManager.PERMISSION_GRANTED

        isNotificationGranted = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            androidx.core.content.ContextCompat.checkSelfPermission(
                context,
                Manifest.permission.POST_NOTIFICATIONS
            ) == android.content.pm.PackageManager.PERMISSION_GRANTED
        } else {
            true
        }

        val am = context.getSystemService(Context.ACCESSIBILITY_SERVICE) as AccessibilityManager
        val enabledServices = am.getEnabledAccessibilityServiceList(AccessibilityServiceInfo.FEEDBACK_ALL_MASK)
        isAccessibilityEnabled = enabledServices.any { it.resolveInfo.serviceInfo.packageName == context.packageName }

        val pm = context.getSystemService(Context.POWER_SERVICE) as PowerManager
        isBatteryOptimized = pm.isIgnoringBatteryOptimizations(context.packageName)
    }

    LaunchedEffect(Unit) {
        checkStatus()
    }

    val requestPermissionsLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) {
        checkStatus()
    }

    val allDone = isPhoneGranted && isAudioGranted && isNotificationGranted && isAccessibilityEnabled

    Scaffold { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(24.dp)
                .verticalScroll(rememberScrollState()),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = "Tizim Ruxsatnomalari",
                style = MaterialTheme.typography.titleLarge,
                color = MaterialTheme.colorScheme.primary
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "1Call Agent qo'ng'iroqlarni aniqlashi va barqaror yozib olishi uchun quyidagi ruxsatlar zarur:",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.7f)
            )

            Spacer(modifier = Modifier.height(24.dp))

            // 1. Phone state
            PermissionCard(
                title = "Telefon qo'ng'iroqlari",
                description = "Kiruvchi va chiquvchi raqamlarni aniqlash",
                icon = Icons.Default.Phone,
                isGranted = isPhoneGranted,
                onGrant = {
                    val permissions = mutableListOf(
                        Manifest.permission.READ_PHONE_STATE,
                        Manifest.permission.READ_CALL_LOG
                    )
                    requestPermissionsLauncher.launch(permissions.toTypedArray())
                }
            )

            Spacer(modifier = Modifier.height(12.dp))

            // 2. Audio Record
            PermissionCard(
                title = "Mikrofon / Ovoz yozish",
                description = "Suhbat audio yozuvini yaratish (AAC siqish bilan)",
                icon = Icons.Default.Mic,
                isGranted = isAudioGranted,
                onGrant = {
                    requestPermissionsLauncher.launch(arrayOf(Manifest.permission.RECORD_AUDIO))
                }
            )

            Spacer(modifier = Modifier.height(12.dp))

            // 3. Accessibility
            PermissionCard(
                title = "Qo'ng'iroq Yozuv Xizmati",
                description = "Maxsus imkoniyatlar (Accessibility) orqali avto-yozish",
                icon = Icons.Default.SettingsAccessibility,
                isGranted = isAccessibilityEnabled,
                onGrant = {
                    val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
                    context.startActivity(intent)
                }
            )

            Spacer(modifier = Modifier.height(12.dp))

            // 4. Battery Optimization
            PermissionCard(
                title = "Fondagi Faoliyat (Batareya)",
                description = "Tizim ilovani to'xtatib qo'ymasligi uchun cheklovni olib tashlash",
                icon = Icons.Default.BatteryChargingFull,
                isGranted = isBatteryOptimized,
                onGrant = {
                    try {
                        val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
                            data = Uri.parse("package:${context.packageName}")
                        }
                        context.startActivity(intent)
                    } catch (e: Exception) {
                        context.startActivity(Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS))
                    }
                }
            )

            Spacer(modifier = Modifier.height(28.dp))

            Button(
                onClick = onAllGranted,
                enabled = allDone,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = PrimaryBlue)
            ) {
                Text(text = if (allDone) "Davom etish" else "Barcha ruxsatlarni bering")
            }
        }
    }
}

@Composable
fun PermissionCard(
    title: String,
    description: String,
    icon: ImageVector,
    isGranted: Boolean,
    onGrant: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = if (isGranted) AccentGreen else PrimaryBlue,
                modifier = Modifier.size(32.dp)
            )
            Spacer(modifier = Modifier.width(16.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(text = title, style = MaterialTheme.typography.titleMedium)
                Text(
                    text = description,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.6f)
                )
            }
            Spacer(modifier = Modifier.width(8.dp))
            if (isGranted) {
                Icon(
                    imageVector = Icons.Default.CheckCircle,
                    contentDescription = "Berilgan",
                    tint = AccentGreen,
                    modifier = Modifier.size(28.dp)
                )
            } else {
                OutlinedButton(
                    onClick = onGrant,
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text(text = "Ruxsat")
                }
            }
        }
    }
}
