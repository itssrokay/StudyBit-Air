package com.learningspace;
import android.app.AppOpsManager;import android.app.usage.*;import android.content.*;import android.content.pm.PackageManager;import android.os.Process;import org.json.*;import java.time.*;import java.util.*;
final class FocusUsage {
 static boolean granted(Context context){try{return context.getSystemService(AppOpsManager.class).checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS,Process.myUid(),context.getPackageName())==AppOpsManager.MODE_ALLOWED;}catch(Exception e){return false;}}
 static String report(Context context,String timezone)throws Exception{
  ZoneId zone=ZoneId.of(timezone);long now=System.currentTimeMillis();LocalDate today=Instant.ofEpochMilli(now).atZone(zone).toLocalDate();JSONArray days=new JSONArray();
  JSONObject out=new JSONObject().put("granted",granted(context)).put("timezone",timezone).put("capturedAt",Instant.ofEpochMilli(now).toString()).put("days",days);
  if(!granted(context))return out.toString();
  UsageStatsManager manager=context.getSystemService(UsageStatsManager.class);
  UsageEvents raw=manager.queryEvents(today.minusDays(7).atStartOfDay(zone).toInstant().toEpochMilli(),now);
  if(raw==null)throw new Exception("Unlock your phone to read available usage events.");
  List<UsageTimeline.Event> events=new ArrayList<>();UsageEvents.Event event=new UsageEvents.Event();
  while(raw.hasNextEvent()){raw.getNextEvent(event);int t=event.getEventType();if(t==UsageTimeline.SCREEN_ON||t==UsageTimeline.UNLOCKED||t==UsageTimeline.RESUMED||t==UsageTimeline.PAUSED||t==UsageTimeline.SCREEN_OFF||t==UsageTimeline.LOCKED||t==UsageTimeline.STOPPED||t==UsageTimeline.SHUTDOWN||t==UsageTimeline.STARTUP)events.add(new UsageTimeline.Event(event.getTimeStamp(),t,event.getPackageName(),event.getClassName()));if(events.size()>250000)throw new Exception("Android returned too many usage events. Try again later.");}
  Map<String,String> labels=new HashMap<>();PackageManager pm=context.getPackageManager();
  for(int i=6;i>=0;i--){LocalDate date=today.minusDays(i);long begin=date.atStartOfDay(zone).toInstant().toEpochMilli(),end=Math.min(now,date.plusDays(1).atStartOfDay(zone).toInstant().toEpochMilli());Map<String,Long> totals=UsageTimeline.durations(events,begin,end);List<String> apps=new ArrayList<>(totals.keySet());apps.sort((a,b)->Long.compare(totals.get(b),totals.get(a)));JSONArray rows=new JSONArray();long total=0;
   for(String app:apps){long millis=totals.get(app);if(millis<=0)continue;total+=millis;if(rows.length()>=300)continue;String label=labels.get(app);if(label==null){try{label=pm.getApplicationLabel(pm.getApplicationInfo(app,0)).toString();}catch(Exception e){label=app;}if(label.length()>250)label=label.substring(0,250);labels.put(app,label);}rows.put(new JSONObject().put("id",app).put("name",label).put("minutes",millis/60000.0));}
   UsageTimeline.Screen screen=UsageTimeline.screen(events,begin,end);boolean screenComplete=screen.usable(total);
   int eventCount=0;long first=0,last=0;for(UsageTimeline.Event e:events)if(e.at>=begin&&e.at<end){eventCount++;if(first==0)first=e.at;last=e.at;}
   JSONObject measurement=new JSONObject().put("method",screenComplete?"unlocked-screen-v1":"activity-timeline-v2").put("appActivityMinutes",total/60000.0).put("unlockedMinutes",screen.available?screen.millis/60000.0:JSONObject.NULL).put("completeScreenEvents",screenComplete).put("eventCount",eventCount);
   if(first>0)measurement.put("firstEventAt",Instant.ofEpochMilli(first).toString()).put("lastEventAt",Instant.ofEpochMilli(last).toString());
   days.put(new JSONObject().put("day",date.toString()).put("minutes",screenComplete?screen.millis/60000.0:total/60000.0).put("available",screenComplete||rows.length()>0).put("measurement",measurement).put("apps",rows));
  }return out.toString();
 }
}
