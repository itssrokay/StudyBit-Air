package com.learningspace;
import android.app.Activity;import android.content.Intent;import android.os.Bundle;
/** The "Quick save" launcher entry: pick it for the Side key's double-press. It hands straight over to the app and closes. */
public class QuickSaveActivity extends Activity {
 @Override protected void onCreate(Bundle state){super.onCreate(state);
  startActivity(new Intent(this,MainActivity.class).setAction(MainActivity.QUICK_SAVE).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK|Intent.FLAG_ACTIVITY_CLEAR_TOP|Intent.FLAG_ACTIVITY_SINGLE_TOP));
  finish();overridePendingTransition(0,0);}
}
