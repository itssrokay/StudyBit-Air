import com.learningspace.WidgetStore;import org.json.*;
public class WidgetStoreCheck {
 static JSONObject sample()throws Exception{JSONObject j=new JSONObject();j.put("version",1).put("updatedAt","2026-10-15T12:00:00Z").put("timezone","Asia/Kolkata").put("day","2026-10-15").put("todayMinutes",12).put("goalMinutes",45).put("streakCurrent",3).put("streakBest",7).put("streakMinimum",5).put("todayDone",true).put("reading",JSONObject.NULL);JSONArray week=new JSONArray();for(int i=9;i<=15;i++)week.put(new JSONObject().put("day",String.format("2026-10-%02d",i)).put("minutes",12));j.put("week",week);JSONArray next=new JSONArray();next.put(new JSONObject().put("id","lesson-1").put("resourceId","course-1").put("title","A useful lesson").put("course","A useful course").put("minutes",20).put("url","https://example.com/learn"));return j.put("next",next);}
 static void rejects(JSONObject j)throws Exception{try{WidgetStore.validate(j.toString());throw new AssertionError("Invalid snapshot accepted");}catch(AssertionError e){throw e;}catch(Exception expected){}}
 public static void main(String[] args)throws Exception{
  JSONObject j=sample().put("apiKey","must-not-persist");if(WidgetStore.validate(j.toString()).has("apiKey"))throw new AssertionError("Unknown fields retained");
  rejects(sample().put("timezone","Invalid/Zone"));rejects(sample().put("week",new JSONArray().put(JSONObject.NULL)));rejects(sample().put("goalMinutes",0));j=sample();j.getJSONArray("next").getJSONObject(0).put("url","javascript:alert(1)");rejects(j);
  System.out.println("Native snapshot checks passed: valid payload, unknown-field removal, invalid timezone/week/goal/URL rejection.");
 }
}
