package uz.onecall.agent.data.remote

import okhttp3.MultipartBody
import okhttp3.RequestBody
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Multipart
import retrofit2.http.POST
import retrofit2.http.Part

interface AgentApiService {

    @POST("api/v1/devices/pair")
    suspend fun pairDevice(
        @Body request: PairRequest
    ): Response<PairResponse>

    @POST("api/v1/telemetry/heartbeat")
    suspend fun sendHeartbeat(
        @Body request: HeartbeatRequest
    ): Response<CommonResponse>

    @POST("api/v1/telemetry/ringing")
    suspend fun sendRingingNotification(
        @Body request: RingingRequest
    ): Response<CommonResponse>

    @Multipart
    @POST("api/v1/telemetry/calls")
    suspend fun uploadCall(
        @Part audio: MultipartBody.Part?,
        @Part("phone_number") phoneNumber: RequestBody,
        @Part("direction") direction: RequestBody,
        @Part("sim_slot") simSlot: RequestBody,
        @Part("duration_seconds") durationSeconds: RequestBody,
        @Part("started_at") startedAt: RequestBody,
        @Part("ended_at") endedAt: RequestBody
    ): Response<CommonResponse>

    @GET("api/v1/app/latest")
    suspend fun getLatestVersion(): Response<AppVersionResponse>
}
