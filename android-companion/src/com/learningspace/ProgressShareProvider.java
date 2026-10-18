package com.learningspace;
import android.content.*;import android.database.*;import android.net.Uri;import android.os.ParcelFileDescriptor;import java.io.*;
public class ProgressShareProvider extends ContentProvider {
 @Override public boolean onCreate(){return true;}
 static File file(Context c,String name){if(name==null||!name.matches("[a-zA-Z0-9-]{1,100}\\.png"))throw new IllegalArgumentException();return new File(new File(c.getCacheDir(),"progress-shares"),name);}
 @Override public ParcelFileDescriptor openFile(Uri uri,String mode)throws FileNotFoundException{if(!"r".equals(mode))throw new FileNotFoundException();return ParcelFileDescriptor.open(file(getContext(),uri.getLastPathSegment()),ParcelFileDescriptor.MODE_READ_ONLY);}
 @Override public String getType(Uri u){return "image/png";}
 @Override public Cursor query(Uri uri,String[] projection,String selection,String[] args,String sort){File f=file(getContext(),uri.getLastPathSegment());MatrixCursor c=new MatrixCursor(new String[]{"_display_name","_size"});c.addRow(new Object[]{"learning-progress.png",f.length()});return c;}
 @Override public Uri insert(Uri u,ContentValues v){throw new UnsupportedOperationException();}@Override public int update(Uri u,ContentValues v,String s,String[] a){throw new UnsupportedOperationException();}@Override public int delete(Uri u,String s,String[] a){throw new UnsupportedOperationException();}
}
