package com.learningspace;
import android.app.PendingIntent;import android.content.Intent;import android.os.Build;import android.service.quicksettings.Tile;import android.service.quicksettings.TileService;
/** Quick Settings tile: take a screenshot or copy a link, pull down the shade, tap Quick save. */
public class QuickSaveTile extends TileService {
 @Override public void onStartListening(){Tile t=getQsTile();if(t!=null){t.setState(Tile.STATE_INACTIVE);t.updateTile();}}
 @Override public void onClick(){
  Intent i=new Intent(this,MainActivity.class).setAction(MainActivity.QUICK_SAVE).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK|Intent.FLAG_ACTIVITY_CLEAR_TOP|Intent.FLAG_ACTIVITY_SINGLE_TOP);
  if(Build.VERSION.SDK_INT>=34)startActivityAndCollapse(PendingIntent.getActivity(this,7,i,PendingIntent.FLAG_IMMUTABLE|PendingIntent.FLAG_UPDATE_CURRENT));
  else startActivityAndCollapse(i);
 }
}
