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
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.util.Calendar

data class MovementGoalSnapshot(
  val earned: Int,
  val id: String,
  val km: Double,
  val label: String,
  val targetKm: Double
)

data class MovementProgressSnapshot(
  val available: Boolean,
  val awardedToday: Int,
  val claimableRewards: Int,
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
  private const val walkingMetersPerRadarBug = 3000.0
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

  suspend fun claimAvailable(context: Context): MovementClaimSnapshot {
    val snapshot = readExerciseSnapshot(context)
    if (!snapshot.available) return MovementClaimSnapshot(0, emptyList(), 0.0, snapshot.reason)

    val today = localDayId()
    val prefs = context.getSharedPreferences(prefsName, Context.MODE_PRIVATE)
    val awardedToday = if (prefs.getString(prefDay, "") == today) prefs.getInt(prefAwardedUnits, 0) else 0
    val earnedToday = earnedUnits(snapshot)
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

  suspend fun progress(context: Context): MovementProgressSnapshot {
    val snapshot = readExerciseSnapshot(context)
    if (!snapshot.available) return emptyProgress(snapshot.reason ?: "health_error")

    val today = localDayId()
    val prefs = context.getSharedPreferences(prefsName, Context.MODE_PRIVATE)
    val awardedToday = if (prefs.getString(prefDay, "") == today) prefs.getInt(prefAwardedUnits, 0) else 0
    val earnedToday = earnedUnits(snapshot)
    val claimable = maxOf(0, minOf(maxMovementRadarBugsPerDay, earnedToday) - awardedToday)
    return MovementProgressSnapshot(
      available = true,
      awardedToday = awardedToday,
      claimableRewards = claimable,
      goals = listOf(
        makeGoal("walking", "Lopen", snapshot.walkingMeters, walkingMetersPerRadarBug),
        makeGoal("running", "Hardlopen", snapshot.runningMeters, runningMetersPerRadarBug),
        makeGoal("cycling", "Fietsen", snapshot.cyclingMeters, cyclingMetersPerRadarBug)
      ),
      maxRewards = maxMovementRadarBugsPerDay
    )
  }

  fun isMovementAction(action: String?): Boolean = action == actionMovementCheck

  private suspend fun readExerciseSnapshot(context: Context): ExerciseSnapshot {
    val status = HealthConnectClient.getSdkStatus(context)
    if (status != HealthConnectClient.SDK_AVAILABLE) return ExerciseSnapshot(false, reason = "health_connect_unavailable")

    return try {
      val client = HealthConnectClient.getOrCreate(context)
      val permissions = healthPermissions()
      val granted = client.permissionController.getGrantedPermissions()
      if (!granted.containsAll(permissions)) return ExerciseSnapshot(false, reason = "health_permission")

      val zone = ZoneId.systemDefault()
      val start = LocalDate.now(zone).atStartOfDay(zone).toInstant()
      val end = Instant.now()
      val sessions = client.readRecords(
        ReadRecordsRequest(
          recordType = ExerciseSessionRecord::class,
          timeRangeFilter = TimeRangeFilter.between(start, end)
        )
      ).records

      var walkingMeters = 0.0
      var runningMeters = 0.0
      var cyclingMeters = 0.0
      for (session in sessions) {
        val bucket = exerciseBucket(session.exerciseType) ?: continue
        val distance = distanceMetersForSession(client, session.startTime, session.endTime)
        when (bucket) {
          "walking" -> walkingMeters += distance
          "running" -> runningMeters += distance
          "cycling" -> cyclingMeters += distance
        }
      }
      walkingMeters = maxOf(walkingMeters, stepMetersForRange(client, start, end))
      ExerciseSnapshot(true, walkingMeters, runningMeters, cyclingMeters)
    } catch (_: Exception) {
      ExerciseSnapshot(false, reason = "health_error")
    }
  }

  private suspend fun distanceMetersForSession(client: HealthConnectClient, start: Instant, end: Instant): Double {
    return client.readRecords(
      ReadRecordsRequest(
        recordType = DistanceRecord::class,
        timeRangeFilter = TimeRangeFilter.between(start, end)
      )
    ).records.sumOf { it.distance.inMeters }
  }

  private suspend fun stepMetersForRange(client: HealthConnectClient, start: Instant, end: Instant): Double {
    val steps = client.readRecords(
      ReadRecordsRequest(
        recordType = StepsRecord::class,
        timeRangeFilter = TimeRangeFilter.between(start, end)
      )
    ).records.sumOf { it.count }
    return steps * estimatedMetersPerStep
  }

  private fun earnedUnits(snapshot: ExerciseSnapshot): Int {
    val walking = (snapshot.walkingMeters / walkingMetersPerRadarBug).toInt()
    val running = (snapshot.runningMeters / runningMetersPerRadarBug).toInt()
    val cycling = (snapshot.cyclingMeters / cyclingMetersPerRadarBug).toInt()
    return minOf(maxMovementRadarBugsPerDay, walking + running + cycling)
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

  private fun emptyProgress(reason: String): MovementProgressSnapshot {
    return MovementProgressSnapshot(
      available = false,
      awardedToday = 0,
      claimableRewards = 0,
      goals = listOf(
        makeGoal("walking", "Lopen", 0.0, walkingMetersPerRadarBug),
        makeGoal("running", "Hardlopen", 0.0, runningMetersPerRadarBug),
        makeGoal("cycling", "Fietsen", 0.0, cyclingMetersPerRadarBug)
      ),
      maxRewards = maxMovementRadarBugsPerDay,
      reason = reason
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

  private fun localDayId(): String {
    val calendar = Calendar.getInstance()
    return "${calendar.get(Calendar.YEAR)}-${calendar.get(Calendar.DAY_OF_YEAR)}"
  }

  private data class ExerciseSnapshot(
    val available: Boolean,
    val walkingMeters: Double = 0.0,
    val runningMeters: Double = 0.0,
    val cyclingMeters: Double = 0.0,
    val reason: String? = null
  ) {
    val estimatedKm: Double
      get() = (walkingMeters + runningMeters + cyclingMeters) / 1000.0
  }
}
