package com.learningspace;
import org.json.*;
/** Persisted stopwatch math, independent of Activity/WebView lifetimes and wall-clock changes. */
public final class StudyTimerState {
 public static final long MAX_MS=86400000L;
 public final String id,resourceId,lessonId,resourceTitle,lessonTitle;
 public final int plannedMinutes,bootCount;
 public final long accumulatedMs,anchorElapsedMs,updatedAt;
 public final boolean running;
 private StudyTimerState(String id,String rid,String lid,String rt,String lt,int planned,long accumulated,long anchor,long at,int boot,boolean run){this.id=id;resourceId=rid;lessonId=lid;resourceTitle=rt;lessonTitle=lt;plannedMinutes=planned;accumulatedMs=accumulated;anchorElapsedMs=anchor;updatedAt=at;bootCount=boot;running=run;}
 private static String text(JSONObject j,String key,int max)throws Exception{String s=j.getString(key);if(s.trim().isEmpty()||s.length()>max||s.matches("(?s).*\\p{Cntrl}.*"))throw new IllegalArgumentException("Invalid timer details");return s;}
 public static StudyTimerState start(JSONObject j,long uptime,long wall,int boot)throws Exception{String id=text(j,"id",100);if(!id.matches("[a-zA-Z0-9_-]{1,100}"))throw new IllegalArgumentException("Invalid timer ID");int plan=j.getInt("plannedMinutes");if(plan<1||plan>600)throw new IllegalArgumentException("Invalid block length");return new StudyTimerState(id,text(j,"resourceId",100),text(j,"lessonId",100),text(j,"resourceTitle",250),text(j,"lessonTitle",250),plan,0,uptime,wall,boot,true);}
 public static StudyTimerState restore(JSONObject j,long uptime,long wall,int boot)throws Exception{StudyTimerState valid=start(j,uptime,wall,boot);long ms=j.getLong("accumulatedMs"),anchor=j.getLong("anchorElapsedMs");int savedBoot=j.getInt("bootCount");if(ms<0||ms>MAX_MS||anchor<0)throw new IllegalArgumentException("Invalid timer position");boolean run=j.getBoolean("running")&&savedBoot==boot&&uptime>=anchor&&ms<MAX_MS;StudyTimerState s=new StudyTimerState(valid.id,valid.resourceId,valid.lessonId,valid.resourceTitle,valid.lessonTitle,valid.plannedMinutes,ms,anchor,j.getLong("updatedAt"),boot,run);return s.elapsed(uptime)>=MAX_MS?s.pause(uptime,wall):s;}
 public long elapsed(long uptime){return Math.min(MAX_MS,Math.max(0,accumulatedMs+(running?Math.max(0,uptime-anchorElapsedMs):0)));}
 public StudyTimerState pause(long uptime,long wall){return new StudyTimerState(id,resourceId,lessonId,resourceTitle,lessonTitle,plannedMinutes,elapsed(uptime),uptime,wall,bootCount,false);}
 public StudyTimerState resume(long uptime,long wall){if(running||accumulatedMs>=MAX_MS)return this;return new StudyTimerState(id,resourceId,lessonId,resourceTitle,lessonTitle,plannedMinutes,accumulatedMs,uptime,wall,bootCount,true);}
 public JSONObject json(long uptime)throws Exception{return new JSONObject().put("id",id).put("resourceId",resourceId).put("lessonId",lessonId).put("resourceTitle",resourceTitle).put("lessonTitle",lessonTitle).put("plannedMinutes",plannedMinutes).put("accumulatedMs",accumulatedMs).put("anchorElapsedMs",anchorElapsedMs).put("updatedAt",updatedAt).put("bootCount",bootCount).put("running",running).put("elapsedMs",elapsed(uptime));}
}
