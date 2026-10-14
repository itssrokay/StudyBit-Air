package com.learningspace;
import android.content.*;import org.json.*;import java.time.*;import java.net.URI;
public class WidgetStore {
 private static String text(JSONObject j,String key,int max)throws Exception {String value=j.getString(key);if(value.length()>max)throw new Exception("Invalid "+key);return value;}
 private static int number(JSONObject j,String key,int min,int max)throws Exception {int n=j.getInt(key);if(n<min||n>max)throw new Exception("Invalid "+key);return n;}
 private static String url(JSONObject j)throws Exception {String value=text(j,"url",2048);if(!value.isEmpty()){URI u=new URI(value);if(!("https".equals(u.getScheme())||"http".equals(u.getScheme()))||u.getHost()==null)throw new Exception("Invalid URL");}return value;}
 public static JSONObject validate(String input)throws Exception {
  if(input==null||input.length()>50000)throw new Exception("Snapshot too large");JSONObject j=new JSONObject(input),out=new JSONObject();if(j.getInt("version")!=1)throw new Exception("Unsupported snapshot");out.put("version",1);
  String day=text(j,"day",10),updated=text(j,"updatedAt",40),zone=text(j,"timezone",100);LocalDate.parse(day);Instant.parse(updated);ZoneId.of(zone);out.put("day",day);out.put("updatedAt",updated);out.put("timezone",zone);
  out.put("todayMinutes",number(j,"todayMinutes",0,300000));out.put("goalMinutes",number(j,"goalMinutes",1,480));out.put("streakCurrent",number(j,"streakCurrent",0,100000));out.put("streakBest",number(j,"streakBest",0,100000));out.put("streakMinimum",number(j,"streakMinimum",1,60));out.put("todayDone",j.getBoolean("todayDone"));
  JSONArray next=j.getJSONArray("next"),cleanNext=new JSONArray();if(next.length()>3)throw new Exception("Too many tasks");for(int i=0;i<next.length();i++){JSONObject item=next.getJSONObject(i),clean=new JSONObject();clean.put("id",text(item,"id",100));clean.put("resourceId",text(item,"resourceId",100));clean.put("title",text(item,"title",250));clean.put("course",text(item,"course",250));clean.put("minutes",number(item,"minutes",1,480));clean.put("url",url(item));cleanNext.put(clean);}out.put("next",cleanNext);
  JSONArray week=j.getJSONArray("week"),cleanWeek=new JSONArray();if(week.length()!=7)throw new Exception("Expected a week");for(int i=0;i<week.length();i++){JSONObject item=week.getJSONObject(i),clean=new JSONObject();String date=text(item,"day",10);LocalDate.parse(date);clean.put("day",date);clean.put("minutes",number(item,"minutes",0,300000));cleanWeek.put(clean);}out.put("week",cleanWeek);
  JSONObject book=j.optJSONObject("reading");if(book==null)out.put("reading",JSONObject.NULL);else{JSONObject clean=new JSONObject();clean.put("title",text(book,"title",250));clean.put("resourceId",text(book,"resourceId",100));clean.put("chapter",text(book,"chapter",250));clean.put("progress",number(book,"progress",0,100));clean.put("url",url(book));out.put("reading",clean);}return out;
 }
 public static void save(Context c,String text)throws Exception {JSONObject j=validate(text);c.getSharedPreferences("widgets",0).edit().putString("snapshot",j.toString()).apply();}
 public static JSONObject read(Context c){try{return validate(c.getSharedPreferences("widgets",0).getString("snapshot","{}"));}catch(Exception e){return new JSONObject();}}
}
