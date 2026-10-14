import {z} from 'zod';

export const coachSuggestionSchema=z.object({resourceId:z.string().min(1).max(100),priority:z.number().int().min(1).max(5),focusModule:z.string().max(200),reason:z.string().max(700)});
export const coachPlanSchema=z.object({minutes:z.number().int().min(1).max(480),lessonIds:z.array(z.string().min(1).max(100)).min(1).max(12),reason:z.string().max(700)});
export const coachReplySchema=z.object({message:z.string().min(1).max(4000),question:z.string().max(500).default(''),suggestions:z.array(coachSuggestionSchema).max(12),todayPlan:coachPlanSchema.nullable().default(null)});
export const coachMessageSchema=z.object({id:z.string().min(1).max(100),role:z.enum(['user','assistant']),text:z.string().min(1).max(6000),at:z.string().datetime(),source:z.enum(['learner','smart','ai']),context:z.string().max(2000).default(''),reply:coachReplySchema.nullable().default(null),appliedAt:z.string().datetime().nullable().default(null)});
export const coachStateSchema=z.object({memory:z.object({learningIntent:z.string().max(1000).default(''),preferences:z.string().max(1000).default('')}).default({}),conversations:z.array(z.object({id:z.string().min(1).max(100),title:z.string().min(1).max(100),createdAt:z.string().datetime(),messages:z.array(coachMessageSchema).max(40)})).max(8).default([]),todayPlan:z.object({day:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),minutes:z.number().int().min(1).max(480),lessonIds:z.array(z.string().min(1).max(100)).max(12)}).nullable().default(null)}).default({});
export type CoachReply=z.infer<typeof coachReplySchema>;
export type CoachMessage=z.infer<typeof coachMessageSchema>;
