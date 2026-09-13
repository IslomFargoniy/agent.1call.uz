package uz.onecall.agent.ui.screens.home

import uz.onecall.agent.core.appStrings
import uz.onecall.agent.ui.components.LanguageSwitchButton

import android.content.Intent
import android.provider.Settings
import android.os.Build
import android.net.Uri
import android.os.Environment
import androidx.compose.material.icons.filled.Mic
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner

import android.widget.Toast
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.TextButton
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Folder
import uz.onecall.agent.core.SamsungRecordStatus
import uz.onecall.agent.core.SamsungRecordingFinder
import uz.onecall.agent.core.SimHelper
import uz.onecall.agent.workers.HeartbeatWorker

import androidx.compose.foundation.Image
import androidx.compose.ui.res.painterResource
import uz.onecall.agent.R

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CallMade
import androidx.compose.material.icons.filled.CallReceived
import androidx.compose.material.icons.filled.CloudDone
import androidx.compose.material.icons.filled.CloudSync
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.SimCard
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Pause
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Slider
import androidx.compose.material3.SliderDefaults
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import uz.onecall.agent.core.AudioPlayerManager
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.material.icons.filled.CloudDownload
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.mutableStateOf
import uz.onecall.agent.core.AppUpdateManager
import uz.onecall.agent.core.UpdateCheckResult
import uz.onecall.agent.data.remote.AppVersionResponse

