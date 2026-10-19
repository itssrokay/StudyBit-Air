package com.learningspace;
import org.json.*;import java.time.*;
/** Pure transformations shared by the scheduled job and JVM release checks. */
public final class DailyCoachContext {
 public static String day(Instant now,String zone){return now.atZone(ZoneId.of(zone)).toLocalDate().minusDays(1).toString();}
 public static long nextMidnight(Instant now,String zone){return now.atZone(ZoneId.of(zone)).toLocalDate().plusDays(1).atStartOfDay(ZoneId.of(zone)).toInstant().toEpochMilli();}
 static JSONObject activity(JSONObject automatic,String day)throws Exception{JSONObject result=new JSONObject().put("day",day),calendar=automatic.getJSONObject("activityCalendar"),targets=automatic.getJSONObject("targets");for(String space:new String[]{"personal","work"}){JSONArray rows=calendar.getJSONArray(space);double minutes=0,week=0;String start=LocalDate.parse(day).minusDays(6).toString();for(int i=0;i<rows.length();i++){JSONObject row=rows.getJSONObject(i);String d=row.getString("day");if(d.equals(day))minutes=row.getDouble("minutes");if(d.compareTo(start)>=0&&d.compareTo(day)<=0)week+=row.getDouble("minutes");}result.put(space,new JSONObject().put("minutes",minutes).put("minutesWeek",week).put("goalMinutes",targets.getInt(space+"Minutes")));}return result;}
 public static JSONObject request(JSONObject template,String day,Instant now)throws Exception{
  JSONObject body=new JSONObject(template.getJSONObject("body").toString()),input=new JSONObject(body.getString("input")),context=input.getJSONObject("context"),automatic=context.getJSONObject("automatic");
  input.put("reviewDay",day).put("generatedAt",now.toString()).put("dayActivity",activity(automatic,day));
  context.put("activity",new JSONObject().put("today",day).put("note","Use dayActivity for completed-day totals; metadata snapshot date is explicit."));
  // The current job can run after several closed days. No records are invented for those days.
  context.remove("screenTime");body.put("input",input.toString());return body;
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
