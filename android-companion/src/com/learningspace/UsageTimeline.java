package com.learningspace;
import java.util.*;
/** Best-effort single foreground app timeline. Intervals are clipped to the requested window. */
public final class UsageTimeline {
 public static final int RESUMED=1,PAUSED=2,SCREEN_OFF=16,LOCKED=17,STOPPED=23,SHUTDOWN=26,STARTUP=27;
 public static final class Event {public final long at;public final int type;public final String app;public Event(long at,int type,String app){this.at=at;this.type=type;this.app=app==null?"":app;}}
 private static void add(Map<String,Long> totals,String app,long from,long to,long begin,long end){long duration=Math.max(0,Math.min(to,end)-Math.max(from,begin));if(duration>0&&!app.isEmpty())totals.put(app,totals.getOrDefault(app,0L)+duration);}
 public static Map<String,Long> durations(List<Event> events,long begin,long end){
  Map<String,Long> totals=new HashMap<>();if(end<=begin)return totals;
  String active="";long started=begin;
  List<Event> ordered=new ArrayList<>(events);ordered.sort(Comparator.comparingLong(e->e.at));
  for(Event e:ordered){if(e.at>end)break;
   if(e.type==STARTUP){active="";continue;} // No closing event: the preceding open interval is unknown.
   if(e.type==RESUMED&&!e.app.isEmpty()&&!active.equals(e.app)){add(totals,active,started,e.at,begin,end);active=e.app;started=e.at;}
   else if(((e.type==PAUSED||e.type==STOPPED)&&active.equals(e.app))||e.type==SCREEN_OFF||e.type==LOCKED||e.type==SHUTDOWN){add(totals,active,started,e.at,begin,end);active="";}
  }
  add(totals,active,started,end,begin,end);return totals;
 }
}
