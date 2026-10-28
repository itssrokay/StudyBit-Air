package com.learningspace;
import java.io.*;import java.net.*;import org.json.*;
/**
 * Fetches just enough of a shared link to name it: X posts through the public
 * oEmbed endpoint, other pages up to the end of <head>. No cookies or login;
 * private-network addresses are refused. Parsing happens in the dashboard.
 */
public final class LinkPreview {
 private LinkPreview(){}
 static final int LIMIT=600000;
 static boolean publicHost(String host)throws Exception{
  if(host==null||host.isEmpty()||host.equalsIgnoreCase("localhost")||host.endsWith(".local"))return false;
  for(InetAddress a:InetAddress.getAllByName(host))if(a.isAnyLocalAddress()||a.isLoopbackAddress()||a.isSiteLocalAddress()||a.isLinkLocalAddress()||a.isMulticastAddress())return false;
  return true;
 }
 static String endpoint(JSONObject j)throws Exception{
  String url=j.getString("url"),kind=j.getString("kind");
  if(url.length()>2000)throw new Exception("Link too long");
  if(kind.equals("x")){if(!url.matches("https://x\\.com/(?:[A-Za-z0-9_]{1,15}|i/web)/status/\\d{5,25}"))throw new Exception("Invalid X link");return "https://publish.twitter.com/oembed?omit_script=1&dnt=true&url="+URLEncoder.encode(url,"UTF-8");}
  if(!kind.equals("page")||!url.matches("https?://.+"))throw new Exception("Invalid link");
  return url;
 }
 public static String fetch(JSONObject j)throws Exception{
  String target=endpoint(j);
  for(int hop=0;hop<4;hop++){
   URL u=new URL(target);if(!("https".equals(u.getProtocol())||"http".equals(u.getProtocol()))||!publicHost(u.getHost()))throw new Exception("Blocked address");
   HttpURLConnection c=(HttpURLConnection)u.openConnection();c.setInstanceFollowRedirects(false);c.setConnectTimeout(8000);c.setReadTimeout(10000);
   c.setRequestProperty("User-Agent","Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36 LearningSpace");
   c.setRequestProperty("Accept","text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.5");c.setRequestProperty("Accept-Language","en-US,en;q=0.9");
   try{
    int code=c.getResponseCode();
    if(code>=300&&code<400){String next=c.getHeaderField("Location");if(next==null)throw new IOException("Bad redirect");target=new URL(u,next).toString();continue;}
    if(code!=200)throw new IOException("HTTP "+code);
    String type=c.getContentType()==null?"":c.getContentType().toLowerCase();
    if(!(type.contains("html")||type.contains("json")||type.isEmpty()))throw new IOException("Not a page");
    try(InputStream in=c.getInputStream();ByteArrayOutputStream out=new ByteArrayOutputStream()){
     byte[] b=new byte[8192];int n;while((n=in.read(b))!=-1&&out.size()<LIMIT){out.write(b,0,n);if(type.contains("html")&&out.toString("UTF-8").toLowerCase().contains("</head>"))break;}
     return new JSONObject().put("text",out.toString("UTF-8")).put("url",u.toString()).toString();
    }
   }finally{c.disconnect();}
  }
  throw new IOException("Too many redirects");
 }
}
