package com.learningspace;

import java.time.*;
import java.util.*;
import org.json.*;

/** Rolling aggregates for one phone. Foreground estimates and unlocked screen time have separate denominators. */
final class PhoneUsagePatterns {
 private static final int MIN_DAYS=3, WINDOW_HOURS=3, WINDOW_COUNT=24/WINDOW_HOURS;
 private static final long MINUTE=60_000L, ACTIVE_WINDOW=15*MINUTE;

 private final long[] screenTotals=new long[WINDOW_COUNT], recurringTotals=new long[WINDOW_COUNT];
 private final int[] activeDays=new int[WINDOW_COUNT];
 private final Map<String,Long> appTotals=new HashMap<>();
 private int screenDays, appDays;
 private long screenMillis, appMillis;

 static long[] boundaries(LocalDate day,ZoneId zone){
  long[] boundaries=new long[WINDOW_COUNT+1];
  for(int i=0;i<WINDOW_COUNT;i++)boundaries[i]=day.atTime(i*WINDOW_HOURS,0).atZone(zone).toInstant().toEpochMilli();
  boundaries[WINDOW_COUNT]=day.plusDays(1).atStartOfDay(zone).toInstant().toEpochMilli();
  return boundaries;
 }

 static void addInterval(long[] windows,long[] boundaries,long start,long end){
  for(int i=0;i<WINDOW_COUNT;i++)windows[i]+=Math.max(0,Math.min(end,boundaries[i+1])-Math.max(start,boundaries[i]));
 }

 void addDay(UsageTimeline.Screen screen,long appTotal,long[] windows,Map<String,Long> apps){
  if(screen.usable(appTotal)){
   screenDays++;screenMillis+=screen.millis;
   for(int i=0;i<WINDOW_COUNT;i++){
    screenTotals[i]+=windows[i];
    if(windows[i]>=ACTIVE_WINDOW){activeDays[i]++;recurringTotals[i]+=windows[i];}
   }
  }
  if(appTotal>0){
   appDays++;appMillis+=appTotal;
   for(Map.Entry<String,Long> app:apps.entrySet())appTotals.merge(app.getKey(),app.getValue(),Long::sum);
  }
 }

 JSONObject summary(LocalDate through,ZoneId zone,Map<String,String> labels)throws JSONException{
  JSONObject summary=new JSONObject().put("fromDay",through.minusDays(6).toString())
    .put("throughDay",through.toString()).put("timezone",zone.getId());
  int peak=-1;
  for(int i=0;i<WINDOW_COUNT;i++){
   if(activeDays[i]<Math.max(MIN_DAYS,(screenDays+1)/2))continue;
   if(peak<0||activeDays[i]>activeDays[peak]||(activeDays[i]==activeDays[peak]&&screenTotals[i]>screenTotals[peak]))peak=i;
  }
  if(peak>=0&&screenMillis>0){
   summary.put("recurringWindow",new JSONObject().put("startHour",peak*WINDOW_HOURS).put("endHour",(peak+1)*WINDOW_HOURS)
     .put("observedDays",screenDays).put("activeDays",activeDays[peak]).put("minimumActiveMinutes",ACTIVE_WINDOW/MINUTE)
     .put("averageMinutesOnActiveDays",minutes((double)recurringTotals[peak]/activeDays[peak]))
     .put("shareOfUnlockedPercent",percent(screenTotals[peak],screenMillis)));
  }
  if(appDays>=MIN_DAYS&&appMillis>=ACTIVE_WINDOW){
   JSONArray top=new JSONArray();
   Map<String,Long> namedTotals=new HashMap<>();
   for(Map.Entry<String,Long> app:appTotals.entrySet()){
    String label=labels.get(app.getKey());
    if(label!=null&&!label.isEmpty()&&!label.equals(app.getKey()))namedTotals.merge(label,app.getValue(),Long::sum);
   }
   List<String> ranked=new ArrayList<>(namedTotals.keySet());
   ranked.sort(Comparator.<String>comparingLong(namedTotals::get).reversed().thenComparing(Comparator.naturalOrder()));
   long combined=0;
   for(String name:ranked.subList(0,Math.min(ranked.size(),2))){
    long millis=namedTotals.get(name);combined+=millis;
    top.put(new JSONObject().put("name",name.substring(0,Math.min(120,name.length()))).put("minutes",minutes(millis))
      .put("shareOfForegroundPercent",percent(millis,appMillis)));
   }
   if(top.length()>0)summary.put("appUsage",new JSONObject().put("observedDays",appDays)
     .put("totalForegroundMinutes",minutes(appMillis)).put("topAppSharePercent",percent(combined,appMillis)).put("topApps",top));
  }
  return summary;
 }
 private static long minutes(double millis){return Math.round(millis/MINUTE);}
 private static long percent(long part,long total){return Math.round(100.0*part/total);}
}
