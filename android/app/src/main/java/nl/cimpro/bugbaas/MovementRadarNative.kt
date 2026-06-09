package nl.cimpro.bugbaas

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.DistanceRecord
import androidx.health.connect.client.records.ExerciseSessionRecord
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.request.AggregateRequest
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Calendar
import kotlin.math.max

data class MovementGoalSnapshot(
  val earned: Int,
  val id: String,
  val km: Double,
  val label: String,
  val targetKm: Double
)

data class MovementDataTypeSnapshot(
  val available: Boolean,
  val id: String,
  val label: String,
  val lastSeenAt: Double? = null,
  val lastSeenLabel: String? = null,
  val reason: String? = null
)

data class MovementProgressSnapshot(
  val available: Boolean,
  val awardedToday: Int,
  val claimableRewards: Int,
  val dataTypes: List<MovementDataTypeSnapshot>,
  val goals: List<MovementGoalSnapshot>,
  val maxRewards: Int,
  val reason: String? = null
)

data class MovementClaimSnapshot(
  val awarded: Int,
  val bugIds: List<String>,
  val estimatedKm: Double,
  val reason: String? = null
)

object MovementRadarNative {
  private const val actionMovementCheck = "nl.cimpro.bugbaas.action.MOVEMENT_RADAR_CHECK"
  private const val estimatedMetersPerStep = 0.75
  private const val walkingMetersPerRadarBug = 2500.0
  private const val runningMetersPerRadarBug = 4000.0
  private const val cyclingMetersPerRadarBug = 6000.0
  private const val maxMovementRadarBugsPerDay = 5
  private const val movementCheckMinutes = 60
  private const val movementRequestCode = 4343
  private const val prefsName = "movement_radar_native"
  private const val prefAwardedUnits = "awarded_units"
  private const val prefDay = "day"

