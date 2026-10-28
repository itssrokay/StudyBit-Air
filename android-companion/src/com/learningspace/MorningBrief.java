package com.learningspace;
import android.app.*;import android.content.*;import org.json.*;import java.time.*;
/**
 * Morning brief notification. The dashboard prepares today's and tomorrow's brief
 * (headline + body) whenever the library changes; this receiver posts the one for
 * today at the learner's chosen time. No network or AI is involved.
 */
public class MorningBrief extends BroadcastReceiver {
 static final String PREFS="morning_brief",CHANNEL="morning_brief",ACTION="com.learningspace.MORNING_BRIEF";
 static final int NOTICE=7210,ALARM=7211;
 public static synchronized String configure(Context c,String raw)throws Exception{
  if(raw==null||raw.length()>20000)throw new Exception("The morning brief is too large.");
  JSONObject data=new JSONObject(raw);ZoneId.of(data.getString("timezone"));
  if(!data.getString("time").matches("([01]\\d|2[0-3]):[0-5]\\d"))throw new Exception("Choose a valid time.");
  JSONArray briefs=data.getJSONArray("briefs");if(briefs.length()>4)throw new Exception("Too many briefs.");
  for(int i=0;i<briefs.length();i++){JSONObject b=briefs.getJSONObject(i);if(!b.getString("day").matches("\\d{4}-\\d{2}-\\d{2}")||b.getString("title").length()>200||b.getString("body").length()>1500)throw new Exception("Invalid brief.");}
  c.getSharedPreferences(PREFS,0).edit().putString("config",data.toString()).commit();
  schedule(c);
  return new JSONObject().put("scheduled",data.getBoolean("enabled")).toString();
 }
 static JSONObject config(Context c){try{return new JSONObject(c.getSharedPreferences(PREFS,0).getString("config","{}"));}catch(Exception e){return new JSONObject();}}
 static PendingIntent pending(Context c){return PendingIntent.getBroadcast(c,ALARM,new Intent(c,MorningBrief.class).setAction(ACTION),PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);}
 /** Next delivery time in epoch millis, or -1 when the brief is off. Pure, for checks. */
 static long nextAt(String timezone,String time,String shownDay,Instant now){
  ZoneId zone=ZoneId.of(timezone);String[] hm=time.split(":");LocalTime at=LocalTime.of(Integer.parseInt(hm[0]),Integer.parseInt(hm[1]));
  ZonedDateTime local=now.atZone(zone),next=local.toLocalDate().atTime(at).atZone(zone);
  if(!next.isAfter(local)||local.toLocalDate().toString().equals(shownDay))next=next.plusDays(1);
  return next.toInstant().toEpochMilli();
 }
 public static synchronized void schedule(Context c){
  AlarmManager alarms=c.getSystemService(AlarmManager.class);PendingIntent pi=pending(c);
  JSONObject data=config(c);
  try{
   if(!data.optBoolean("enabled",false)){alarms.cancel(pi);return;}
   long when=nextAt(data.getString("timezone"),data.getString("time"),c.getSharedPreferences(PREFS,0).getString("shown",""),Instant.now());
   alarms.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP,when,pi);// Inexact: no exact-alarm permission needed.
  }catch(Exception e){alarms.cancel(pi);}
 }
 @Override public void onReceive(Context c,Intent intent){
  if(ACTION.equals(intent.getAction())){try{post(c,false);}catch(Exception ignored){/* Shown next time the conditions allow. */}}
  schedule(c);// After delivery, boot, app update or a timezone change.
 }
 /** Post today's brief. A preview posts even if today's was already shown. */
 public static synchronized String post(Context c,boolean preview)throws Exception{
  JSONObject data=config(c);if(!data.has("timezone"))throw new Exception("Open Today once so your coach can prepare a brief.");
  String today=LocalDate.now(ZoneId.of(data.getString("timezone"))).toString();
  JSONArray briefs=data.optJSONArray("briefs");JSONObject brief=null;
  if(briefs!=null)for(int i=0;i<briefs.length();i++)if(today.equals(briefs.getJSONObject(i).optString("day")))brief=briefs.getJSONObject(i);
  if(brief==null&&preview&&briefs!=null&&briefs.length()>0)brief=briefs.getJSONObject(0);
  if(brief==null)return new JSONObject().put("posted",false).toString();// Stale data: stay quiet rather than send yesterday's note.
  SharedPreferences p=c.getSharedPreferences(PREFS,0);if(!preview&&today.equals(p.getString("shown","")))return new JSONObject().put("posted",false).toString();
  NotificationManager m=c.getSystemService(NotificationManager.class);
  m.createNotificationChannel(new NotificationChannel(CHANNEL,"Morning brief",NotificationManager.IMPORTANCE_DEFAULT));
  if(!m.areNotificationsEnabled())throw new Exception("Allow notifications for Learning Space to get the morning brief.");
  Intent open=new Intent(c,MainActivity.class).putExtra("path","?page=today").addFlags(Intent.FLAG_ACTIVITY_NEW_TASK|Intent.FLAG_ACTIVITY_SINGLE_TOP);
  PendingIntent tap=PendingIntent.getActivity(c,NOTICE,open,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
  String title=brief.getString("title"),body=brief.getString("body");
  Notification publicView=new Notification.Builder(c,CHANNEL).setSmallIcon(R.drawable.ic_timer_notification).setContentTitle("Your morning brief is ready").build();
  Notification n=new Notification.Builder(c,CHANNEL).setSmallIcon(R.drawable.ic_timer_notification).setSubText("Morning brief").setContentTitle(title).setContentText(body).setStyle(new Notification.BigTextStyle().bigText(body)).setContentIntent(tap).setAutoCancel(true).setCategory(Notification.CATEGORY_RECOMMENDATION).setVisibility(Notification.VISIBILITY_PRIVATE).setPublicVersion(publicView).build();
  m.notify(NOTICE,n);
  if(!preview)p.edit().putString("shown",today).commit();
  return new JSONObject().put("posted",true).toString();
 }
}
