import {uid,type LearningState} from './learning.ts';
import {coachMemorySchema,type memoryProposalSchema} from './coach-schema.ts';
import type {z} from 'zod';
export function remember(state:LearningState,proposal:Pick<z.infer<typeof memoryProposalSchema>,'text'|'kind'>,workspace:'all'|'personal'|'work'='all',source:'manual'|'coach'='manual',now=new Date()):LearningState{
 const memory=coachMemorySchema.parse({id:uid(),...proposal,workspace,source,createdAt:now.toISOString()});
 if(state.coach.memories.some(m=>m.workspace===workspace&&m.text.toLowerCase()===memory.text.toLowerCase()))return state;
 if(state.coach.memories.length>=40)throw Error('Your memory shelf is full. Edit or forget a memory first.');
 return {...state,coach:{...state.coach,memories:[...state.coach.memories,memory]}};
}
export function retrieveMemories(state:LearningState,workspace:'all'|'personal'|'work',query=''){
 const tokens=new Set(query.toLowerCase().match(/[\p{L}\p{N}]{3,}/gu)||[]);
 return state.coach.memories.filter(m=>workspace==='all'||m.workspace==='all'||m.workspace===workspace).map((m,i)=>({memory:m,rank:[...tokens].filter(t=>m.text.toLowerCase().includes(t)).length*100+i})).sort((a,b)=>b.rank-a.rank).slice(0,12).map(x=>x.memory);
}
