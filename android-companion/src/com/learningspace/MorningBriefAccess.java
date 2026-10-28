package com.learningspace;
import java.time.Instant;
/** Public entry point for the builder's schedule check. */
public final class MorningBriefAccess {private MorningBriefAccess(){}public static long nextAt(String zone,String time,String shown,Instant now){return MorningBrief.nextAt(zone,time,shown,now);}}
