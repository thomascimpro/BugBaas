package nl.cimpro.bugbaas

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.view.View
import android.widget.RemoteViews

class BugBuddyWidgetProvider : AppWidgetProvider() {
  override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
    for (appWidgetId in appWidgetIds) updateWidget(context, appWidgetManager, appWidgetId)
  }

  private fun updateWidget(context: Context, manager: AppWidgetManager, widgetId: Int) {
    val prefs = context.getSharedPreferences(prefsName, Context.MODE_PRIVATE)
    val bugName = prefs.getString(prefBugName, "Open je Buddy Hub") ?: "Open je Buddy Hub"
    val status = prefs.getString(prefStatus, "Buddy Hub: doe je dagmissie") ?: "Buddy Hub: doe je dagmissie"
    val xp = prefs.getInt(prefXp, 0).coerceIn(0, dailyXpCap)
    val readyCount = prefs.getInt(prefReadyCount, 0).coerceAtLeast(0)
    val actionLabel = prefs.getString(prefActionLabel, "") ?: ""
    val taskProgress = prefs.getInt(prefTaskProgress, 0).coerceIn(0, 100)
    val taskRemaining = prefs.getString(prefTaskRemaining, "") ?: ""
    val widgetState = prefs.getString(prefWidgetState, "resting") ?: "resting"
    val updatedAt = prefs.getString(prefUpdatedAt, "") ?: ""
    val progress = if (actionLabel.isNotBlank()) (100 - taskProgress).coerceIn(0, 100) else 100

    val views = RemoteViews(context.packageName, R.layout.bug_buddy_widget)
    views.setTextViewText(R.id.buddyWidgetTitle, if (actionLabel.isNotBlank()) "ACTIEF" else "BUDDY")
    views.setTextViewText(R.id.buddyWidgetName, if (actionLabel.isNotBlank()) actionLabel else bugName)
    views.setTextViewText(R.id.buddyWidgetStatus, if (actionLabel.isNotBlank()) "$taskRemaining over" else status)
    views.setTextViewText(R.id.buddyWidgetXp, if (actionLabel.isNotBlank()) "$taskProgress%" else "$xp/$dailyXpCap XP")
    views.setTextViewText(R.id.buddyWidgetReady, if (actionLabel.isNotBlank()) "bezig" else if (readyCount > 0) "$readyCount klaar" else "rust")
    views.setTextViewText(R.id.buddyWidgetUpdated, updatedAt)
    views.setProgressBar(R.id.buddyWidgetProgress, 100, progress, false)
    views.setImageViewResource(R.id.buddyWidgetImage, buddyFrameResource(widgetState, taskProgress))
    views.setContentDescription(R.id.buddyWidgetImage, "$bugName. $status")
    views.setViewVisibility(R.id.buddyWidgetPerfect, if (xp >= dailyXpCap) View.VISIBLE else View.GONE)

    val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE else PendingIntent.FLAG_UPDATE_CURRENT
    val intent = Intent(context, MainActivity::class.java).apply {
      action = Intent.ACTION_VIEW
      data = Uri.parse("bugbaas://radar?screen=buddy")
      this.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
    }
    views.setOnClickPendingIntent(R.id.buddyWidgetRoot, PendingIntent.getActivity(context, widgetId + 8700, intent, flags))
    manager.updateAppWidget(widgetId, views)
  }

  private fun buddyFrameResource(widgetState: String, taskProgress: Int): Int {
    return when (widgetState) {
      "expedition" -> when {
        taskProgress < 34 -> R.drawable.buddy_bee_widget_hunt_1
        taskProgress < 67 -> R.drawable.buddy_bee_widget_hunt_2
        else -> R.drawable.buddy_bee_widget_hunt_3
      }
      "reward_ready" -> R.drawable.buddy_bee_widget_reward
      "available" -> R.drawable.buddy_bee_widget_3d
      else -> R.drawable.buddy_bee_widget_sleep
    }
  }

  companion object {
    private const val prefsName = "bug_buddy_widget"
    private const val prefBugName = "bugName"
    private const val prefStatus = "status"
    private const val prefXp = "xp"
    private const val prefReadyCount = "readyCount"
    private const val prefActionLabel = "actionLabel"
    private const val prefTaskProgress = "taskProgress"
    private const val prefTaskRemaining = "taskRemaining"
    private const val prefWidgetState = "widgetState"
    private const val prefUpdatedAt = "updatedAt"
    private const val dailyXpCap = 180

    fun setBuddyState(context: Context, bugName: String, status: String, xp: Int, readyCount: Int, actionLabel: String, taskProgress: Int, taskRemaining: String, widgetState: String) {
      context.getSharedPreferences(prefsName, Context.MODE_PRIVATE)
        .edit()
        .putString(prefBugName, bugName)
        .putString(prefStatus, status)
        .putInt(prefXp, xp.coerceIn(0, dailyXpCap))
        .putInt(prefReadyCount, readyCount.coerceAtLeast(0))
        .putString(prefActionLabel, actionLabel)
        .putInt(prefTaskProgress, taskProgress.coerceIn(0, 100))
        .putString(prefTaskRemaining, taskRemaining)
        .putString(prefWidgetState, widgetState)
        .putString(prefUpdatedAt, if (actionLabel.isNotBlank()) "idle timer" else "Updated now")
        .apply()
      updateAll(context)
    }

    fun updateAll(context: Context) {
      val manager = AppWidgetManager.getInstance(context)
      val ids = manager.getAppWidgetIds(ComponentName(context, BugBuddyWidgetProvider::class.java))
      val provider = BugBuddyWidgetProvider()
      for (id in ids) provider.updateWidget(context, manager, id)
    }
  }
}
