import {z} from 'zod';
const day=z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const weekTargetSchema=z.object({
 id:z.string().min(1).max(100),
 kind:z.enum(['minutes','days','sessions','lessons','readings']),
 label:z.string().trim().min(1).max(160),
 target:z.number().int().min(1).max(6000),
 resourceId:z.string().max(100).default(''),
});
export const weekAnswersSchema=z.object({
 goal:z.string().trim().max(200).default(''),why:z.string().trim().max(400).default(''),deadline:day.or(z.literal('')).default(''),
 hoursPerWeek:z.number().min(0.5).max(60).default(4),days:z.number().int().min(1).max(7).default(5),
 level:z.enum(['new','some','solid']).default('some'),focusResourceId:z.string().max(100).default(''),
});
export const weeklyPlanSchema=z.object({
 id:z.string().min(1).max(100),workspace:z.enum(['personal','work']).default('personal'),
 weekStart:day,title:z.string().trim().min(1).max(120),summary:z.string().max(1200).default(''),
 source:z.enum(['coach','rules','ai']).default('rules'),createdAt:z.string().datetime(),
 targets:z.array(weekTargetSchema).min(1).max(6),answers:weekAnswersSchema.default({}),
});
export type WeekTarget=z.infer<typeof weekTargetSchema>;
export type WeekAnswers=z.infer<typeof weekAnswersSchema>;
export type WeeklyPlan=z.infer<typeof weeklyPlanSchema>;
