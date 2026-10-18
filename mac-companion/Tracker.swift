import AppKit
import CoreGraphics

// Foreground app names and time only. No window titles, keystrokes, browser URLs, or screenshots.
struct AppTime: Codable { var id: String; var name: String; var minutes: Double }
struct DayTime: Codable { var day: String; var minutes: Double; var apps: [AppTime] }
struct Usage: Codable { var granted = true; var timezone: String; var capturedAt: String; var platform = "mac"; var paused: Bool; var trackedSince: String; var days: [DayTime] }
final class Tracker: NSObject, NSApplicationDelegate {
 let directory = FileManager.default.homeDirectoryForCurrentUser.appendingPathComponent("Library/Application Support/Learning Space",isDirectory:true)
 let clock = ISO8601DateFormatter()
 var status: NSStatusItem!, timer: Timer?, data: Usage!, settings: [String:Any] = [:]
 var last = Date(), sleeping = false
 var settingsURL: URL { directory.appendingPathComponent("settings.json") }
 var usageURL: URL { directory.appendingPathComponent("usage.json") }
 func readSettings() { if let raw=try? Data(contentsOf:settingsURL),let value=try? JSONSerialization.jsonObject(with:raw) as? [String:Any] {settings=value} }
 func writeSettings(){if let raw=try? JSONSerialization.data(withJSONObject:settings){try? raw.write(to:settingsURL,options:.atomic);try? FileManager.default.setAttributes([.posixPermissions:0o600],ofItemAtPath:settingsURL.path)}}
 func applicationDidFinishLaunching(_ notification: Notification){
  try? FileManager.default.createDirectory(at:directory,withIntermediateDirectories:true,attributes:[.posixPermissions:0o700]);readSettings()
  if settings["deviceId"] as? String == nil || (settings["deviceId"] as? String)=="" {settings["deviceId"]=UUID().uuidString;writeSettings()}
  if let raw=try? Data(contentsOf:usageURL),let old=try? JSONDecoder().decode(Usage.self,from:raw){data=old}else{data=Usage(timezone:TimeZone.current.identifier,capturedAt:clock.string(from:Date()),paused:true,trackedSince:clock.string(from:Date()),days:[])}
  status=NSStatusBar.system.statusItem(withLength:NSStatusItem.variableLength);status.button?.title="◷"
  NSWorkspace.shared.notificationCenter.addObserver(self,selector:#selector(sleepNow),name:NSWorkspace.willSleepNotification,object:nil)
  NSWorkspace.shared.notificationCenter.addObserver(self,selector:#selector(sleepNow),name:NSWorkspace.screensDidSleepNotification,object:nil)
  NSWorkspace.shared.notificationCenter.addObserver(self,selector:#selector(wakeNow),name:NSWorkspace.didWakeNotification,object:nil)
  NSWorkspace.shared.notificationCenter.addObserver(self,selector:#selector(wakeNow),name:NSWorkspace.screensDidWakeNotification,object:nil)
  NSWorkspace.shared.notificationCenter.addObserver(self,selector:#selector(switched),name:NSWorkspace.didActivateApplicationNotification,object:nil)
  if settings["enabled"] == nil {
   NSApp.activate(ignoringOtherApps:true);let alert=NSAlert();alert.messageText="Track time on this Mac?";alert.informativeText="Learning Space records app names and foreground time while this companion is running. Tracking pauses after one minute of inactivity and during sleep. It does not read browser history, page contents, window titles, or keystrokes. Data stays local unless you enable summary sync in the dashboard.";alert.addButton(withTitle:"Start tracking");alert.addButton(withTitle:"Keep paused");settings["enabled"]=(alert.runModal() == .alertFirstButtonReturn);settings["budgetMinutes"]=60;settings["syncSummaries"]=false;settings["shareAppNames"]=false;settings["categories"] = [String:String]();writeSettings()
  }
  timer=Timer.scheduledTimer(withTimeInterval:5,repeats:true){[weak self] _ in self?.tick()};last=Date();updateMenu();flush()
 }
 var active: NSRunningApplication? = NSWorkspace.shared.frontmostApplication
 @objc func switched(_ note: Notification){tick();active=note.userInfo?[NSWorkspace.applicationUserInfoKey] as? NSRunningApplication}
 @objc func sleepNow(){tick();sleeping=true;last=Date()}
 @objc func wakeNow(){sleeping=false;last=Date();active=NSWorkspace.shared.frontmostApplication}
 func tick(){
  let now=Date(),seconds=now.timeIntervalSince(last);defer{last=now;flush();updateMenu()};readSettings()
  if data.timezone != TimeZone.current.identifier {data.days=[];data.trackedSince=clock.string(from:now)}
  guard settings["enabled"] as? Bool == true,!sleeping,seconds>0,seconds<15,let app=active,app.activationPolicy == .regular else{return}
  let idle=CGEventSource.secondsSinceLastEventType(.combinedSessionState,eventType:CGEventType(rawValue:UInt32.max)!)
  guard idle<60 else{return}
  let identifier=app.bundleIdentifier ?? "unknown",name=app.localizedName ?? identifier
  var cursor=last;let cal=Calendar.current
  while cursor<now {let next=cal.date(byAdding:.day,value:1,to:cal.startOfDay(for:cursor))!,end=min(next,now),duration=end.timeIntervalSince(cursor)/60;let f=DateFormatter();f.dateFormat="yyyy-MM-dd";f.locale=Locale(identifier:"en_US_POSIX");f.timeZone=TimeZone.current;let key=f.string(from:cursor)
   if let i=data.days.firstIndex(where:{$0.day==key}){if let a=data.days[i].apps.firstIndex(where:{$0.id==identifier}){data.days[i].apps[a].minutes+=duration}else if data.days[i].apps.count<300{data.days[i].apps.append(AppTime(id:identifier,name:name,minutes:duration))};data.days[i].minutes=data.days[i].apps.reduce(0){$0+$1.minutes}}else{data.days.append(DayTime(day:key,minutes:duration,apps:[AppTime(id:identifier,name:name,minutes:duration)]))};cursor=end
  }
 }
 func flush(){data.timezone=TimeZone.current.identifier;data.capturedAt=clock.string(from:Date());data.paused=settings["enabled"] as? Bool != true;data.days=Array(data.days.sorted{$0.day<$1.day}.suffix(7));if let raw=try? JSONEncoder().encode(data){try? raw.write(to:usageURL,options:.atomic);try? FileManager.default.setAttributes([.posixPermissions:0o600],ofItemAtPath:usageURL.path)}}
 func updateMenu(){let enabled=settings["enabled"] as? Bool == true;status.button?.title=enabled ? "◷" : "◷Ⅱ";let menu=NSMenu();menu.addItem(NSMenuItem(title:"Learning Space · Mac time",action:nil,keyEquivalent:""));menu.addItem(NSMenuItem(title:enabled ? "Tracking foreground apps" : "Tracking paused",action:nil,keyEquivalent:""));menu.addItem(.separator());let toggle=NSMenuItem(title:enabled ? "Pause tracking" : "Start tracking",action:#selector(toggleTracking),keyEquivalent:"p");toggle.target=self;menu.addItem(toggle);let open=NSMenuItem(title:"Open dashboard",action:#selector(openDashboard),keyEquivalent:"o");open.target=self;menu.addItem(open);let quit=NSMenuItem(title:"Quit companion",action:#selector(quitNow),keyEquivalent:"q");quit.target=self;menu.addItem(quit);status.menu=menu}
 @objc func toggleTracking(){tick();settings["enabled"] = !(settings["enabled"] as? Bool ?? false);writeSettings();last=Date();flush();updateMenu()}
 @objc func openDashboard(){NSWorkspace.shared.open(URL(string:"http://127.0.0.1:5180/")!)}
 @objc func quitNow(){tick();NSApp.terminate(nil)}
}
let application=NSApplication.shared
let tracker=Tracker();application.delegate=tracker;application.setActivationPolicy(.accessory);application.run()
