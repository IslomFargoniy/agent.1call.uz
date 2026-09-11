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
import uz.onecall.agent.data.remote.AppVersionResponse
import uz.onecall.agent.ui.theme.AccentRed
import uz.onecall.agent.ui.theme.PrimaryBlue

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    onNavigateBack: () -> Unit,
    onUnpaired: () -> Unit
) {
    val context = LocalContext.current
    val app = OneCallApplication.instance
    val prefs = app.preferences
    val coroutineScope = rememberCoroutineScope()

    var showUnpairDialog by remember { mutableStateOf(false) }
    var isCheckingUpdate by remember { mutableStateOf(false) }
    var availableUpdate by remember { mutableStateOf<AppVersionResponse?>(null) }
    var isDownloading by remember { mutableStateOf(false) }
    var downloadProgress by remember { mutableIntStateOf(0) }
    var showUpToDateDialog by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    // Unpair Dialog
    if (showUnpairDialog) {
        AlertDialog(
            onDismissRequest = { showUnpairDialog = false },
            title = { Text("Qurilmani Uzish") },
            text = { Text("Haqiqatan ham ushbu qurilmani tizimdan uzmoqchimisiz? Yangi qo'ng'iroqlar sinxronlanmaydi.") },
            confirmButton = {
                Button(
                    onClick = {
                        prefs.clearAuth()
                        showUnpairDialog = false
                        onUnpaired()
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = AccentRed)
                ) {
                    Text("Uzish")
                }
            },
            dismissButton = {
                TextButton(onClick = { showUnpairDialog = false }) {
                    Text("Bekor qilish")
                }
            }
        )
    }

    // Up To Date Dialog
    if (showUpToDateDialog) {
        AlertDialog(
            onDismissRequest = { showUpToDateDialog = false },
            title = { Text("Dastur Eng So'nggi Versiyada") },
            text = { Text("Sizda eng oxirgi v${BuildConfig.VERSION_NAME} (Build ${BuildConfig.VERSION_CODE}) versiyasi o'rnatilgan.") },
            confirmButton = {
                Button(onClick = { showUpToDateDialog = false }) {
                    Text("OK")
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
                    Text("Yangi Versiya Mavjud: v${updateInfo.version}")
                }
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    if (!updateInfo.changelog.isNullOrEmpty()) {
                        Text(
                            text = "O'zgarishlar:",
                            fontWeight = FontWeight.SemiBold,
                            style = MaterialTheme.typography.bodyMedium
                        )
                        Text(
                            text = updateInfo.changelog,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.8f)
                        )
                    }
                    if (isDownloading) {
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "Yuklab olinmoqda... $downloadProgress%",
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
                                    errorMessage = "Yuklab olishda xatolik: ${e.localizedMessage}"
                                }
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = PrimaryBlue)
                    ) {
                        Text("Yuklab Olish va O'rnatish")
                    }
                }
            },
            dismissButton = {
                if (!isDownloading && !updateInfo.forceUpdate) {
                    TextButton(onClick = { availableUpdate = null }) {
                        Text("Keyinroq")
                    }
                }
            }
        )
    }

    // Error Dialog
    errorMessage?.let { msg ->
        AlertDialog(
            onDismissRequest = { errorMessage = null },
            title = { Text("Xatolik") },
            text = { Text(msg) },
            confirmButton = {
                Button(onClick = { errorMessage = null }) {
                    Text("OK")
                }
            }
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Sozlamalar", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Orqaga")
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
                            contentDescription = "1Call Logo",
                            modifier = Modifier
                                .size(28.dp)
                                .clip(RoundedCornerShape(6.dp))
                        )
                        Spacer(modifier = Modifier.width(10.dp))
                        Text(text = "Qurilma Ma'lumotlari", fontWeight = FontWeight.SemiBold)
                    }
                    Spacer(modifier = Modifier.height(12.dp))
                    InfoRow(label = "Model:", value = prefs.deviceName)
                    InfoRow(label = "Kompaniya:", value = prefs.tenantName ?: "Ulanmagan")
                    InfoRow(label = "Operator:", value = prefs.operatorName ?: "Noma'lum")
                    InfoRow(label = "Server:", value = prefs.baseUrl)
                    InfoRow(label = "Versiya:", value = "${BuildConfig.VERSION_NAME} (Build ${BuildConfig.VERSION_CODE})")
                    InfoRow(label = "Hardware UID:", value = prefs.hardwareUid.take(16) + "...")
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
                        Text(text = "Dastur Yangilanishi", fontWeight = FontWeight.SemiBold)
                    }
                    Spacer(modifier = Modifier.height(10.dp))
                    Text(
                        text = "Joriy versiya: v${BuildConfig.VERSION_NAME}. Yangi imkoniyatlar va barqarorlik uchun yangilanishlarni doimiy tekshirib turing.",
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
                            Text("Tekshirilmoqda...")
                        } else {
                            Icon(Icons.Default.SystemUpdate, contentDescription = null, modifier = Modifier.size(18.dp))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Yangilanishlarni Tekshirish")
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
                        Text(text = "Ishlab Chiqaruvchi Tavsiyalari", fontWeight = FontWeight.SemiBold)
                    }
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        text = "Ilova fonda to'xtab qolmasligi uchun telefoningiz sozlamalarida quyidagilarni tekshiring:",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                    )
                    Spacer(modifier = Modifier.height(10.dp))
                    GuideBullet(
                        title = "Xiaomi / Redmi / POCO:",
                        desc = "Sozlamalar -> Ilovalar -> 1Call Agent -> Avto-boshlash (Автозапуск) ni yoqing, Batareya tejash -> Cheklovsiz (Нет ограничений) qiling."
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    GuideBullet(
                        title = "Samsung OneUI:",
                        desc = "Sozlamalar -> Batareya -> Fon cheklovlari -> Hech qachon uxlamaydigan ilovalar ro'yxatiga qo'shing."
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    GuideBullet(
                        title = "Huawei / Honor:",
                        desc = "Sozlamalar -> Ilovalar -> 1Call Agent -> Ishga tushirish -> Qo'lda boshqarish (Hammasini yoqing)."
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
                Text("Tizim Ilova Sozlamalarini Ochish")
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
                Text("Qurilmani Tizimdan Uzish")
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
