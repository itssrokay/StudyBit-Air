package com.learningspace;
import java.util.*;
/** Public UsageEvents only. Phone time is the union of observed unlocked-screen intervals. */
public final class UsageTimeline {
 public static final int RESUMED=1,PAUSED=2,SCREEN_ON=15,SCREEN_OFF=16,LOCKED=17,UNLOCKED=18,STOPPED=23,SHUTDOWN=26,STARTUP=27;
 public static final class Event {
  public final long at;public final int type;public final String app,activity;
  public Event(long at,int type,String app){this(at,type,app,"");}
  public Event(long at,int type,String app,String activity){this.at=at;this.type=type;this.app=app==null?"":app;this.activity=activity==null?"":activity;}
 }
 private static void add(Map<String,Long> totals,String app,long from,long to,long begin,long end){long duration=Math.max(0,Math.min(to,end)-Math.max(from,begin));if(duration>0&&!app.isEmpty())totals.put(app,totals.getOrDefault(app,0L)+duration);}
 public static Map<String,Long> durations(List<Event> events,long begin,long end){
  Map<String,Long> totals=new HashMap<>();if(end<=begin)return totals;
  String active="",activity="";long started=begin;
  List<Event> ordered=new ArrayList<>(events);ordered.sort(Comparator.comparingLong(e->e.at));
  for(Event e:ordered){if(e.at>end)break;
   if(e.type==STARTUP){active="";activity="";continue;} // Unknown closing time: never invent an overnight interval.
   if(e.type==RESUMED&&!e.app.isEmpty()){
    if(!active.equals(e.app)){add(totals,active,started,e.at,begin,end);started=e.at;}
    active=e.app;activity=e.activity; // A later pause/stop from the old screen must not close this screen.
   }else if(((e.type==PAUSED||e.type==STOPPED)&&active.equals(e.app)&&activity.equals(e.activity))||e.type==SCREEN_OFF||e.type==LOCKED||e.type==SHUTDOWN){add(totals,active,started,e.at,begin,end);active="";activity="";}
  }
  add(totals,active,started,end,begin,end);return totals;
 }
 public static final class Screen {public long millis;public boolean available,complete;public boolean usable(long appMillis){return available&&complete&&(millis>0||appMillis==0);}}
 /** Screen-on alone is insufficient: lock-screen and screen-off time do not count. */
 public static Screen screen(List<Event> events,long begin,long end){
  Screen out=new Screen();if(end<=begin)return out;
  boolean interactive=false,unlocked=false,known=false;long started=begin;
  List<Event> ordered=new ArrayList<>(events);ordered.sort(Comparator.comparingLong(e->e.at));
  for(Event e:ordered){if(e.at>end)break;
   if(e.type!=SCREEN_ON&&e.type!=SCREEN_OFF&&e.type!=LOCKED&&e.type!=UNLOCKED&&e.type!=SHUTDOWN&&e.type!=STARTUP)continue;
   // A reboot without a preceding screen-off/shutdown leaves the open interval unknown.
   if(e.type!=STARTUP&&known&&interactive&&unlocked)out.millis+=Math.max(0,Math.min(e.at,end)-Math.max(started,begin));
   if(e.type==STARTUP&&interactive&&unlocked)out.complete=false;
   if(e.at<=begin)out.complete=true;
   out.available=true;known=true;
   if(e.type==UNLOCKED){interactive=true;unlocked=true;}
   else if(e.type==SCREEN_ON){interactive=true;} // Await keyguard hidden after waking.
   else if(e.type==LOCKED){unlocked=false;}
   else {interactive=false;unlocked=false;}
   started=e.at;
  }
  if(known&&interactive&&unlocked)out.millis+=Math.max(0,end-Math.max(started,begin));
  return out;
 }
}
