package com.learningspace;
import java.net.*;import java.io.*;import org.json.*;
// Fixed YouTube metadata endpoints only; no account cookies or playback requests.
public final class YouTubeMetadata {
 static String endpoint(JSONObject j)throws Exception{
  String kind=j.getString("kind");if(kind.equals("continuation")){String token=j.getString("token"),version=j.getString("clientVersion");if(token.isEmpty()||token.length()>15000||!version.matches("[\\w.]{1,80}"))throw new Exception("Invalid continuation");return "https://www.youtube.com/youtubei/v1/browse";}
  String id=j.getString("id");if(kind.equals("video")&&id.matches("[A-Za-z0-9_-]{11}"))return "https://www.youtube.com/watch?v="+id+"&hl=en";if(kind.equals("playlist")&&id.matches("[A-Za-z0-9_-]{2,150}"))return "https://www.youtube.com/playlist?list="+id+"&hl=en";throw new Exception("Invalid YouTube link");
 }
 public static String fetch(JSONObject j)throws Exception{
  HttpURLConnection c=(HttpURLConnection)new URL(endpoint(j)).openConnection();c.setInstanceFollowRedirects(false);c.setConnectTimeout(8000);c.setReadTimeout(12000);c.setRequestProperty("User-Agent","Mozilla/5.0");c.setRequestProperty("Accept-Language","en-US,en;q=0.9");
  try{if(j.getString("kind").equals("continuation")){c.setRequestMethod("POST");c.setRequestProperty("Content-Type","application/json");c.setDoOutput(true);JSONObject client=new JSONObject().put("clientName","WEB").put("clientVersion",j.getString("clientVersion")).put("hl","en").put("gl","US");String body=new JSONObject().put("context",new JSONObject().put("client",client)).put("continuation",j.getString("token")).toString();try(OutputStream out=c.getOutputStream()){out.write(body.getBytes("UTF-8"));}}
   if(c.getResponseCode()!=200)throw new IOException("YouTube unavailable");if(c.getContentLengthLong()>6000000)throw new IOException("Outline too large");try(InputStream in=c.getInputStream();ByteArrayOutputStream out=new ByteArrayOutputStream()){byte[] b=new byte[8192];int n;while((n=in.read(b))!=-1){out.write(b,0,n);if(out.size()>6000000)throw new IOException("Outline too large");}return new JSONObject().put("text",out.toString("UTF-8")).toString();}
  }finally{c.disconnect();}
 }
 public static boolean thumbnail(String value){return value!=null&&value.matches("https://i\\.ytimg\\.com/vi/[A-Za-z0-9_-]{11}/(?:hqdefault|mqdefault|sddefault|maxresdefault)\\.jpg");}
}
