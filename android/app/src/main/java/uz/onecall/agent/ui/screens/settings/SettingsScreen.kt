package uz.onecall.agent.ui.screens.settings

import androidx.compose.foundation.Image
import androidx.compose.ui.draw.clip
import androidx.compose.ui.res.painterResource
import uz.onecall.agent.R

import android.content.Intent
import android.net.Uri
import android.provider.Settings
import android.widget.Toast
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
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.BatteryAlert
import androidx.compose.material.icons.filled.CloudDownload
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Logout
import androidx.compose.material.icons.filled.PhoneAndroid
import androidx.compose.material.icons.filled.SystemUpdate
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.launch
import uz.onecall.agent.BuildConfig
import uz.onecall.agent.OneCallApplication
import uz.onecall.agent.core.AppUpdateManager
import uz.onecall.agent.core.UpdateCheckResult
import uz.onecall.agent.core.appStrings
import uz.onecall.agent.data.remote.AppVersionResponse
import uz.onecall.agent.ui.components.LanguageSelectorCard
import uz.onecall.agent.ui.theme.AccentRed
import uz.onecall.agent.ui.theme.PrimaryBlue

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    onNavigateBack: () -> Unit,
    onUnpaired: () -> Unit
) {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()
    val prefs = OneCallApplication.instance.preferences
    val s = appStrings()

    var showUnpairDialog by remember { mutableStateOf(false) }
    var isCheckingUpdate by remember { mutableStateOf(false) }
    var availableUpdate by remember { mutableStateOf<AppVersionResponse?>(null) }
    var showUpToDateDialog by remember { mutableStateOf(false) }
    var isDownloading by remember { mutableStateOf(false) }
    var downloadProgress by remember { mutableIntStateOf(0) }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    // Unpair Dialog
    if (showUnpairDialog) {
        AlertDialog(
            onDismissRequest = { showUnpairDialog = false },
            title = { Text(s.unpairConfirmTitle, fontWeight = FontWeight.Bold) },
            text = {
                Text(s.unpairConfirmDesc)
            },
            confirmButton = {
                Button(
                    onClick = {
                        prefs.clearAuth()
                        showUnpairDialog = false
                        onUnpaired()
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = AccentRed)
                ) {
                    Text(s.unpairConfirmAction)
                }
            },
            dismissButton = {
                TextButton(onClick = { showUnpairDialog = false }) {
                    Text(s.cancel)
                }
            }
        )
    }

    // Update Available Dialog
    availableUpdate?.let { updateInfo ->
        AlertDialog(
            onDismissRequest = {
                if (!isDownloading && !updateInfo.forceUpdate) {
                    availableUpdate = null
                }
            },
            title = {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.SystemUpdate, contentDescription = null, tint = PrimaryBlue)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("${s.updateAvailableBanner}: v${updateInfo.version}", fontWeight = FontWeight.Bold)
                }
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    if (!updateInfo.changelog.isNullOrEmpty()) {
                        Text(
                            text = updateInfo.changelog,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.8f)
                        )
                    }
                    if (isDownloading) {
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "${s.syncing} $downloadProgress%",
                            style = MaterialTheme.typography.bodySmall,
                            fontWeight = FontWeight.Medium
                        )
                        LinearProgressIndicator(
                            progress = { downloadProgress / 100f },
                            modifier = Modifier.fillMaxWidth().height(6.dp),
                            color = PrimaryBlue
                        )
                    }
                }
            },
            confirmButton = {
                if (!isDownloading) {
                    Button(
                        onClick = {
                            isDownloading = true
                            downloadProgress = 0
                            coroutineScope.launch {
                                val result = AppUpdateManager.downloadAndInstallApk(
                                    context = context,
                                    downloadUrl = updateInfo.downloadUrl,
                                    onProgress = { p -> downloadProgress = p }
                                )
                                isDownloading = false
                                result.onSuccess { apkFile ->
                                    availableUpdate = null
                                    AppUpdateManager.promptInstall(context, apkFile)
                                }.onFailure { e ->
                                    errorMessage = "${s.error}: ${e.localizedMessage}"
                                }
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = PrimaryBlue)
                    ) {
                        Text(s.updateClickHint)
                    }
                }
            },
            dismissButton = {
                if (!isDownloading && !updateInfo.forceUpdate) {
                    TextButton(onClick = { availableUpdate = null }) {
                        Text(s.cancel)
                    }
                }
            }
        )
    }

    // Up To Date Dialog
    if (showUpToDateDialog) {
        AlertDialog(
            onDismissRequest = { showUpToDateDialog = false },
            title = { Text(s.success, fontWeight = FontWeight.Bold) },
            text = {
                Text(s.currentVersionDesc.format(BuildConfig.VERSION_NAME))
            },
            confirmButton = {
                TextButton(onClick = { showUpToDateDialog = false }) {
                    Text(s.ok)
                }
            }
        )
    }

    // Error Dialog
    if (errorMessage != null) {
        AlertDialog(
            onDismissRequest = { errorMessage = null },
            title = { Text(s.error, fontWeight = FontWeight.Bold) },
            text = { Text(errorMessage ?: "") },
            confirmButton = {
                TextButton(onClick = { errorMessage = null }) {
                    Text(s.ok)
                }
            }
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(s.settingsTitle, fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = s.back)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.surface)
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Language Selection Card (UZ / RU / EN)
            LanguageSelectorCard()

            // Device Information Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Image(
                            painter = painterResource(id = R.drawable.ic_1call_logo),
                            contentDescription = "Agent1Call Logo",
                            modifier = Modifier
                                .size(28.dp)
                                .clip(RoundedCornerShape(6.dp))
                        )
                        Spacer(modifier = Modifier.width(10.dp))
                        Text(text = s.deviceInfoTitle, fontWeight = FontWeight.SemiBold)
                    }
                    Spacer(modifier = Modifier.height(12.dp))
                    InfoRow(label = "${s.model}:", value = prefs.deviceName)
                    InfoRow(label = "${s.company}:", value = prefs.tenantName ?: s.notPaired)
                    InfoRow(label = "${s.operator}:", value = prefs.operatorName ?: s.unknown)
                    InfoRow(label = "${s.server}:", value = prefs.baseUrl)
                    InfoRow(label = "${s.version}:", value = "${BuildConfig.VERSION_NAME} (Build ${BuildConfig.VERSION_CODE})")
                    InfoRow(label = "${s.hardwareUid}:", value = prefs.hardwareUid.take(16) + "...")
                }
            }

            // App Updates Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.CloudDownload, contentDescription = null, tint = PrimaryBlue)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(text = s.appUpdateTitle, fontWeight = FontWeight.SemiBold)
                    }
                    Spacer(modifier = Modifier.height(10.dp))
                    Text(
                        text = s.currentVersionDesc.format(BuildConfig.VERSION_NAME),
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Button(
                        onClick = {
                            isCheckingUpdate = true
                            coroutineScope.launch {
                                when (val res = AppUpdateManager.checkForUpdate()) {
                                    is UpdateCheckResult.UpdateAvailable -> {
                                        availableUpdate = res.versionInfo
                                    }
                                    is UpdateCheckResult.UpToDate -> {
                                        showUpToDateDialog = true
                                    }
                                    is UpdateCheckResult.Error -> {
                                        errorMessage = res.message
                                    }
                                }
                                isCheckingUpdate = false
                            }
                        },
                        enabled = !isCheckingUpdate,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(10.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = PrimaryBlue)
                    ) {
                        if (isCheckingUpdate) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(20.dp),
                                color = MaterialTheme.colorScheme.onPrimary,
                                strokeWidth = 2.dp
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(s.checkingUpdate)
                        } else {
                            Icon(Icons.Default.SystemUpdate, contentDescription = null, modifier = Modifier.size(18.dp))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(s.checkUpdateBtn)
                        }
                    }
                }
            }

            // OEM Battery Guides
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.BatteryAlert, contentDescription = null, tint = PrimaryBlue)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(text = s.batteryTitle, fontWeight = FontWeight.SemiBold)
                    }
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        text = s.batteryDesc,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                    )
                    Spacer(modifier = Modifier.height(10.dp))
                    GuideBullet(
                        title = "Xiaomi / Redmi / POCO:",
                        desc = "Sozlamalar -> Ilovalar -> Agent1Call -> Avto-boshlash (Автозапуск) ni yoqing, Batareya tejash -> Cheklovsiz (Нет ограничений) qiling."
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    GuideBullet(
                        title = "Samsung OneUI:",
                        desc = "Sozlamalar -> Batareya -> Fon cheklovlari -> Hech qachon uxlamaydigan ilovalar ro'yxatiga qo'shing."
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    GuideBullet(
                        title = "Huawei / Honor:",
                        desc = "Sozlamalar -> Ilovalar -> Agent1Call -> Ishga tushirish -> Qo'lda boshqarish (Hammasini yoqing)."
                    )
                }
            }

            // System App Info button
            OutlinedButton(
                onClick = {
                    val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                        data = Uri.parse("package:${context.packageName}")
                    }
                    context.startActivity(intent)
                },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(10.dp)
            ) {
                Icon(Icons.Default.Info, contentDescription = null)
                Spacer(modifier = Modifier.width(8.dp))
                Text(s.openSettingsBtn)
            }

            // Unpair button
            Button(
                onClick = { showUnpairDialog = true },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(10.dp),
                colors = ButtonDefaults.buttonColors(containerColor = AccentRed)
            ) {
                Icon(Icons.Default.Logout, contentDescription = null)
                Spacer(modifier = Modifier.width(8.dp))
                Text(s.unpairBtn)
            }
        }
    }
}

@Composable
fun InfoRow(label: String, value: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(text = label, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f))
        Text(text = value, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Medium)
    }
}

@Composable
fun GuideBullet(title: String, desc: String) {
    Column {
        Text(text = title, fontWeight = FontWeight.Bold, fontSize = 13.sp)
        Text(text = desc, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f))
    }
}
