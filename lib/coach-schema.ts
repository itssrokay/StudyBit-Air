import {z} from 'zod';
import {coachActionsSchema,actionReceiptSchema} from './coach-action-schema.ts';

export const coachSuggestionSchema=z.object({resourceId:z.string().min(1).max(100),priority:z.number().int().min(1).max(5),focusModule:z.string().max(200),reason:z.string().max(700)});
export const coachPlanSchema=z.object({minutes:z.number().int().min(1).max(480),lessonIds:z.array(z.string().min(1).max(100)).min(1).max(12),reason:z.string().max(700)});
export const memoryKindSchema=z.enum(['goal','preference','constraint','fact']);
export const memoryProposalSchema=z.object({text:z.string().trim().min(1).max(400),kind:memoryKindSchema,reason:z.string().max(400)});
export const coachMemorySchema=z.object({id:z.string().min(1).max(100),text:z.string().trim().min(1).max(400),kind:memoryKindSchema,workspace:z.enum(['all','personal','work']).default('all'),source:z.enum(['manual','coach']),createdAt:z.string().datetime()});
export const coachReplySchema=z.object({message:z.string().min(1).max(4000),question:z.string().max(500).default(''),suggestions:z.array(coachSuggestionSchema).max(12),todayPlan:coachPlanSchema.nullable().default(null),suggestedMemories:z.array(memoryProposalSchema).max(3).optional(),actions:coachActionsSchema.optional()});
export const coachMessageSchema=z.object({id:z.string().min(1).max(100),role:z.enum(['user','assistant']),text:z.string().min(1).max(6000),at:z.string().datetime(),source:z.enum(['learner','smart','ai']),context:z.string().max(2000).default(''),reply:coachReplySchema.nullable().default(null),appliedAt:z.string().datetime().nullable().default(null),actionReceipt:actionReceiptSchema.optional(),actionGuard:z.string().max(30000).optional(),actionScope:z.enum(['all','personal','work']).optional()});

export const studySessionSchema=z.object({
 id:z.string().min(1).max(100),at:z.string().datetime(),resourceId:z.string().max(100),lessonId:z.string().max(100),resourceTitle:z.string().max(250),lessonTitle:z.string().max(250),
 minutes:z.number().int().min(1).max(600),plannedMinutes:z.number().int().min(1).max(600),completed:z.boolean(),timeSource:z.enum(['logged','estimated']),timerSeconds:z.number().int().min(0).max(86400),
 difficulty:z.enum(['unknown','easy','stretch','stuck']),reflection:z.string().max(1000),goal:z.string().max(120),focusGoal:z.string().max(120),
 recommended:z.object({resourceId:z.string().max(100),lessonId:z.string().max(100),resourceTitle:z.string().max(250),lessonTitle:z.string().max(250),reason:z.string().max(300)}).nullable(),
 verdict:z.enum(['aligned','detour','unplanned']),summary:z.string().max(2000),nextStep:z.string().max(1000),
 aiStatus:z.enum(['off','queued','ready','error']).default('off'),aiError:z.string().max(500).default(''),reply:coachReplySchema.nullable().default(null)
});
export type StudySession=z.infer<typeof studySessionSchema>;

export const dailyCoachReplySchema=z.object({headline:z.string().min(1).max(180),assessment:z.string().min(1).max(5000),nextAction:z.string().min(1).max(1200),checkpoint:z.string().max(2400),question:z.string().max(500)});
export const dailyReviewRequestVersion=2;
export const dailyCoachReviewSchema=z.object({id:z.string().min(1).max(160),day:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),timezone:z.string().max(100),at:z.string().datetime(),source:z.enum(['phone','web']),activitySignature:z.string().max(100),snapshotAt:z.string().datetime(),requestVersion:z.number().int().min(1).max(100).default(1),reply:dailyCoachReplySchema});
export type DailyCoachReview=z.infer<typeof dailyCoachReviewSchema>;

export const coachStateSchema=z.object({contextVersion:z.number().int().min(0).max(1).default(0),contextMode:z.enum(['automatic','selected']).default('automatic'),dailyEnabled:z.boolean().default(true),dailyReviews:z.array(dailyCoachReviewSchema).max(60).default([]),tone:z.enum(['direct','balanced']).default('direct'),useScreenTime:z.boolean().default(true),memories:z.array(coachMemorySchema).max(40).refine(a=>new Set(a.map(x=>x.id)).size===a.length,'Duplicate memory IDs').default([]),autoReviews:z.boolean().default(false),sessions:z.array(studySessionSchema).max(120).default([]),memory:z.object({learningIntent:z.string().max(1000).default(''),preferences:z.string().max(1000).default('')}).default({}),conversations:z.array(z.object({id:z.string().min(1).max(100),title:z.string().min(1).max(100),createdAt:z.string().datetime(),contextSelection:z.object({workspace:z.enum(['all','personal','work']),inboxIds:z.array(z.string().min(1).max(100)).max(8)}).optional(),messages:z.array(coachMessageSchema).max(40)})).max(8).default([]),todayPlan:z.object({day:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),minutes:z.number().int().min(1).max(480),lessonIds:z.array(z.string().min(1).max(100)).max(12)}).nullable().default(null)}).default({});
export type CoachReply=z.infer<typeof coachReplySchema>;
export type CoachMessage=z.infer<typeof coachMessageSchema>;
