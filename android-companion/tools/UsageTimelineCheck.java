import com.learningspace.UsageTimeline;import java.util.*;
public class UsageTimelineCheck {
 static UsageTimeline.Event e(long at,int type,String app){return new UsageTimeline.Event(at,type,app);}
 static UsageTimeline.Event a(long at,int type,String activity){return new UsageTimeline.Event(at,type,"same.app",activity);}
 static void eq(long actual,long expected){if(actual!=expected)throw new AssertionError(actual+" != "+expected);}
 public static void main(String[] args){
  eq(UsageTimeline.SCREEN_OFF,android.app.usage.UsageEvents.Event.SCREEN_NON_INTERACTIVE);eq(UsageTimeline.RESUMED,android.app.usage.UsageEvents.Event.ACTIVITY_RESUMED);eq(UsageTimeline.STARTUP,android.app.usage.UsageEvents.Event.DEVICE_STARTUP);
  List<UsageTimeline.Event> events=Arrays.asList(e(10,1,"a"),e(30,1,"b"),e(40,2,"a"),e(60,16,""),e(80,1,"a"));
  Map<String,Long> out=UsageTimeline.durations(events,0,100);eq(out.get("a"),40);eq(out.get("b"),30);
  out=UsageTimeline.durations(events,20,50);eq(out.get("a"),10);eq(out.get("b"),20);
  out=UsageTimeline.durations(Arrays.asList(e(1,1,"a"),e(3,26,""),e(8,1,"b")),0,10);eq(out.get("a"),2);eq(out.get("b"),2);
  out=UsageTimeline.durations(Arrays.asList(e(1,1,"a"),e(8,27,"")),0,10);eq(out.size(),0);
  out=UsageTimeline.durations(Arrays.asList(e(1,1,"a"),e(3,15,""),e(6,16,"")),0,10);eq(out.get("a"),5);
  eq(UsageTimeline.durations(events,100,90).size(),0);eq(UsageTimeline.durations(Collections.emptyList(),0,100).size(),0);
  // Android emits lifecycle transitions per activity. An old activity's pause/stop must not close the new one.
  out=UsageTimeline.durations(Arrays.asList(a(10,1,"First"),a(20,1,"Second"),a(21,2,"First"),a(30,23,"First"),a(60,2,"Second")),0,100);eq(out.get("same.app"),50);
  out=UsageTimeline.durations(Arrays.asList(a(10,1,"First"),a(20,1,"Second"),a(21,2,"First"),a(30,23,"First"),a(60,2,"Second")),25,50);eq(out.get("same.app"),25);
  // Phone time is independent of activities: home-screen gaps count, locks/screen-off do not.
  List<UsageTimeline.Event> phone=Arrays.asList(e(-10,16,""),e(5,15,""),e(10,18,""),a(12,1,"First"),a(20,2,"First"),e(50,17,""),e(55,16,""),e(70,15,""),e(75,18,""));
  UsageTimeline.Screen screen=UsageTimeline.screen(phone,0,100);eq(screen.millis,65);eq(screen.complete?1:0,1);eq(screen.available?1:0,1);
  screen=UsageTimeline.screen(phone,25,40);eq(screen.millis,15);eq(screen.complete?1:0,1);
  screen=UsageTimeline.screen(Arrays.asList(e(5,15,""),e(10,18,""),e(30,16,"")),0,50);eq(screen.millis,20);eq(screen.complete?1:0,0);
  screen=UsageTimeline.screen(Arrays.asList(e(-1,16,"")),0,50);eq(screen.millis,0);eq(screen.complete?1:0,1);eq(screen.usable(0)?1:0,1);eq(screen.usable(20)?1:0,0);
  screen=UsageTimeline.screen(Arrays.asList(e(-1,18,""),e(20,27,""),e(40,18,"")),0,50);eq(screen.millis,10);eq(screen.complete?1:0,0);
  screen=UsageTimeline.screen(Collections.emptyList(),0,50);eq(screen.available?1:0,0);eq(screen.complete?1:0,0);
  screen=UsageTimeline.screen(Arrays.asList(e(-1,18,""),e(10,15,""),e(20,16,"")),0,50);eq(screen.millis,20);
  System.out.println("Usage timeline: activity handoffs, day clipping, unlocked phone totals, home-screen gaps, missing data, locks and reboots passed.");
 }
}
