package com.learningspace;
import org.json.*;import java.time.*;
public class DailyCoachCheck {
 static void check(boolean value){if(!value)throw new AssertionError();}
 public static void main(String[] args)throws Exception{
  Instant midnight=Instant.parse("2026-10-18T18:30:00Z");check(DailyCoachContext.day(midnight,"Asia/Kolkata").equals("2026-10-18"));check(DailyCoachContext.day(midnight.minusSeconds(1),"Asia/Kolkata").equals("2026-10-17"));
  Instant dst=Instant.parse("2026-03-08T05:00:00Z");check(DailyCoachContext.nextMidnight(dst,"America/New_York")-dst.toEpochMilli()==23*3600000L);
  JSONObject automatic=new JSONObject("{\"activityCalendar\":{\"personal\":[{\"day\":\"2026-10-18\",\"minutes\":10}],\"work\":[]},\"targets\":{\"personalMinutes\":45,\"workMinutes\":30}}");
  JSONObject template=new JSONObject().put("body",new JSONObject().put("input",new JSONObject().put("reviewDay","OLD").put("context",new JSONObject().put("automatic",automatic).put("screenTime","STALE")).toString()));
  JSONObject input=new JSONObject(DailyCoachContext.request(template,"2026-10-18",midnight).getString("input"));check(input.getString("reviewDay").equals("2026-10-18"));check(input.getJSONObject("dayActivity").getJSONObject("personal").getInt("minutes")==10);check(!input.getJSONObject("context").has("screenTime"));
  JSONObject later=new JSONObject(DailyCoachContext.request(template,"2026-10-22",midnight).getString("input"));check(later.getJSONObject("dayActivity").getJSONObject("personal").getInt("minutes")==0);
  JSONObject reply=new JSONObject("{\"headline\":\"Reality\",\"assessment\":\"Recorded facts\",\"nextAction\":\"Start a block\",\"checkpoint\":\"A dated note\",\"question\":\"\"}");JSONObject raw=new JSONObject().put("output",new JSONArray().put(new JSONObject().put("content",new JSONArray().put(new JSONObject().put("type","output_text").put("text",reply.toString())))));check(DailyCoachContext.parseReply(raw).getString("headline").equals("Reality"));boolean rejected=false;try{DailyCoachContext.parseReply(new JSONObject());}catch(Exception e){rejected=true;}check(rejected);
  System.out.println("Daily coach: local midnight, DST, completed-day totals, stale usage removal and reply validation passed.");
 }
}
