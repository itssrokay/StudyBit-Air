import com.learningspace.*;import java.time.*;
public class MorningBriefCheck {
 public static void main(String[] args)throws Exception{
  long a=MorningBriefAccess.nextAt("Asia/Kolkata","08:30","",Instant.parse("2026-10-28T01:00:00Z"));
  if(a!=Instant.parse("2026-10-28T03:00:00Z").toEpochMilli())throw new AssertionError("today 08:30 IST "+Instant.ofEpochMilli(a));
  long b=MorningBriefAccess.nextAt("Asia/Kolkata","08:30","",Instant.parse("2026-10-28T04:00:00Z"));
  if(b!=Instant.parse("2026-10-29T03:00:00Z").toEpochMilli())throw new AssertionError("after time -> tomorrow");
  long c=MorningBriefAccess.nextAt("Asia/Kolkata","08:30","2026-10-28",Instant.parse("2026-10-28T01:00:00Z"));
  if(c!=Instant.parse("2026-10-29T03:00:00Z").toEpochMilli())throw new AssertionError("already shown -> tomorrow");
  System.out.println("Morning brief schedule checks passed");
 }
}
