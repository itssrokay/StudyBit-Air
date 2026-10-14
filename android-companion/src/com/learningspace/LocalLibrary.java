package com.learningspace;
import java.io.*;import java.nio.file.*;import org.json.*;
public class LocalLibrary {
 private final File file;public LocalLibrary(File file){this.file=file;}
 public synchronized String read()throws Exception{return file.exists()?new String(Files.readAllBytes(file.toPath()),"UTF-8"):"";}
 public synchronized String save(String raw)throws Exception{
  if(raw==null||raw.length()>4000000)throw new Exception("Library exceeds 4 MB");JSONObject input=new JSONObject(raw),state=input.getJSONObject("state");if(state.getInt("version")!=1||state.getJSONArray("resources").length()>300||state.getJSONArray("goals").length()>30)throw new Exception("Invalid library");int old=file.exists()?new JSONObject(read()).getInt("revision"):0;if(input.getInt("revision")!=old)return new JSONObject().put("error","Another copy changed this local library. Export your unsaved copy, then reload.").put("status",409).toString();JSONObject packet=new JSONObject().put("state",state).put("revision",old+1);file.getParentFile().mkdirs();File temp=new File(file.getPath()+".tmp");try(FileOutputStream out=new FileOutputStream(temp)){out.write(packet.toString().getBytes("UTF-8"));out.getFD().sync();}Files.move(temp.toPath(),file.toPath(),StandardCopyOption.REPLACE_EXISTING,StandardCopyOption.ATOMIC_MOVE);return new JSONObject().put("revision",old+1).toString();
 }
}