import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.work.Constraints
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import kotlinx.coroutines.launch
import uz.onecall.agent.OneCallApplication
import uz.onecall.agent.data.local.LocalCallRecord
import uz.onecall.agent.data.remote.ApiClient
import uz.onecall.agent.data.remote.RingingRequest
import uz.onecall.agent.ui.theme.AccentGreen
import uz.onecall.agent.ui.theme.AccentRed
import uz.onecall.agent.ui.theme.PrimaryBlue
import uz.onecall.agent.workers.CallSyncWorker
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    onNavigateToCalls: () -> Unit = {},
    onNavigateToSettings: () -> Unit = {}
) {
    val s = appStrings()
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val app = OneCallApplication.instance
    val prefs = app.preferences

    DisposableEffect(Unit) {
        onDispose {
            AudioPlayerManager.stop()
        }
    }
    val dao = app.database.callDao()

    val calendar = Calendar.getInstance().apply {
        set(Calendar.HOUR_OF_DAY, 0)
        set(Calendar.MINUTE, 0)
        set(Calendar.SECOND, 0)
    }
    val startOfDay = calendar.timeInMillis / 1000

    val todayCount by dao.getTodayCallsCountFlow(startOfDay).collectAsState(initial = 0)
    val pendingCount by dao.getPendingCallsCountFlow().collectAsState(initial = 0)
    val recentCalls by dao.getRecentCallsFlow().collectAsState(initial = emptyList())

    val activeSims = remember { SimHelper.getActiveSimCards(context) }
    val isDualSim = activeSims.size > 1

    var showEditPhoneDialog by remember { mutableStateOf(false) }
    var inputPhoneNumber by remember { mutableStateOf(prefs.sim1PhoneNumber ?: "") }

    var isAllFilesAccessGranted by remember {
        mutableStateOf(
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                Environment.isExternalStorageManager()
            } else true
        )
    }

    var samsungStatus by remember {
        mutableStateOf(SamsungRecordingFinder.getSamsungStatus(context))
    }

    val lifecycleOwner = LocalLifecycleOwner.current
    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, event ->
            if (event == Lifecycle.Event.ON_RESUME) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                    isAllFilesAccessGranted = Environment.isExternalStorageManager()
                }
                samsungStatus = SamsungRecordingFinder.getSamsungStatus(context)
            }
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose {
            lifecycleOwner.lifecycle.removeObserver(observer)
        }
    }

    fun openSamsungSettings() {
        val intents = listOf(
            Intent("com.samsung.android.app.telephonyui.action.OPEN_AUTO_RECORD_SETTINGS"),
            Intent("com.samsung.android.app.telephonyui.action.OPEN_RECORD_CALL"),
            Intent(android.telecom.TelecomManager.ACTION_SHOW_CALL_SETTINGS),
            Intent().setClassName("com.samsung.android.incallui", "com.samsung.android.incallui.setting.CallRecordSettingActivity"),
            Intent().setClassName("com.samsung.android.dialer", "com.samsung.android.dialer.app.calllog.CallLogTabActivity"),
            Intent(Intent.ACTION_DIAL)
        )
        for (it in intents) {
            try {
                it.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                context.startActivity(it)
                return
            } catch (_: Throwable) {}
        }
        Toast.makeText(context, "Telefon sozlamalarida 'Qo\'ng\'iroqlarni avtomatik yozish'ni yoqing", Toast.LENGTH_LONG).show()
    }

        var updateAvailableInfo by remember { mutableStateOf<AppVersionResponse?>(null) }
    LaunchedEffect(Unit) {
        SimHelper.autoDetectPhoneNumber(context)
        when (val res = AppUpdateManager.checkForUpdate()) {
            is UpdateCheckResult.UpdateAvailable -> {
                updateAvailableInfo = res.versionInfo
            }
            else -> {}
        }
    }

    var selectedSimSlot by remember { mutableIntStateOf(prefs.selectedSimSlot) }

    fun forceSync() {
        val constraints = Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build()
        val syncWork = OneTimeWorkRequestBuilder<CallSyncWorker>()
            .setConstraints(constraints)
            .build()
        WorkManager.getInstance(context).enqueue(syncWork)
    }

    fun testRingingWebhook() {
        scope.launch {
            try {
                ApiClient.getService().sendRingingNotification(
                    RingingRequest(
                        phoneNumber = "+998901234567",
                        direction = "INCOMING",
                        simSlot = if (selectedSimSlot > 0) selectedSimSlot - 1 else 0
                    )
                )
            } catch (e: Exception) {
                // handle error
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Image(
                            painter = painterResource(id = R.drawable.ic_1call_logo),
                            contentDescription = "Agent1Call Logo",
                            modifier = Modifier
                                .size(36.dp)
                                .clip(RoundedCornerShape(8.dp))
                        )
                        Spacer(modifier = Modifier.width(10.dp))
                        Column {
                            Text(
                                text = prefs.tenantName ?: "Agent1Call",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "${s.homeHeaderOperator}: ${prefs.operatorName ?: s.active}",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                            )
                        }
                    }
                },
                actions = {
                    LanguageSwitchButton()
                    Spacer(modifier = Modifier.width(4.dp))
                    IconButton(onClick = onNavigateToSettings) {
                        Icon(Icons.Default.Settings, contentDescription = s.settings)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            )
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Update Available Banner
            if (updateAvailableInfo != null) {
                item {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = PrimaryBlue.copy(alpha = 0.12f)),
                        border = BorderStroke(1.dp, PrimaryBlue.copy(alpha = 0.4f))
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(14.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(Icons.Default.CloudDownload, contentDescription = null, tint = PrimaryBlue)
                            Spacer(modifier = Modifier.width(10.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = "Yangi versiya mavjud: v${updateAvailableInfo?.version}",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 14.sp
                                )
                                Text(
                                    text = "Ilovani yangilash uchun bosing",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                                )
                            }
                            Button(
                                onClick = onNavigateToSettings,
                                colors = ButtonDefaults.buttonColors(containerColor = PrimaryBlue),
                                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                            ) {
                                Text("Yangilash", fontSize = 12.sp)
                            }
                        }
                    }
                }
            }

            // Service Status Banner
            item {
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
                        Box(
                            modifier = Modifier
                                .size(12.dp)
                                .clip(CircleShape)
                                .background(AccentGreen)
                        )
                        Spacer(modifier = Modifier.width(12.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = s.homeHeaderActive,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Text(
                                text = "Qo'ng'iroqlar avtomatik yozib olinmoqda (AAC siqish)",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                            )
                        }
                    }
                }
            }

            // Stats Cards
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Card(
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text(
                                text = s.statsTodayTitle,
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                            )
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(
                                text = todayCount.toString(),
                                fontSize = 28.sp,
                                fontWeight = FontWeight.Bold,
                                color = PrimaryBlue
                            )
                        }
                    }

                    Card(
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text(
                                text = s.homeHeaderSyncPending,
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                            )
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(
                                text = pendingCount.toString(),
                                fontSize = 28.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (pendingCount > 0) Color(0xFFF59E0B) else AccentGreen
                            )
                        }
                    }
                }
            }

            // SIM Information / Corporate Dual-SIM Selection
            item {
                if (isDualSim) {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Default.SimCard, contentDescription = null, tint = PrimaryBlue)
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = "Korporativ SIM Slot Tanlovi",
                                    fontWeight = FontWeight.SemiBold,
                                    style = MaterialTheme.typography.titleSmall
                                )
                            }
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = "Faqat tanlangan SIM dagi qo'ng'iroqlar yoziladi. Shaxsiy SIM qo'ng'iroqlari chetlab o'tiladi.",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                            )
                            Spacer(modifier = Modifier.height(12.dp))
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                FilterChip(
                                    selected = selectedSimSlot == 0,
                                    onClick = {
                                        selectedSimSlot = 0
                                        prefs.selectedSimSlot = 0
                                    },
                                    label = { Text("Har ikkisi") }
                                )
                                FilterChip(
                                    selected = selectedSimSlot == 1,
                                    onClick = {
                                        selectedSimSlot = 1
                                        prefs.selectedSimSlot = 1
                                    },
                                    label = { Text("SIM 1") }
                                )
                                FilterChip(
                                    selected = selectedSimSlot == 2,
                                    onClick = {
                                        selectedSimSlot = 2
                                        prefs.selectedSimSlot = 2
                                    },
                                    label = { Text("SIM 2") }
                                )
                            }
                        }
                    }
                } else {
                    // Single SIM Card Info with Quick Operator Phone Number Configuration
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(Icons.Default.SimCard, contentDescription = null, tint = PrimaryBlue)
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(
                                        text = "SIM Karta (Yagona slot)",
                                        fontWeight = FontWeight.SemiBold,
                                        style = MaterialTheme.typography.titleSmall
                                    )
                                }
                                val sim1Num = prefs.sim1PhoneNumber ?: activeSims.firstOrNull()?.phoneNumber?.ifBlank { null }
                                TextButton(
                                    onClick = {
                                        inputPhoneNumber = sim1Num ?: ""
                                        showEditPhoneDialog = true
                                    }
                                ) {
                                    Text(
                                        text = if (sim1Num.isNullOrBlank()) "Raqam kiritish" else "O'zgartirish",
                                        style = MaterialTheme.typography.labelMedium,
                                        color = PrimaryBlue
                                    )
                                }
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            val carrierName = activeSims.firstOrNull()?.carrier ?: "SIM 1"
                            Text(
                                text = "Aloqa operatori: $carrierName",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                            )
                            val sim1Num = prefs.sim1PhoneNumber ?: activeSims.firstOrNull()?.phoneNumber?.ifBlank { null }
                            Text(
                                text = if (!sim1Num.isNullOrBlank()) "Operator raqami: $sim1Num" else "Operator raqami: Kiritilmagan",
                                style = MaterialTheme.typography.bodySmall,
                                fontWeight = if (!sim1Num.isNullOrBlank()) FontWeight.Medium else FontWeight.Normal,
                                color = if (!sim1Num.isNullOrBlank()) MaterialTheme.colorScheme.onSurface else Color(0xFFF59E0B)
                            )


                        }
                    }
                }
            }

            // Samsung 2-Way Audio Recording & Storage Access Banner
            item {
                when {
                    !isAllFilesAccessGranted -> {
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp),
                            colors = CardDefaults.cardColors(
                                containerColor = Color(0xFFFEF3C7)
                            ),
                            border = BorderStroke(1.dp, Color(0xFFF59E0B)),
                            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Folder,
                                        contentDescription = null,
                                        tint = Color(0xFFD97706),
                                        modifier = Modifier.size(28.dp)
                                    )
                                    Spacer(modifier = Modifier.width(12.dp))
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(
                                            text = "Fayllarga ruxsat zarur (2 tomonlama audio)",
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 15.sp,
                                            color = Color(0xFF92400E)
                                        )
                                        Spacer(modifier = Modifier.height(2.dp))
                                        Text(
                                            text = "Samsung apparatli 2 tomonlama (mijoz va siz) audio yozuvlarini ilovaga yuklash uchun 'Barcha fayllarga ruxsat' bering.",
                                            style = MaterialTheme.typography.bodySmall,
                                            color = Color(0xFF78350F)
                                        )
                                    }
                                }

                                Spacer(modifier = Modifier.height(12.dp))

                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Button(
                                        onClick = {
                                            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                                                try {
                                                    val intent = Intent(Settings.ACTION_MANAGE_APP_ALL_FILES_ACCESS_PERMISSION).apply {
                                                        data = Uri.parse("package:${context.packageName}")
                                                    }
                                                    context.startActivity(intent)
                                                } catch (e: Exception) {
                                                    val intent = Intent(Settings.ACTION_MANAGE_ALL_FILES_ACCESS_PERMISSION)
                                                    context.startActivity(intent)
                                                }
                                            }
                                        },
                                        modifier = Modifier.weight(1f),
                                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFD97706)),
                                        shape = RoundedCornerShape(8.dp),
                                        contentPadding = PaddingValues(horizontal = 8.dp, vertical = 6.dp)
                                    ) {
                                        Text(
                                            text = "Fayllarga ruxsat",
                                            fontSize = 12.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = Color.White
                                        )
                                    }

                                    OutlinedButton(
                                        onClick = { openSamsungSettings() },
                                        modifier = Modifier.weight(1f),
                                        shape = RoundedCornerShape(8.dp),
                                        contentPadding = PaddingValues(horizontal = 8.dp, vertical = 6.dp)
                                    ) {
                                        Text(
                                            text = "Telefon sozlamalari",
                                            fontSize = 12.sp,
                                            fontWeight = FontWeight.Medium
                                        )
                                    }
                                }
                            }
                        }
                    }

                    samsungStatus.callFilesCount == 0 && recentCalls.none { !it.audioFilePath.isNullOrEmpty() && it.fileSizeBytes > 1000L } -> {
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp),
                            colors = CardDefaults.cardColors(
                                containerColor = Color(0xFFFFF1F2)
                            ),
                            border = BorderStroke(1.dp, Color(0xFFF43F5E)),
                            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Warning,
                                        contentDescription = null,
                                        tint = Color(0xFFE11D48),
                                        modifier = Modifier.size(28.dp)
                                    )
                                    Spacer(modifier = Modifier.width(12.dp))
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(
                                            text = "DIQQAT: Samsung 'Avtomatik yozish' o'chiq!",
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 15.sp,
                                            color = Color(0xFF9F1239)
                                        )
                                        Spacer(modifier = Modifier.height(2.dp))
                                        Text(
                                            text = "Hozircha faqat telefon mikrofoni (o'zingiz) yozilmoqda. Ikkinchi tomon (mijoz) ovozi ham toza yozilishi uchun Samsung Telefon ilovasida 'Avtomatik yozish'ni YOQING!",
                                            style = MaterialTheme.typography.bodySmall,
                                            color = Color(0xFF881337)
                                        )
                                    }
                                }

                                Spacer(modifier = Modifier.height(12.dp))

                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Button(
                                        onClick = { openSamsungSettings() },
                                        modifier = Modifier.weight(1.3f),
                                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFE11D48)),
                                        shape = RoundedCornerShape(8.dp),
                                        contentPadding = PaddingValues(horizontal = 8.dp, vertical = 6.dp)
                                    ) {
                                        Text(
                                            text = "Avtomatik yozishni yoqish",
                                            fontSize = 12.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = Color.White
                                        )
                                    }

                                    OutlinedButton(
                                        onClick = {
                                            samsungStatus = SamsungRecordingFinder.getSamsungStatus(context)
                                            Toast.makeText(context, "Holat tekshirildi", Toast.LENGTH_SHORT).show()
                                        },
                                        modifier = Modifier.weight(0.9f),
                                        shape = RoundedCornerShape(8.dp),
                                        contentPadding = PaddingValues(horizontal = 8.dp, vertical = 6.dp)
                                    ) {
                                        Icon(
                                            Icons.Default.Refresh,
                                            contentDescription = null,
                                            modifier = Modifier.size(14.dp)
                                        )
                                        Spacer(modifier = Modifier.width(4.dp))
                                        Text(
                                            text = "Tekshirish",
                                            fontSize = 12.sp,
                                            fontWeight = FontWeight.Medium
                                        )
                                    }
                                }
                            }
                        }
                    }

                    else -> {
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp),
                            colors = CardDefaults.cardColors(
                                containerColor = Color(0xFFF0FDF4)
                            ),
                            border = BorderStroke(1.dp, AccentGreen.copy(alpha = 0.6f)),
                            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.CheckCircle,
                                        contentDescription = null,
                                        tint = AccentGreen,
                                        modifier = Modifier.size(28.dp)
                                    )
                                    Spacer(modifier = Modifier.width(12.dp))
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(
                                            text = "Samsung: 2 tomonlama audio FAOL",
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 15.sp,
                                            color = Color(0xFF166534)
                                        )
                                        Spacer(modifier = Modifier.height(2.dp))
                                        Text(
                                            text = "Apparat darajasida ikkala tomon (mijoz va operator) ovozi toza yozilmoqda (${samsungStatus.callFilesCount} ta suhbat mavjud).",
                                            style = MaterialTheme.typography.bodySmall,
                                            color = Color(0xFF15803D)
                                        )
                                    }
                                }

                                Spacer(modifier = Modifier.height(10.dp))

                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.End
                                ) {
                                    OutlinedButton(
                                        onClick = { openSamsungSettings() },
                                        shape = RoundedCornerShape(8.dp),
                                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp)
                                    ) {
                                        Text(
                                            text = "Telefon sozlamalari",
                                            fontSize = 12.sp,
                                            fontWeight = FontWeight.Medium
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // Action Buttons
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Button(
                        onClick = { forceSync() },
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(10.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = PrimaryBlue)
                    ) {
                        Icon(Icons.Default.CloudSync, contentDescription = null)
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(s.syncNowBtn)
                    }

                    OutlinedButton(
                        onClick = { testRingingWebhook() },
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Icon(Icons.Default.Refresh, contentDescription = null)
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Test Ringing")
                    }
                }
            }

            // Recent Calls Header
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = s.recentCallsTitle,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    TextButton(onClick = onNavigateToCalls) {
                        Text(
                            text = "Barchasi >",
                            style = MaterialTheme.typography.labelMedium,
                            color = PrimaryBlue
                        )
                    }
                }
            }

            // Calls List Items
            if (recentCalls.isEmpty()) {
                item {
                    Text(
                        text = s.noCallsTitle,
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f),
                        modifier = Modifier.padding(vertical = 16.dp)
                    )
                }
            } else {
                items(recentCalls) { call ->
                    CallRecordItem(call, isDualSim, prefs.baseUrl, prefs.deviceToken)
                }
            }
        }

        if (showEditPhoneDialog) {
            AlertDialog(
                onDismissRequest = { showEditPhoneDialog = false },
                title = { Text(s.editPhoneDialogTitle) },
                text = {
                    Column(modifier = Modifier.fillMaxWidth()) {
                        Text(
                            text = "Qo'ng'iroqlar jurnalida qaysi operator raqamidan gaplashilganini ko'rsatish uchun telefon raqamingizni kiriting:",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                        OutlinedTextField(
                            value = inputPhoneNumber,
                            onValueChange = { inputPhoneNumber = it },
                            label = { Text("Telefon raqam") },
                            placeholder = { Text("+998901234567") },
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                },
                confirmButton = {
                    Button(
                        onClick = {
                            val cleaned = inputPhoneNumber.trim()
                            prefs.sim1PhoneNumber = cleaned
                            showEditPhoneDialog = false
                            HeartbeatWorker.enqueueImmediate(context)
                            Toast.makeText(context, "Operator raqami saqlandi va serverga yuborildi", Toast.LENGTH_SHORT).show()
                        }
                    ) {
                        Text(s.save)
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showEditPhoneDialog = false }) {
                        Text(s.cancel)
                    }
                }
            )
        }
    }
}

