import {dailyReviewRequestVersion} from './coach-schema.ts';
import {dayKey} from './learning.ts';
import {reviewDayActivity,shiftDay,type automaticCoachContext} from './coach-context.ts';
export const dailyDatePolicy='reviewDay is the completed calendar day being assessed in timezone. generatedAt is when this response is produced, usually on the following day. snapshotAt is when the library was saved and may be earlier. These timestamps have different roles; their dates differing is expected, not a date mismatch. Use dayActivity for that day. Screen-time capture timestamps may be after midnight while their day identifies the activity. Do not substitute today or a cached request date. Missing observations remain unknown.';
/** Applied at send time; a persisted phone template retains the unfiltered inventory until then. */
export function alignDailyReviewInput(raw:Record<string,any>,day:string,timezone:string,now:Date){
 const input=structuredClone(raw),context=input.context;
 const generatedAt=now.toISOString(),snapshotAt=input.snapshotAt;
 delete input.request;input.reviewDay=day;input.timezone=timezone;input.generatedAt=generatedAt;
 input.dateContext={reviewDay:day,timezone,generatedAt,generationDay:dayKey(now,timezone),snapshotAt,snapshotDay:dayKey(new Date(snapshotAt),timezone),policy:dailyDatePolicy};
 input.dayActivity=reviewDayActivity(context.automatic as ReturnType<typeof automaticCoachContext>,day);
 // These are chat-only, relative-date fields. They are not evidence for a completed day.
 delete context.request;delete context.sessionEvidence;delete context.todayBudget;delete context.focusBalance;
 context.activity={reviewDay:day,source:'dayActivity',note:'Use dayActivity for completed-day learning totals, separately for Personal and Work.'};
 if(context.screenTime){const start=shiftDay(day,-6);context.screenTime.days=context.screenTime.days.filter((d:{day:string})=>d.day>=start&&d.day<=day);}
 if(context.recentSessions)context.recentSessions=context.recentSessions.filter((s:{at:string})=>dayKey(new Date(s.at),timezone)<=day);
 if(context.automatic.continuity&&((context.automatic.continuity.requestVersion??1)<dailyReviewRequestVersion||context.automatic.continuity.reviewDay>=day))context.automatic.continuity=null;
 return input;
}
