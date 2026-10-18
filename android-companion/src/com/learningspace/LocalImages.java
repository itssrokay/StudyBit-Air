package com.learningspace;
/** Only bounded raster images may bypass asset interception; never remote URLs or HTML/SVG. */
public final class LocalImages {
 public static boolean raster(String url){if(url==null||url.length()>3000000)return false;int start=url.startsWith("data:image/png;base64,")?22:url.startsWith("data:image/jpeg;base64,")||url.startsWith("data:image/webp;base64,")?23:-1;if(start<0||url.length()<=start)return false;int padding=0;for(int i=start;i<url.length();i++){char c=url.charAt(i);if(c=='='){if(++padding>2)return false;}else if(padding>0||!((c>='a'&&c<='z')||(c>='A'&&c<='Z')||(c>='0'&&c<='9')||c=='+'||c=='/'))return false;}return true;}
}