  fun schedulePeriodicCheck(context: Context) {
    val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
    val intent = Intent(context, BugRadarWidgetProvider::class.java).apply { action = actionMovementCheck }
    val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    } else {
      PendingIntent.FLAG_UPDATE_CURRENT
    }
    val pendingIntent = PendingIntent.getBroadcast(context, movementRequestCode, intent, flags)
    val triggerAt = System.currentTimeMillis() + movementCheckMinutes * 60_000L
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, pendingIntent)
    } else {
      alarmManager.set(AlarmManager.RTC_WAKEUP, triggerAt, pendingIntent)
    }
  }

  suspend fun claimAvailable(context: Context, movementBoost: Double = 0.0): MovementClaimSnapshot {
    val snapshot = readHealthConnectSnapshot(context)
    if (!snapshot.available) return MovementClaimSnapshot(0, emptyList(), 0.0, snapshot.reason)

    val today = localDayId()
    val prefs = context.getSharedPreferences(prefsName, Context.MODE_PRIVATE)
    val awardedToday = if (prefs.getString(prefDay, "") == today) prefs.getInt(prefAwardedUnits, 0) else 0
    val targets = boostedTargets(movementBoost)
    val earnedToday = earnedUnits(snapshot, targets)
    val claimable = maxOf(0, minOf(maxMovementRadarBugsPerDay, earnedToday) - awardedToday)
    if (claimable <= 0) return MovementClaimSnapshot(0, emptyList(), snapshot.estimatedKm)

    val bugIds = BugRadarWidgetProvider.pickRandomRadarBugIds(claimable)
    val added = BugRadarWidgetProvider.enqueueRadarBugs(context, bugIds)
    if (added > 0) {
      prefs.edit()
        .putString(prefDay, today)
        .putInt(prefAwardedUnits, minOf(maxMovementRadarBugsPerDay, awardedToday + added))
        .apply()
    }
    return MovementClaimSnapshot(added, bugIds.take(added), snapshot.estimatedKm)
  }

  suspend fun progress(context: Context, movementBoost: Double = 0.0): MovementProgressSnapshot {
    val snapshot = readHealthConnectSnapshot(context)
    if (!snapshot.available) return emptyProgress(snapshot.reason ?: "health_error", snapshot.dataTypes)

    val targets = boostedTargets(movementBoost)
    val today = localDayId()
    val prefs = context.getSharedPreferences(prefsName, Context.MODE_PRIVATE)
    val awardedToday = if (prefs.getString(prefDay, "") == today) prefs.getInt(prefAwardedUnits, 0) else 0
    val earnedToday = earnedUnits(snapshot, targets)
    val claimable = maxOf(0, minOf(maxMovementRadarBugsPerDay, earnedToday) - awardedToday)
    return MovementProgressSnapshot(
      available = true,
      awardedToday = awardedToday,
      claimableRewards = claimable,
      dataTypes = snapshot.dataTypes,
      goals = listOf(
        makeGoal("walking", "Lopen", snapshot.walkingMeters, targets.walking),
        makeGoal("running", "Hardlopen", snapshot.runningMeters, targets.running),
        makeGoal("cycling", "Fietsen", snapshot.cyclingMeters, targets.cycling)
      ),
      maxRewards = maxMovementRadarBugsPerDay
    )
  }

  fun isMovementAction(action: String?): Boolean = action == actionMovementCheck

  private suspend fun readHealthConnectSnapshot(context: Context): ExerciseSnapshot {
    val status = HealthConnectClient.getSdkStatus(context)
    if (status != HealthConnectClient.SDK_AVAILABLE) {
      return ExerciseSnapshot(false, dataTypes = unavailableDataTypes("health_connect_unavailable"), reason = "health_connect_unavailable")
    }

    return try {
      val client = HealthConnectClient.getOrCreate(context)
      val granted = client.permissionController.getGrantedPermissions()
      val canReadSteps = granted.contains(HealthPermission.getReadPermission(StepsRecord::class))
      val canReadDistance = granted.contains(HealthPermission.getReadPermission(DistanceRecord::class))
      val canReadExercise = granted.contains(HealthPermission.getReadPermission(ExerciseSessionRecord::class))
      val dataTypes = buildDataTypeStatuses(client, canReadSteps, canReadDistance, canReadExercise)
      if (!canReadSteps && !canReadDistance && !canReadExercise) {
        return ExerciseSnapshot(false, dataTypes = dataTypes, reason = "health_permission")
      }

      val zone = ZoneId.systemDefault()
      val start = LocalDate.now(zone).atStartOfDay(zone).toInstant()
      val end = Instant.now()
      val sessions = if (canReadExercise) readMovementSessions(client, start, end) else emptyList()

      var walkingMeters = 0.0
      var runningMeters = 0.0
      var cyclingMeters = 0.0
      for (session in nonOverlappingSessions(sessions)) {
        val distanceMeters = if (canReadDistance) aggregateDistanceMeters(client, session.start, session.end) else 0.0
        val walkingStepMeters = if (canReadSteps && session.bucket == "walking") {
          aggregateSteps(client, session.start, session.end) * estimatedMetersPerStep
        } else {
          0.0
        }
        when (session.bucket) {
          "walking" -> walkingMeters += max(distanceMeters, walkingStepMeters)
          "running" -> runningMeters += distanceMeters
          "cycling" -> cyclingMeters += distanceMeters
        }
      }

      if (canReadSteps) {
        val gaps = gapsOutsideSessions(start, end, sessions)
        val gapSteps = gaps.sumOf { aggregateSteps(client, it.start, it.end) }
        walkingMeters += gapSteps * estimatedMetersPerStep
      }

      ExerciseSnapshot(true, walkingMeters, runningMeters, cyclingMeters, dataTypes)
    } catch (_: Exception) {
      ExerciseSnapshot(false, dataTypes = unavailableDataTypes("health_error"), reason = "health_error")
    }
  }

  private suspend fun readMovementSessions(client: HealthConnectClient, start: Instant, end: Instant): List<MovementSession> {
    return client.readRecords(
      ReadRecordsRequest(
        recordType = ExerciseSessionRecord::class,
        timeRangeFilter = TimeRangeFilter.between(start, end)
      )
    ).records
      .mapNotNull { session ->
        val bucket = exerciseBucket(session.exerciseType) ?: return@mapNotNull null
        val clippedStart = maxInstant(start, session.startTime)
        val clippedEnd = minInstant(end, session.endTime)
        if (!clippedEnd.isAfter(clippedStart)) null else MovementSession(bucket, clippedStart, clippedEnd)
      }
      .sortedBy { it.start }
  }

  private suspend fun aggregateSteps(client: HealthConnectClient, start: Instant, end: Instant): Long {
    if (!end.isAfter(start)) return 0
    val response = client.aggregate(
      AggregateRequest(
        metrics = setOf(StepsRecord.COUNT_TOTAL),
        timeRangeFilter = TimeRangeFilter.between(start, end)
      )
    )
    return response[StepsRecord.COUNT_TOTAL] ?: 0L
  }

  private suspend fun aggregateDistanceMeters(client: HealthConnectClient, start: Instant, end: Instant): Double {
    if (!end.isAfter(start)) return 0.0
    val response = client.aggregate(
      AggregateRequest(
        metrics = setOf(DistanceRecord.DISTANCE_TOTAL),
        timeRangeFilter = TimeRangeFilter.between(start, end)
      )
    )
    return response[DistanceRecord.DISTANCE_TOTAL]?.inMeters ?: 0.0
  }

  private suspend fun buildDataTypeStatuses(
    client: HealthConnectClient,
    canReadSteps: Boolean,
    canReadDistance: Boolean,
    canReadExercise: Boolean
  ): List<MovementDataTypeSnapshot> {
    val zone = ZoneId.systemDefault()
    val end = Instant.now()
    val start = LocalDate.now(zone).minusDays(30).atStartOfDay(zone).toInstant()
    return listOf(
      dataTypeStatus("steps", "Stappen", canReadSteps, latestStepsAt(client, start, end)),
      dataTypeStatus("distance", "Afstand", canReadDistance, latestDistanceAt(client, start, end)),
      dataTypeStatus("exercise", "Trainingen", canReadExercise, latestExerciseAt(client, start, end))
    )
  }

  private fun dataTypeStatus(id: String, label: String, hasPermission: Boolean, latest: Instant?): MovementDataTypeSnapshot {
    if (!hasPermission) return MovementDataTypeSnapshot(false, id, label, reason = "health_permission")
    if (latest == null) return MovementDataTypeSnapshot(false, id, label, reason = "no_data")
    return MovementDataTypeSnapshot(
      available = true,
      id = id,
      label = label,
      lastSeenAt = latest.toEpochMilli().toDouble(),
      lastSeenLabel = formatLastSeen(latest)
    )
  }

  private suspend fun latestStepsAt(client: HealthConnectClient, start: Instant, end: Instant): Instant? {
    return client.readRecords(
      ReadRecordsRequest(
        recordType = StepsRecord::class,
        timeRangeFilter = TimeRangeFilter.between(start, end),
        ascendingOrder = false,
        pageSize = 1
      )
    ).records.firstOrNull()?.endTime
  }

  private suspend fun latestDistanceAt(client: HealthConnectClient, start: Instant, end: Instant): Instant? {
    return client.readRecords(
      ReadRecordsRequest(
        recordType = DistanceRecord::class,
        timeRangeFilter = TimeRangeFilter.between(start, end),
        ascendingOrder = false,
        pageSize = 1
      )
    ).records.firstOrNull()?.endTime
  }

  private suspend fun latestExerciseAt(client: HealthConnectClient, start: Instant, end: Instant): Instant? {
    return client.readRecords(
      ReadRecordsRequest(
        recordType = ExerciseSessionRecord::class,
        timeRangeFilter = TimeRangeFilter.between(start, end),
        ascendingOrder = false,
        pageSize = 1
      )
    ).records.firstOrNull()?.endTime
  }

  private fun nonOverlappingSessions(sessions: List<MovementSession>): List<MovementSession> {
    val result = mutableListOf<MovementSession>()
    var cursor: Instant? = null
    for (session in sessions.sortedBy { it.start }) {
      val start = cursor?.let { maxInstant(it, session.start) } ?: session.start
      if (session.end.isAfter(start)) {
        result.add(MovementSession(session.bucket, start, session.end))
        cursor = session.end
      }
    }
    return result
  }

  private fun gapsOutsideSessions(start: Instant, end: Instant, sessions: List<MovementSession>): List<TimeWindow> {
    val gaps = mutableListOf<TimeWindow>()
    var cursor = start
    for (session in nonOverlappingSessions(sessions)) {
      if (session.start.isAfter(cursor)) gaps.add(TimeWindow(cursor, session.start))
      if (session.end.isAfter(cursor)) cursor = session.end
    }
    if (end.isAfter(cursor)) gaps.add(TimeWindow(cursor, end))
    return gaps
  }

  private fun earnedUnits(snapshot: ExerciseSnapshot, targets: MovementTargets): Int {
    val walking = (snapshot.walkingMeters / targets.walking).toInt()
    val running = (snapshot.runningMeters / targets.running).toInt()
    val cycling = (snapshot.cyclingMeters / targets.cycling).toInt()
    return minOf(maxMovementRadarBugsPerDay, walking + running + cycling)
  }

  private fun boostedTargets(movementBoost: Double): MovementTargets {
    val boost = movementBoost.coerceIn(0.0, 1.0)
    val multiplier = 1.0 + boost
    return MovementTargets(
      walking = walkingMetersPerRadarBug / multiplier,
      running = runningMetersPerRadarBug / multiplier,
      cycling = cyclingMetersPerRadarBug / multiplier
    )
  }

  private fun makeGoal(id: String, label: String, meters: Double, targetMeters: Double): MovementGoalSnapshot {
    val earned = (meters / targetMeters).toInt()
    val displayMeters = if (earned >= maxMovementRadarBugsPerDay) targetMeters else meters % targetMeters
    return MovementGoalSnapshot(
      earned = earned,
      id = id,
      km = maxOf(0.0, displayMeters) / 1000.0,
      label = label,
      targetKm = targetMeters / 1000.0
    )
  }

  private fun emptyProgress(reason: String, dataTypes: List<MovementDataTypeSnapshot> = unavailableDataTypes(reason)): MovementProgressSnapshot {
    return MovementProgressSnapshot(
      available = false,
      awardedToday = 0,
      claimableRewards = 0,
      dataTypes = dataTypes,
      goals = listOf(
        makeGoal("walking", "Lopen", 0.0, walkingMetersPerRadarBug),
        makeGoal("running", "Hardlopen", 0.0, runningMetersPerRadarBug),
        makeGoal("cycling", "Fietsen", 0.0, cyclingMetersPerRadarBug)
      ),
      maxRewards = maxMovementRadarBugsPerDay,
      reason = reason
    )
  }

  private fun unavailableDataTypes(reason: String): List<MovementDataTypeSnapshot> {
    return listOf(
      MovementDataTypeSnapshot(false, "steps", "Stappen", reason = reason),
      MovementDataTypeSnapshot(false, "distance", "Afstand", reason = reason),
      MovementDataTypeSnapshot(false, "exercise", "Trainingen", reason = reason)
    )
  }

  private fun exerciseBucket(type: Int): String? {
    return when (type) {
      ExerciseSessionRecord.EXERCISE_TYPE_WALKING,
      ExerciseSessionRecord.EXERCISE_TYPE_HIKING -> "walking"
      ExerciseSessionRecord.EXERCISE_TYPE_RUNNING,
      ExerciseSessionRecord.EXERCISE_TYPE_RUNNING_TREADMILL -> "running"
      ExerciseSessionRecord.EXERCISE_TYPE_BIKING,
      ExerciseSessionRecord.EXERCISE_TYPE_BIKING_STATIONARY -> "cycling"
      else -> null
    }
  }

  private fun healthPermissions(): Set<String> {
    return setOf(
      HealthPermission.getReadPermission(DistanceRecord::class),
      HealthPermission.getReadPermission(ExerciseSessionRecord::class),
      HealthPermission.PERMISSION_READ_HEALTH_DATA_IN_BACKGROUND,
      HealthPermission.getReadPermission(StepsRecord::class)
    )
  }

  private fun formatLastSeen(instant: Instant): String {
    val zone = ZoneId.systemDefault()
    val date = instant.atZone(zone).toLocalDate()
    val today = LocalDate.now(zone)
    return when (date) {
      today -> "vandaag"
      today.minusDays(1) -> "gisteren"
      else -> date.format(DateTimeFormatter.ofPattern("dd-MM"))
    }
  }

  private fun localDayId(): String {
    val calendar = Calendar.getInstance()
    return "${calendar.get(Calendar.YEAR)}-${calendar.get(Calendar.DAY_OF_YEAR)}"
  }

  private fun maxInstant(first: Instant, second: Instant): Instant = if (first.isAfter(second)) first else second

  private fun minInstant(first: Instant, second: Instant): Instant = if (first.isBefore(second)) first else second

  private data class MovementTargets(
    val walking: Double,
    val running: Double,
    val cycling: Double
  )

  private data class ExerciseSnapshot(
    val available: Boolean,
    val walkingMeters: Double = 0.0,
    val runningMeters: Double = 0.0,
    val cyclingMeters: Double = 0.0,
    val dataTypes: List<MovementDataTypeSnapshot> = emptyList(),
    val reason: String? = null
  ) {
    val estimatedKm: Double
      get() = (walkingMeters + runningMeters + cyclingMeters) / 1000.0
  }

  private data class MovementSession(
    val bucket: String,
    val start: Instant,
    val end: Instant
  )

  private data class TimeWindow(
    val start: Instant,
    val end: Instant
  )
}
