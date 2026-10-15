import com.learningspace.StudyTimerState;import org.json.*;
public class StudyTimerCheck {
 static void check(boolean ok,String message){if(!ok)throw new AssertionError(message);}
 static JSONObject spec()throws Exception{return new JSONObject().put("id","session-1").put("resourceId","r").put("lessonId","l").put("lessonTitle","Read a chapter").put("resourceTitle","A book").put("plannedMinutes",45);}
 public static void main(String[] args)throws Exception{
  StudyTimerState s=StudyTimerState.start(spec(),1000,1000000,1);check(s.running&&s.elapsed(11000)==10000,"Clock counts elapsed time");
  StudyTimerState restarted=StudyTimerState.restore(s.json(10000),61000,900000000,1);check(restarted.elapsed(61000)==60000,"Process restart restores monotonic anchor, independent of wall clock");
  s=s.pause(61000,9000000);check(!s.running&&s.elapsed(990000)==60000,"Pause does not count time away");
  s=s.resume(1000000,1);check(s.elapsed(1060000)==120000,"Resume accumulates only running time");check(s.resume(1030000,2).elapsed(1060000)==120000,"Repeated resume does not reset elapsed time");
  StudyTimerState reboot=StudyTimerState.restore(s.json(1060000),1000,999999999,2);check(!reboot.running&&reboot.elapsed(999999)==60000,"Reboot pauses instead of counting powered-off time");
  StudyTimerState rollback=StudyTimerState.restore(s.json(1060000),1,999999999,1);check(!rollback.running,"Uptime rollback is paused");
  s=s.pause(200000000,100);check(s.elapsed(200000001)==StudyTimerState.MAX_MS&&!s.running,"24-hour limit is bounded");check(!s.resume(200000002,101).running,"Expired timer cannot resume");
  boolean rejected=false;try{StudyTimerState.start(spec().put("plannedMinutes",0),0,0,1);}catch(Exception e){rejected=true;}check(rejected,"Invalid duration rejected");
  rejected=false;try{StudyTimerState.start(spec().put("id","../script"),0,0,1);}catch(Exception e){rejected=true;}check(rejected,"Invalid timer ID rejected");
  rejected=false;try{StudyTimerState.start(spec().put("lessonTitle","x\nInjected"),0,0,1);}catch(Exception e){rejected=true;}check(rejected,"Control characters rejected");
  check(s.json(200000002).getString("resourceId").equals("r"),"Only session metadata persists");
  System.out.println("Native timer checks passed: elapsed time, pause/resume, process restore, clock changes, reboot, caps, and input validation.");
 }
}
