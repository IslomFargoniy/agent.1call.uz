package uz.onecall.agent.ui.screens.calls

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
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Clear
import androidx.compose.material.icons.filled.CloudSync
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.work.Constraints
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import uz.onecall.agent.OneCallApplication
import uz.onecall.agent.core.AudioPlayerManager
import uz.onecall.agent.core.SimHelper
import uz.onecall.agent.core.appStrings
import uz.onecall.agent.data.local.LocalCallRecord
import uz.onecall.agent.ui.screens.home.CallRecordItem
import uz.onecall.agent.ui.theme.PrimaryBlue
import uz.onecall.agent.workers.CallSyncWorker

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CallsScreen() {
    val context = LocalContext.current
    val s = appStrings()
    val app = OneCallApplication.instance
    val prefs = app.preferences
    val dao = app.database.callDao()

    DisposableEffect(Unit) {
        onDispose {
            AudioPlayerManager.stop()
        }
    }

    val allCalls by dao.getRecentCallsFlow().collectAsState(initial = emptyList())
    val activeSims = remember { SimHelper.getActiveSimCards(context) }
    val isDualSim = activeSims.size > 1

    var selectedFilter by remember { mutableStateOf("ALL") } // ALL, WITH_AUDIO, PENDING, INCOMING, OUTGOING
    var searchQuery by remember { mutableStateOf("") }
    var isSearchActive by remember { mutableStateOf(false) }

    fun forceSync() {
        val constraints = Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build()
        val syncWork = OneTimeWorkRequestBuilder<CallSyncWorker>()
            .setConstraints(constraints)
            .build()
        WorkManager.getInstance(context).enqueue(syncWork)
    }

    val filteredCalls = remember(allCalls, selectedFilter, searchQuery) {
        allCalls.filter { call ->
            val matchesFilter = when (selectedFilter) {
                "WITH_AUDIO" -> !call.audioFilePath.isNullOrEmpty() || !call.remoteCallId.isNullOrEmpty()
                "PENDING" -> call.syncStatus == LocalCallRecord.STATUS_PENDING || call.syncStatus == LocalCallRecord.STATUS_UPLOADING
                "INCOMING" -> call.direction.equals("INCOMING", ignoreCase = true)
                "OUTGOING" -> call.direction.equals("OUTGOING", ignoreCase = true)
                else -> true
            }
            val matchesSearch = if (searchQuery.isBlank()) {
                true
            } else {
                call.phoneNumber.contains(searchQuery.trim())
            }
            matchesFilter && matchesSearch
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = s.tabCalls,
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "${filteredCalls.size} ta qo'ng'iroq",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                        )
                    }
                },
                actions = {
                    IconButton(onClick = { isSearchActive = !isSearchActive }) {
                        Icon(
                            imageVector = Icons.Default.Search,
                            contentDescription = "Qidirish",
                            tint = if (isSearchActive) PrimaryBlue else MaterialTheme.colorScheme.onSurface
                        )
                    }
                    IconButton(onClick = { forceSync() }) {
                        Icon(
                            imageVector = Icons.Default.CloudSync,
                            contentDescription = s.syncNowBtn,
                            tint = PrimaryBlue
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            // Search Input (Collapsible)
            if (isSearchActive) {
                Box(modifier = Modifier.padding(horizontal = 16.dp, vertical = 6.dp)) {
                    OutlinedTextField(
                        value = searchQuery,
                        onValueChange = { searchQuery = it },
                        placeholder = { Text("Raqam bo'yicha qidirish...") },
                        leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
                        trailingIcon = {
                            if (searchQuery.isNotBlank()) {
                                IconButton(onClick = { searchQuery = "" }) {
                                    Icon(Icons.Default.Clear, contentDescription = "Tozalash")
                                }
                            }
                        },
                        singleLine = true,
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            }

            // Filter Chips
            LazyRow(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 6.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                item {
                    FilterChip(
                        selected = selectedFilter == "ALL",
                        onClick = { selectedFilter = "ALL" },
                        label = { Text("Barchasi") },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = PrimaryBlue.copy(alpha = 0.15f),
                            selectedLabelColor = PrimaryBlue
                        )
                    )
                }
                item {
                    FilterChip(
                        selected = selectedFilter == "WITH_AUDIO",
                        onClick = { selectedFilter = "WITH_AUDIO" },
                        label = { Text("Audio yozuvlar") },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = PrimaryBlue.copy(alpha = 0.15f),
                            selectedLabelColor = PrimaryBlue
                        )
                    )
                }
                item {
                    FilterChip(
                        selected = selectedFilter == "PENDING",
                        onClick = { selectedFilter = "PENDING" },
                        label = { Text("Kutilmoqda") },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = PrimaryBlue.copy(alpha = 0.15f),
                            selectedLabelColor = PrimaryBlue
                        )
                    )
                }
                item {
                    FilterChip(
                        selected = selectedFilter == "INCOMING",
                        onClick = { selectedFilter = "INCOMING" },
                        label = { Text("Kiruvchi") },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = PrimaryBlue.copy(alpha = 0.15f),
                            selectedLabelColor = PrimaryBlue
                        )
                    )
                }
                item {
                    FilterChip(
                        selected = selectedFilter == "OUTGOING",
                        onClick = { selectedFilter = "OUTGOING" },
                        label = { Text("Chiquvchi") },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = PrimaryBlue.copy(alpha = 0.15f),
                            selectedLabelColor = PrimaryBlue
                        )
                    )
                }
            }

            Spacer(modifier = Modifier.height(4.dp))

            // Calls List
            if (filteredCalls.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(32.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(
                            imageVector = Icons.Default.Phone,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.3f),
                            modifier = Modifier.size(56.dp)
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            text = if (searchQuery.isNotBlank()) "Qidiruv bo'yicha qo'ng'iroq topilmadi" else s.noCallsTitle,
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.SemiBold,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = if (searchQuery.isNotBlank()) "Boshqa raqam kiritib ko'ring" else s.noCallsDesc,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                        )
                    }
                }
            } else {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(horizontal = 16.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    items(filteredCalls, key = { it.id }) { call ->
                        CallRecordItem(
                            call = call,
                            isDualSim = isDualSim,
                            baseUrl = prefs.baseUrl,
                            token = prefs.deviceToken
                        )
                    }
                    item {
                        Spacer(modifier = Modifier.height(16.dp))
                    }
                }
            }
        }
    }
}
