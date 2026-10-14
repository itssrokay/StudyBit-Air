package com.learningspace;
import android.content.*;import android.database.*;import android.net.Uri;import android.os.ParcelFileDescriptor;import java.io.*;
public class BookProvider extends ContentProvider {
 @Override public boolean onCreate(){return true;}
 private String id(Uri uri){String id=uri.getLastPathSegment();if(id==null||!id.matches("[a-zA-Z0-9_-]{1,100}"))throw new IllegalArgumentException();return id;}
 @Override public ParcelFileDescriptor openFile(Uri uri,String mode)throws FileNotFoundException{if(!mode.equals("r"))throw new FileNotFoundException();return ParcelFileDescriptor.open(BookFiles.file(getContext(),id(uri)),ParcelFileDescriptor.MODE_READ_ONLY);}
 @Override public String getType(Uri uri){String name=getContext().getSharedPreferences("book_files",0).getString(id(uri),"book.pdf");return name.toLowerCase().endsWith(".epub")?"application/epub+zip":"application/pdf";}
 @Override public Cursor query(Uri uri,String[] projection,String selection,String[] args,String sort){String key=id(uri);MatrixCursor cursor=new MatrixCursor(new String[]{"_display_name","_size"});cursor.addRow(new Object[]{getContext().getSharedPreferences("book_files",0).getString(key,"book.pdf"),BookFiles.file(getContext(),key).length()});return cursor;}
 @Override public Uri insert(Uri u,ContentValues v){throw new UnsupportedOperationException();}@Override public int update(Uri u,ContentValues v,String s,String[] a){throw new UnsupportedOperationException();}@Override public int delete(Uri u,String s,String[] a){throw new UnsupportedOperationException();}
}
