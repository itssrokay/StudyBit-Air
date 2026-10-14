package com.learningspace;
import java.net.URI;
public class LanAddress {
 public static String validate(String raw)throws Exception {
  URI u=new URI(raw.contains("://")?raw:"http://"+raw);if(!("http".equals(u.getScheme())||"https".equals(u.getScheme()))||u.getUserInfo()!=null||u.getQuery()!=null||u.getFragment()!=null||!(u.getPath()==null||u.getPath().isEmpty()||u.getPath().equals("/")))throw new Exception("Use a private computer address");String host=u.getHost();if(host==null)throw new Exception("Invalid address");String[] p=host.split("\\.");if(p.length!=4)throw new Exception("Use the computer’s Wi-Fi IPv4 address");int[] n=new int[4];for(int i=0;i<4;i++){if(!p[i].matches("[0-9]{1,3}"))throw new Exception("Invalid address");n[i]=Integer.parseInt(p[i]);if(n[i]>255)throw new Exception("Invalid address");}if(!(n[0]==10||(n[0]==172&&n[1]>=16&&n[1]<=31)||(n[0]==192&&n[1]==168)||host.equals("127.0.0.1")))throw new Exception("Public network addresses are not accepted");int port=u.getPort();if(port>65535||port==0)throw new Exception("Invalid port");return u.getScheme()+"://"+host+(port<0?"":":"+port);
 }
}
