package com.learningspace;
import org.json.*;import java.time.*;
/** Pure transformations shared by the scheduled job and JVM release checks. */
public final class DailyCoachContext {
 public static final int VERSION=2;
 public static final String DATE_POLICY="reviewDay is the completed calendar day being assessed in timezone. generatedAt is when this response is produced, usually on the following day. snapshotAt is when the library was saved and may be earlier. These timestamps have different roles; their dates differing is expected, not a date mismatch. Use dayActivity for that day. Screen-time capture timestamps may be after midnight while their day identifies the activity. Do not substitute today or a cached request date. Missing observations remain unknown.";
 public static boolean canReuse(JSONObject review,String id,String signature){return review.optInt("requestVersion",1)>=VERSION&&id.equals(review.optString("id"))&&signature.equals(review.optString("activitySignature"));}
 public static String noticeKey(JSONObject review)throws Exception{return review.getString("id")+":"+review.optInt("requestVersion",1)+":"+review.getString("at");}

 public static String day(Instant now,String zone){return now.atZone(ZoneId.of(zone)).toLocalDate().minusDays(1).toString();}
 public static long nextMidnight(Instant now,String zone){return now.atZone(ZoneId.of(zone)).toLocalDate().plusDays(1).atStartOfDay(ZoneId.of(zone)).toInstant().toEpochMilli();}
 static JSONObject activity(JSONObject automatic,String day)throws Exception{JSONObject result=new JSONObject().put("day",day),calendar=automatic.getJSONObject("activityCalendar"),targets=automatic.getJSONObject("targets");for(String space:new String[]{"personal","work"}){JSONArray rows=calendar.getJSONArray(space);double minutes=0,week=0;String start=LocalDate.parse(day).minusDays(6).toString();for(int i=0;i<rows.length();i++){JSONObject row=rows.getJSONObject(i);String d=row.getString("day");if(d.equals(day))minutes=row.getDouble("minutes");if(d.compareTo(start)>=0&&d.compareTo(day)<=0)week+=row.getDouble("minutes");}result.put(space,new JSONObject().put("minutes",minutes).put("minutesWeek",week).put("goalMinutes",targets.getInt(space+"Minutes")));}return result;}
 /** Canonicalize only at send time: a cached template can contain another day's chat request. */
 public static void alignInput(JSONObject input,String day,String zone,Instant now)throws Exception{
  LocalDate.parse(day);ZoneId timezone=ZoneId.of(zone);JSONObject context=input.getJSONObject("context"),automatic=context.getJSONObject("automatic");
  input.put("requestVersion",VERSION).put("reviewDay",day).put("timezone",zone).put("generatedAt",now.toString()).put("dayActivity",activity(automatic,day));input.remove("request");
  String snapshot=input.getString("snapshotAt");
  input.put("dateContext",new JSONObject().put("reviewDay",day).put("timezone",zone).put("generatedAt",now.toString()).put("generationDay",now.atZone(timezone).toLocalDate().toString()).put("snapshotAt",snapshot).put("snapshotDay",Instant.parse(snapshot).atZone(timezone).toLocalDate().toString()).put("policy",DATE_POLICY));
  context.remove("request");context.remove("sessionEvidence");context.remove("todayBudget");context.remove("focusBalance");
  context.put("activity",new JSONObject().put("reviewDay",day).put("source","dayActivity").put("note","Use dayActivity for completed-day learning totals, separately for Personal and Work."));
  JSONObject screen=context.optJSONObject("screenTime");String start=LocalDate.parse(day).minusDays(6).toString();if(screen!=null){JSONArray rows=screen.optJSONArray("days"),filtered=new JSONArray();if(rows!=null)for(int i=0;i<rows.length();i++){JSONObject row=rows.getJSONObject(i);String d=row.getString("day");if(d.compareTo(start)>=0&&d.compareTo(day)<=0)filtered.put(row);}screen.put("days",filtered);}
  JSONArray sessions=context.optJSONArray("recentSessions");if(sessions!=null){JSONArray filtered=new JSONArray();for(int i=0;i<sessions.length();i++){JSONObject row=sessions.getJSONObject(i);if(Instant.parse(row.getString("at")).atZone(timezone).toLocalDate().toString().compareTo(day)<=0)filtered.put(row);}context.put("recentSessions",filtered);}
  JSONObject continuity=automatic.optJSONObject("continuity");if(continuity!=null&&(continuity.optInt("requestVersion",1)<VERSION||continuity.optString("reviewDay").compareTo(day)>=0))automatic.put("continuity",JSONObject.NULL);
 }
 public static JSONObject request(JSONObject template,String day,Instant now)throws Exception{
  JSONObject body=new JSONObject(template.getJSONObject("body").toString()),input=new JSONObject(body.getString("input"));
  alignInput(input,day,template.getString("timezone"),now);
  // Fresh phone observations are added by the job, then aligned again before sending.
  input.getJSONObject("context").remove("screenTime");body.put("input",input.toString()).put("instructions",body.optString("instructions")+" "+DATE_POLICY);return body;
 }
 public static JSONObject phoneUsage(JSONObject day,String capturedAt,int budget,boolean shareNames)throws Exception{
  JSONArray apps=day.getJSONArray("apps"),names=new JSONArray();if(shareNames)for(int i=0;i<Math.min(5,apps.length());i++){JSONObject app=apps.getJSONObject(i);names.put(new JSONObject().put("name",app.getString("name")).put("minutes",app.getDouble("minutes")));}
  return new JSONObject().put("device","Phone").put("platform","android").put("day",day.getString("day")).put("capturedAt",capturedAt).put("totalMinutes",day.getDouble("minutes")).put("measurement",day.getJSONObject("measurement")).put("budgetMinutes",budget).put("partial",true).put("topApps",names);
 }
 public static JSONObject parseReply(JSONObject raw)throws Exception{
  JSONArray output=raw.optJSONArray("output");StringBuilder text=new StringBuilder();if(output!=null)for(int i=0;i<output.length();i++){JSONArray content=output.getJSONObject(i).optJSONArray("content");if(content!=null)for(int j=0;j<content.length();j++){JSONObject part=content.getJSONObject(j);if("output_text".equals(part.optString("type")))text.append(part.optString("text"));}}
  JSONObject reply=new JSONObject(text.toString());String[] fields={"headline","assessment","nextAction","checkpoint","question"};int[] limits={180,5000,1200,2400,500};for(int i=0;i<fields.length;i++){Object value=reply.get(fields[i]);if(!(value instanceof String)||((String)value).length()>limits[i]||(i<3&&((String)value).trim().isEmpty()))throw new Exception("Invalid coach review");}return reply;
 }
}
