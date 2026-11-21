package com.learningspace;

import java.time.*;
import java.util.*;
import org.json.*;

public class PhoneUsagePatternsCheck {
 private static final long MINUTE=60_000;
 private static void expect(boolean value){if(!value)throw new AssertionError();}
 private static void add(PhoneUsagePatterns patterns,LocalDate day,ZoneId zone,int minutes,boolean complete){
  long[] edges=PhoneUsagePatterns.boundaries(day,zone),windows=new long[edges.length-1];
  // 17:45 through 18:00 belongs to the previous window. The rest lands in 18:00–21:00.
  long start=edges[6]-15*MINUTE,end=start+minutes*MINUTE;
  List<UsageTimeline.Event> events=new ArrayList<>();
  if(complete)events.add(new UsageTimeline.Event(edges[0]-1,UsageTimeline.SCREEN_OFF,""));
  events.add(new UsageTimeline.Event(start,UsageTimeline.UNLOCKED,""));
  events.add(new UsageTimeline.Event(end,UsageTimeline.SCREEN_OFF,""));
  UsageTimeline.Screen screen=UsageTimeline.screen(events,edges[0],edges[8],(from,to)->PhoneUsagePatterns.addInterval(windows,edges,from,to));
  expect(Arrays.stream(windows).sum()==screen.millis);
  Map<String,Long> apps=new HashMap<>();
  apps.put("video.pkg",50*MINUTE);apps.put("browser.pkg",30*MINUTE);apps.put("private.pkg",20*MINUTE);
  patterns.addDay(screen,100*MINUTE,windows,apps);
 }
 public static void main(String[] args)throws Exception{
  ZoneId zone=ZoneId.of("Asia/Kolkata");LocalDate through=LocalDate.parse("2026-11-18");
  PhoneUsagePatterns patterns=new PhoneUsagePatterns();
  Map<String,String> labels=new HashMap<>();
  labels.put("video.pkg","YouTube");labels.put("browser.pkg","Chrome");labels.put("private.pkg","private.pkg");
  add(patterns,through.minusDays(4),zone,60,true);
  add(patterns,through.minusDays(3),zone,75,true);
  expect(!patterns.summary(through,zone,labels).has("recurringWindow"));
  add(patterns,through.minusDays(2),zone,90,true);
  add(patterns,through.minusDays(1),zone,180,false);
  JSONObject report=patterns.summary(through,zone,labels);
  JSONObject win=report.getJSONObject("recurringWindow"),apps=report.getJSONObject("appUsage");
  // Both windows recur on all 3 measured days. 18:00 wins on total minutes.
  expect(win.getInt("startHour")==18&&win.getInt("averageMinutesOnActiveDays")==60&&win.getInt("shareOfUnlockedPercent")==80);
  expect(win.getInt("activeDays")==3&&win.getInt("observedDays")==3&&apps.getInt("observedDays")==4);
  expect(apps.getInt("topAppSharePercent")==80&&apps.getInt("totalForegroundMinutes")==400);
  expect(!report.toString().contains(".pkg"));
  JSONObject context=new JSONObject(),usage=new JSONObject().put("phonePatterns",report);
  DailyCoachContext.attachPhonePatterns(context,usage,zone.getId(),through.toString(),false);
  expect(context.getJSONObject("phonePatterns").has("recurringWindow")&&!context.getJSONObject("phonePatterns").has("appUsage"));
  DailyCoachContext.attachPhonePatterns(context,usage,zone.getId(),through.toString(),true);
  expect(context.getJSONObject("phonePatterns").has("appUsage"));
  context=new JSONObject();
  DailyCoachContext.attachPhonePatterns(context,usage,zone.getId(),through.minusDays(1).toString(),true);
  expect(!context.has("phonePatterns"));
  long[] dst=PhoneUsagePatterns.boundaries(LocalDate.parse("2026-03-08"),ZoneId.of("America/Los_Angeles"));
  expect(dst[1]-dst[0]==120*MINUTE);
  dst=PhoneUsagePatterns.boundaries(LocalDate.parse("2026-11-01"),ZoneId.of("America/Los_Angeles"));
  expect(dst[1]-dst[0]==240*MINUTE);
  System.out.println("Phone patterns: recurrence, window clipping, DST, app denominators, redaction and review date alignment passed.");
 }
}
