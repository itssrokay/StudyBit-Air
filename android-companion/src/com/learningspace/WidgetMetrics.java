package com.learningspace;
import org.json.*;import java.time.*;
/** Calendar-safe view of the last local snapshot. Refresh opens the app for new data. */
public final class WidgetMetrics {
 public int minutes,goal,streak,best,weekMinutes,weekDays;public boolean current,hasData;public String encouragement;public int[] week=new int[7];public String[] days=new String[7];
 public static WidgetMetrics from(JSONObject j,Instant instant){WidgetMetrics m=new WidgetMetrics();m.goal=j.optInt("goalMinutes",45);m.best=j.optInt("streakBest");m.hasData=j.has("updatedAt");ZoneId zone;try{zone=ZoneId.of(j.optString("timezone","Asia/Kolkata"));}catch(Exception e){zone=ZoneId.of("UTC");}LocalDate now=instant.atZone(zone).toLocalDate();m.current=now.toString().equals(j.optString("day"));m.minutes=m.current?j.optInt("todayMinutes"):0;
  try{LocalDate snapshot=LocalDate.parse(j.getString("day")),last=j.getBoolean("todayDone")?snapshot:snapshot.minusDays(1);m.streak=!now.isBefore(snapshot)&&!now.isAfter(last.plusDays(1))?j.optInt("streakCurrent"):0;}catch(Exception ignored){}
  JSONArray entries=j.optJSONArray("week");for(int i=0;i<7;i++){LocalDate day=now.minusDays(6-i);m.days[i]=day.toString();if(entries!=null)for(int k=0;k<entries.length();k++){JSONObject d=entries.optJSONObject(k);if(d!=null&&day.toString().equals(d.optString("day")))m.week[i]=Math.max(0,d.optInt("minutes"));}m.weekMinutes+=m.week[i];if(m.week[i]>0)m.weekDays++;}
  String[] fresh={"One good step is enough to begin.","A fresh page. A little room to grow.","Welcome back. Your next step is waiting."},moving={"Small steps are adding up.","Your curiosity is making room to grow.","Keep a little space for what matters."},complete={"You made room for learning today.","Today’s goal is met. Let it settle in.","Progress made. One idea worth keeping."};int choice=(int)Math.floorMod(now.toEpochDay(),3);m.encouragement=(m.minutes>=m.goal?complete:m.minutes>0||m.streak>0?moving:fresh)[choice];return m;
 }
 public int percent(){return (int)Math.min(100,(long)minutes*100/Math.max(1,goal));}
}
