package com.learningspace;
import java.io.*;import java.nio.file.*;import java.nio.charset.StandardCharsets;import java.security.MessageDigest;import java.time.Instant;import java.util.UUID;import org.json.*;
/** Durable local queue. Receiving a share never changes the learning library.
 * Handled shares (saved, discarded or closed) are remembered for 7 days, by id and by text, so an old
 * share intent that Android re-delivers (recents, activity restore, another app's task) never re-enters the queue. */
public final class ShareDrafts {
 static final long REMEMBER_MS=7L*24*60*60*1000;static final int REMEMBER_MAX=300;
 public static synchronized JSONArray read(File file)throws Exception{if(!file.exists())return new JSONArray();if(file.length()>900000)throw new IOException("Draft queue too large");JSONArray a=new JSONArray(new String(Files.readAllBytes(file.toPath()),StandardCharsets.UTF_8));if(a.length()>20)throw new IOException("Draft queue too large");return a;}
 private static void write(File file,JSONArray a)throws Exception{File tmp=new File(file.getPath()+".tmp");Files.write(tmp.toPath(),a.toString().getBytes(StandardCharsets.UTF_8));Files.move(tmp.toPath(),file.toPath(),StandardCopyOption.REPLACE_EXISTING);}
 private static File handledFile(File file){return new File(file.getPath()+".handled");}
 static String textKey(String text){try{String n=text.trim().replaceAll("\\s+"," ").toLowerCase();byte[] d=MessageDigest.getInstance("SHA-256").digest(n.getBytes(StandardCharsets.UTF_8));StringBuilder b=new StringBuilder("t:");for(int i=0;i<12;i++)b.append(String.format("%02x",d[i]));return b.toString();}catch(Exception e){return "t:"+text.trim().hashCode();}}
 private static JSONObject handled(File file,long now){JSONObject keep=new JSONObject();try{File h=handledFile(file);if(!h.exists()||h.length()>200000)return keep;JSONObject all=new JSONObject(new String(Files.readAllBytes(h.toPath()),StandardCharsets.UTF_8));for(java.util.Iterator<String> it=all.keys();it.hasNext();){String k=it.next();long at=all.optLong(k,0);if(now-at<REMEMBER_MS)keep.put(k,at);}}catch(Exception ignored){}return keep;}
 public static synchronized boolean wasHandled(File file,String id,String text,long now){JSONObject h=handled(file,now);return (id!=null&&h.has("i:"+id))||(text!=null&&h.has(textKey(text)));}
 public static synchronized void add(File file,String id,String text)throws Exception{add(file,id,text,"",System.currentTimeMillis());}
 public static synchronized void add(File file,String id,String text,long now)throws Exception{add(file,id,text,"",now);}
 /** Queue a share. Text may be empty when an image is attached. Returns false when it was already queued or handled. */
 public static synchronized boolean add(File file,String id,String text,String image,long now)throws Exception{
  if(text==null)text="";if(image==null)image="";
  boolean hasText=!text.trim().isEmpty(),hasImage=SavedImages.validName(image);
  if(id==null||!id.matches("[a-zA-Z0-9-]{1,100}")||(!hasText&&!hasImage))throw new IllegalArgumentException();
  // A new screenshot can carry a link or caption the learner already saved.
  boolean dedupeText=hasText&&!hasImage;
  if(wasHandled(file,id,dedupeText?text:null,now))return false;
  JSONArray a=read(file);String key=dedupeText?textKey(text):null;
  for(int i=0;i<a.length();i++){JSONObject j=a.getJSONObject(i);if(j.getString("id").equals(id)||(key!=null&&!j.optString("text").trim().isEmpty()&&textKey(j.optString("text")).equals(key))||(hasImage&&image.equals(j.optString("image"))))return false;}
  if(a.length()>=20)throw new IOException("Save your existing shared drafts before adding more.");
  String bounded=text.length()>10000?text.substring(0,9950)+"\n[Shared text shortened to fit the inbox.]":text;
  JSONObject j=new JSONObject().put("id",id).put("text",bounded).put("createdAt",Instant.ofEpochMilli(now).toString());if(hasImage)j.put("image",image);
  a.put(j);write(file,a);return true;
 }
 public static synchronized void acknowledge(File file,String id)throws Exception{acknowledge(file,id,System.currentTimeMillis());}
 public static synchronized void acknowledge(File file,String id,long now)throws Exception{JSONArray a=read(file),next=new JSONArray();JSONObject h=handled(file,now);h.put("i:"+id,now);for(int i=0;i<a.length();i++){JSONObject j=a.getJSONObject(i);if(!j.getString("id").equals(id))next.put(j);else if(!j.optString("text").trim().isEmpty())h.put(textKey(j.optString("text")),now);}
  if(h.length()>REMEMBER_MAX){java.util.List<String> ks=new java.util.ArrayList<>();for(java.util.Iterator<String> it=h.keys();it.hasNext();)ks.add(it.next());ks.sort((x,y)->Long.compare(h.optLong(x),h.optLong(y)));for(int i=0;i<ks.size()-REMEMBER_MAX;i++)h.remove(ks.get(i));}
  File hf=handledFile(file),tmp=new File(hf.getPath()+".tmp");Files.write(tmp.toPath(),h.toString().getBytes(StandardCharsets.UTF_8));Files.move(tmp.toPath(),hf.toPath(),StandardCopyOption.REPLACE_EXISTING);write(file,next);}
}
