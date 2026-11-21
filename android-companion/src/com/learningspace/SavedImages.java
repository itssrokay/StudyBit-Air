package com.learningspace;
import android.content.*;import android.database.Cursor;import android.graphics.*;import android.net.Uri;import android.os.Build;import android.provider.MediaStore;import android.util.Base64;
import java.io.*;import java.util.UUID;
/** Images you saved (shared screenshots, Quick save). Stored privately in the app, resized so a library of saves stays small. */
public final class SavedImages {
 static final int MAX_SIDE=1600;static final long MAX_INPUT=30L*1024*1024;
 static File dir(Context c){File d=new File(c.getFilesDir(),"saves");d.mkdirs();return d;}
 static boolean validName(String name){return name!=null&&name.matches("[a-f0-9-]{36}\\.jpg");}
 static File file(Context c,String name){if(!validName(name))throw new IllegalArgumentException("Invalid image");return new File(dir(c),name);}
 private static int sample(int w,int h,int max){int s=1;while(w/(s*2)>=max||h/(s*2)>=max)s*=2;return s;}
 private static Bitmap scaled(Bitmap b,int max){int w=b.getWidth(),h=b.getHeight(),side=Math.max(w,h);if(side<=max)return b;float k=max/(float)side;Bitmap out=Bitmap.createScaledBitmap(b,Math.max(1,Math.round(w*k)),Math.max(1,Math.round(h*k)),true);if(out!=b)b.recycle();return out;}
 /** Copy an image from a share or MediaStore into private storage as a JPEG. Returns its file name. */
 public static String save(Context c,Uri uri)throws Exception{
  ContentResolver r=c.getContentResolver();
  try(Cursor cur=r.query(uri,new String[]{android.provider.OpenableColumns.SIZE},null,null,null)){if(cur!=null&&cur.moveToFirst()&&!cur.isNull(0)&&cur.getLong(0)>MAX_INPUT)throw new IOException("Image too large");}catch(SecurityException|IllegalArgumentException ignored){}
  BitmapFactory.Options bounds=new BitmapFactory.Options();bounds.inJustDecodeBounds=true;
  try(InputStream in=r.openInputStream(uri)){BitmapFactory.decodeStream(in,null,bounds);}
  if(bounds.outWidth<=0||bounds.outHeight<=0)throw new IOException("Not an image");
  BitmapFactory.Options o=new BitmapFactory.Options();o.inSampleSize=sample(bounds.outWidth,bounds.outHeight,MAX_SIDE);
  Bitmap b;try(InputStream in=r.openInputStream(uri)){b=BitmapFactory.decodeStream(in,null,o);}
  if(b==null)throw new IOException("Not an image");
  b=scaled(b,MAX_SIDE);String name=UUID.randomUUID().toString()+".jpg";File f=new File(dir(c),name),tmp=new File(dir(c),name+".tmp");
  try(FileOutputStream out=new FileOutputStream(tmp)){if(!b.compress(Bitmap.CompressFormat.JPEG,82,out))throw new IOException("Could not save image");}finally{b.recycle();}
  if(!tmp.renameTo(f))throw new IOException("Could not save image");
  return name;
 }
 /** A smaller JPEG as a data URL, for thumbnails (≈480) or AI reading (≈1024). */
 public static String dataUrl(Context c,String name,int max,int quality)throws Exception{
  File f=file(c,name);if(!f.exists())return "";
  BitmapFactory.Options bounds=new BitmapFactory.Options();bounds.inJustDecodeBounds=true;BitmapFactory.decodeFile(f.getPath(),bounds);
  BitmapFactory.Options o=new BitmapFactory.Options();o.inSampleSize=sample(bounds.outWidth,bounds.outHeight,max);
  Bitmap b=BitmapFactory.decodeFile(f.getPath(),o);if(b==null)return "";b=scaled(b,max);
  ByteArrayOutputStream bytes=new ByteArrayOutputStream();try{b.compress(Bitmap.CompressFormat.JPEG,Math.max(40,Math.min(90,quality)),bytes);}finally{b.recycle();}
  return "data:image/jpeg;base64,"+Base64.encodeToString(bytes.toByteArray(),Base64.NO_WRAP);
 }
 public static boolean delete(Context c,String name){try{return file(c,name).delete();}catch(Exception e){return false;}}
 /** The newest screenshot taken in the last maxAgeMs, if the app may read images. */
 public static Uri latestScreenshot(Context c,long maxAgeMs){
  Uri base=MediaStore.Images.Media.EXTERNAL_CONTENT_URI;
  String[] cols={MediaStore.Images.Media._ID,MediaStore.Images.Media.DATE_ADDED};
  String where=Build.VERSION.SDK_INT>=29?MediaStore.Images.Media.RELATIVE_PATH+" LIKE ?":MediaStore.Images.Media.DATA+" LIKE ?";
  String[] args={"%Screenshots%"};
  try(Cursor cur=c.getContentResolver().query(base,cols,where,args,MediaStore.Images.Media.DATE_ADDED+" DESC")){
   if(cur==null||!cur.moveToFirst())return null;
   long added=cur.getLong(1)*1000L;if(System.currentTimeMillis()-added>maxAgeMs)return null;
   return ContentUris.withAppendedId(base,cur.getLong(0));
  }catch(Exception e){return null;}
 }
}