@Composable
fun CallRecordItem(
    call: LocalCallRecord,
    isDualSim: Boolean = false,
    baseUrl: String = "https://agent.1call.uz",
    token: String? = null
) {
    val context = LocalContext.current
    val isIncoming = call.direction.equals("INCOMING", ignoreCase = true)
    val timeFormat = SimpleDateFormat("HH:mm, dd MMM", Locale.getDefault())
    val formattedTime = timeFormat.format(Date(call.startedAt * 1000))
    val minutes = call.durationSeconds / 60
    val seconds = call.durationSeconds % 60
    val formattedDuration = String.format("%02d:%02d", minutes, seconds)

    val playingCallId by AudioPlayerManager.playingCallId.collectAsState()
    val isPlaying by AudioPlayerManager.isPlaying.collectAsState()
    val currentPosMs by AudioPlayerManager.currentPositionMs.collectAsState()
    val durationMs by AudioPlayerManager.durationMs.collectAsState()
    val isLoading by AudioPlayerManager.isLoading.collectAsState()

    val isCurrent = playingCallId == call.id
    val hasAudio = !call.audioFilePath.isNullOrEmpty() || !call.remoteCallId.isNullOrEmpty()

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(10.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = if (isIncoming) Icons.Default.CallReceived else Icons.Default.CallMade,
                    contentDescription = null,
                    tint = if (isIncoming) PrimaryBlue else Color(0xFF8B5CF6),
                    modifier = Modifier.size(24.dp)
                )
                Spacer(modifier = Modifier.width(12.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = call.phoneNumber,
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 15.sp
                    )
                    val simLabel = if (isDualSim) " • SIM ${if (call.simSlot == 2) 2 else 1}" else ""
                    Text(
                        text = "$formattedTime • $formattedDuration$simLabel",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                    )
                }
                Spacer(modifier = Modifier.width(8.dp))

                // Play / Pause Button for audio
                if (hasAudio) {
                    if (isCurrent && isLoading) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(26.dp).padding(3.dp),
                            strokeWidth = 2.5.dp,
                            color = PrimaryBlue
                        )
                    } else {
                        IconButton(
                            onClick = {
                                AudioPlayerManager.playOrToggle(context, call, baseUrl, token)
                            },
                            modifier = Modifier
                                .size(34.dp)
                                .background(
                                    color = if (isCurrent && isPlaying) PrimaryBlue else PrimaryBlue.copy(alpha = 0.12f),
                                    shape = CircleShape
                                )
                        ) {
                            Icon(
                                imageVector = if (isCurrent && isPlaying) Icons.Default.Pause else Icons.Default.PlayArrow,
                                contentDescription = "Audio tinglash",
                                tint = if (isCurrent && isPlaying) Color.White else PrimaryBlue,
                                modifier = Modifier.size(18.dp)
                            )
                        }
                    }
                    Spacer(modifier = Modifier.width(6.dp))
                }

                when (call.syncStatus) {
                    LocalCallRecord.STATUS_SYNCED -> {
                        Icon(
                            imageVector = Icons.Default.CloudDone,
                            contentDescription = "Yuklangan",
                            tint = AccentGreen,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                    LocalCallRecord.STATUS_UPLOADING -> {
                        Icon(
                            imageVector = Icons.Default.CloudSync,
                            contentDescription = "Yuklanmoqda",
                            tint = PrimaryBlue,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                    else -> {
                        Text(
                            text = "Kutilmoqda",
                            fontSize = 11.sp,
                            color = Color(0xFFF59E0B),
                            fontWeight = FontWeight.Medium
                        )
                    }
                }
            }

            // Inline progress slider when active in player
            if (isCurrent) {
                Spacer(modifier = Modifier.height(8.dp))
                val totalMs = if (durationMs > 0) durationMs else maxOf(call.durationSeconds * 1000, 1000)

                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(
                            color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.45f),
                            shape = RoundedCornerShape(8.dp)
                        )
                        .padding(horizontal = 10.dp, vertical = 6.dp)
                ) {
                    Slider(
                        value = currentPosMs.toFloat().coerceIn(0f, totalMs.toFloat()),
                        onValueChange = { AudioPlayerManager.seekTo(it.toInt()) },
                        valueRange = 0f..totalMs.toFloat(),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(20.dp),
                        colors = SliderDefaults.colors(
                            thumbColor = PrimaryBlue,
                            activeTrackColor = PrimaryBlue,
                            inactiveTrackColor = PrimaryBlue.copy(alpha = 0.25f)
                        )
                    )
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(
                            text = formatTimeMs(currentPosMs),
                            fontSize = 10.sp,
                            fontFamily = FontFamily.Monospace,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                        )
                        Text(
                            text = formatTimeMs(totalMs),
                            fontSize = 10.sp,
                            fontFamily = FontFamily.Monospace,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                        )
                    }
                }
            }
        }
    }
}

private fun formatTimeMs(ms: Int): String {
    val totalSecs = Math.max(0, ms / 1000)
    val minutes = totalSecs / 60
    val seconds = totalSecs % 60
    return String.format("%02d:%02d", minutes, seconds)
}
