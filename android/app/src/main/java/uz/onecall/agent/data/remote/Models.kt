package uz.onecall.agent.data.remote

import com.google.gson.annotations.SerializedName

data class PairRequest(
    @SerializedName("pair_code") val pairCode: String,
    @SerializedName("hardware_uid") val hardwareUid: String,
    @SerializedName("device_name") val deviceName: String,
    @SerializedName("phone_number") val phoneNumber: String? = null,
    @SerializedName("sim_operator") val simOperator: String? = null,
    @SerializedName("app_version") val appVersion: String = "1.0.0"
)

data class PairResponse(
    @SerializedName("token") val token: String,
    @SerializedName("device_id") val deviceId: String,
    @SerializedName("tenant_id") val tenantId: String? = null,
    @SerializedName("tenant_name") val tenantName: String? = null,
    @SerializedName("operator_name") val operatorName: String? = null,
    @SerializedName("message") val message: String? = null
)

data class RingingRequest(
    @SerializedName("phone_number") val phoneNumber: String,
    @SerializedName("direction") val direction: String = "INCOMING",
    @SerializedName("sim_slot") val simSlot: Int = 0,
    @SerializedName("timestamp") val timestamp: Long = System.currentTimeMillis() / 1000
)

data class HeartbeatRequest(
    @SerializedName("battery_level") val batteryLevel: Int,
    @SerializedName("is_charging") val isCharging: Boolean,
    @SerializedName("accessibility_service_enabled") val accessibilityEnabled: Boolean,
    @SerializedName("is_active") val isActive: Boolean = true
)

data class CommonResponse(
    @SerializedName("status") val status: String? = null,
    @SerializedName("message") val message: String? = null,
    @SerializedName("call_id") val callId: String? = null
)

data class AppVersionResponse(
    @SerializedName("version") val version: String,
    @SerializedName("version_code") val versionCode: Int,
    @SerializedName("download_url") val downloadUrl: String,
    @SerializedName("file_size") val fileSize: Long = 0,
    @SerializedName("changelog") val changelog: String? = null,
    @SerializedName("force_update") val forceUpdate: Boolean = false
)
