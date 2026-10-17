package com.learningspace;
import org.json.*;
public class YouTubeMetadataCheck {
 public static void main(String[] args)throws Exception{
  if(!YouTubeMetadata.endpoint(new JSONObject().put("kind","playlist").put("id","PLEYgx5hMdopw")).equals("https://www.youtube.com/playlist?list=PLEYgx5hMdopw&hl=en"))throw new AssertionError();
  for(String[] bad:new String[][]{{"playlist","abc&url=https://localhost"},{"video","short"},{"http","Q04sTEwC7Kg"}}){boolean rejected=false;try{YouTubeMetadata.endpoint(new JSONObject().put("kind",bad[0]).put("id",bad[1]));}catch(Exception e){rejected=true;}if(!rejected)throw new AssertionError("Unsafe metadata target accepted");}
  if(!YouTubeMetadata.thumbnail("https://i.ytimg.com/vi/Q04sTEwC7Kg/hqdefault.jpg"))throw new AssertionError();for(String url:new String[]{"http://i.ytimg.com/vi/Q04sTEwC7Kg/hqdefault.jpg","https://i.ytimg.com.evil.example/vi/Q04sTEwC7Kg/hqdefault.jpg","https://i.ytimg.com/vi/Q04sTEwC7Kg/hqdefault.jpg?redirect=1","https://user@i.ytimg.com/vi/Q04sTEwC7Kg/hqdefault.jpg"})if(YouTubeMetadata.thumbnail(url))throw new AssertionError("Unsafe image accepted");
  System.out.println("Native YouTube checks passed: fixed metadata endpoints, input bounds, HTTPS thumbnail allowlist.");
 }
}
