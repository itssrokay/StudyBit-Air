import com.learningspace.UsageTimeline;import java.util.*;
public class UsageTimelineCheck {
 static UsageTimeline.Event e(long at,int type,String app){return new UsageTimeline.Event(at,type,app);}
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
  System.out.println("Usage timeline: clipping, app switching, screen off, reboot, and unknown windows passed.");
 }
}
