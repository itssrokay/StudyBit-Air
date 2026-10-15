package com.learningspace;
import android.content.*;import android.os.SystemClock;import android.provider.Settings;import org.json.*;
public final class StudyTimerStore {
 private static SharedPreferences prefs(Context c){return c.getSharedPreferences("focus_timer",0);}
 private static int boot(Context c){try{return Settings.Global.getInt(c.getContentResolver(),Settings.Global.BOOT_COUNT);}catch(Exception e){return 0;}}
 public static synchronized StudyTimerState read(Context c){String raw=prefs(c).getString("active","");if(raw.isEmpty())return null;try{StudyTimerState s=StudyTimerState.restore(new JSONObject(raw),SystemClock.elapsedRealtime(),System.currentTimeMillis(),boot(c));return s;}catch(Exception e){prefs(c).edit().remove("active").commit();return null;}}
 private static void write(Context c,StudyTimerState s)throws Exception{if(!prefs(c).edit().putString("active",s.json(SystemClock.elapsedRealtime()).toString()).commit())throw new Exception("Could not save timer on this phone");}
 public static synchronized StudyTimerState start(Context c,JSONObject data)throws Exception{StudyTimerState previous=read(c);if(previous!=null){if(previous.id.equals(data.optString("id")))return previous;throw new Exception("Finish or discard the current focus session first.");}StudyTimerState s=StudyTimerState.start(data,SystemClock.elapsedRealtime(),System.currentTimeMillis(),boot(c));write(c,s);return s;}
 public static synchronized StudyTimerState change(Context c,String id,String action)throws Exception{StudyTimerState s=read(c);if(s==null||!s.id.equals(id))throw new Exception("This timer has changed. Open the current session.");if(action.equals("clear")){if(!prefs(c).edit().remove("active").commit())throw new Exception("Could not clear timer");return null;}s=action.equals("resume")?s.resume(SystemClock.elapsedRealtime(),System.currentTimeMillis()):s.pause(SystemClock.elapsedRealtime(),System.currentTimeMillis());write(c,s);return s;}
}
