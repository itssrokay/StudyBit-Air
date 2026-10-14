import java.io.File;
import com.android.apksig.ApkVerifier;
public class LearningApkVerify {
 public static void main(String[] args) throws Exception {
  ApkVerifier.Result r = new ApkVerifier.Builder(new File(args[0])).setMinCheckedPlatformVersion(26).build().verify();
  System.out.println("APK signature verified: " + r.isVerified() + ", v2=" + r.isVerifiedUsingV2Scheme() + ", v3=" + r.isVerifiedUsingV3Scheme());
  if(!r.isVerified()){System.out.println(r.getErrors());System.exit(1);}
 }
}
