/**
 * Short, sourced facts about learning, attention and the brain, plus a few quotes
 * with reliable attribution. Numbers were checked against the cited source
 * (Oct 2026); wording avoids overstating single studies. Shown one per day.
 */
export type BrainFact={kind:'fact'|'quote';text:string;source:string;tags:('memory'|'attention'|'phone'|'habit'|'sleep'|'practice'|'brain'|'motivation')[]};
export const BRAIN_FACTS:BrainFact[]=[
 {kind:'fact',text:'Students who practised recalling a passage remembered 61% of it a week later. Students who just re-read it remembered 40%.',source:'Roediger & Karpicke, Psychological Science, 2006',tags:['memory','practice']},
 {kind:'fact',text:'Average attention on one screen fell from about 2.5 minutes in 2003 to about 47 seconds by 2020.',source:'Gloria Mark, UC Irvine (UC Newsroom, 2024)',tags:['attention','phone']},
 {kind:'fact',text:'In a study of almost 800 people, just having your phone on the desk reduced available brainpower, even when it was off and face down. Phones in another room did best.',source:'Ward et al., University of Texas at Austin, 2017',tags:['phone','attention']},
 {kind:'fact',text:'New habits took an average of 66 days to become automatic, anywhere from 18 to 254 days. Missing one day did not ruin the habit.',source:'Lally et al., European Journal of Social Psychology, 2009',tags:['habit']},
 {kind:'fact',text:'People kept awake for 35 hours remembered new images 19% worse on average than rested people, and up to 40% worse.',source:'Walker lab, Nature Neuroscience, 2007 (Harvard Gazette)',tags:['sleep','memory']},
 {kind:'fact',text:'Switching between tasks has a cost: researcher David Meyer estimates the brief mental blocks can eat up to 40% of productive time.',source:'American Psychological Association, “Multitasking: Switching costs”',tags:['attention']},
 {kind:'fact',text:'People’s minds wander 46.9% of their waking hours, and a wandering mind is usually a less happy one.',source:'Killingsworth & Gilbert, Science, 2010',tags:['attention','motivation']},
 {kind:'fact',text:'London taxi drivers who learned the city’s maze of streets had a larger rear hippocampus, and it grew with years on the job. Learning physically shapes the brain.',source:'Maguire et al., PNAS, 2000',tags:['brain','practice']},
 {kind:'fact',text:'Three months of learning to juggle increased grey matter in visual-motion areas, and it shrank again after people stopped practising.',source:'Draganski et al., Nature, 2004',tags:['brain','practice']},
 {kind:'fact',text:'Writing a plan as “If it’s 9 pm, then I open my course” has a medium-to-large effect on actually doing it, across 94 studies.',source:'Gollwitzer & Sheeran, Advances in Experimental Social Psychology, 2006',tags:['habit','motivation']},
 {kind:'fact',text:'Heavy media multitaskers were worse at ignoring distractions and at switching tasks than light multitaskers.',source:'Ophir, Nass & Wagner, PNAS, 2009',tags:['attention','phone']},
 {kind:'fact',text:'Working memory holds only about four chunks at once. That is why one clear next step beats a list of ten.',source:'Cowan, Behavioral and Brain Sciences, 2001',tags:['memory','brain']},
 {kind:'fact',text:'A review of 317 experiments found spreading study sessions out beats cramming, and the longer you need to remember, the bigger the best gap.',source:'Cepeda et al., Psychological Bulletin, 2006',tags:['memory','practice']},
 {kind:'fact',text:'Your brain is about 2% of your body weight but uses about 20% of your resting energy.',source:'Scientific American, “Does Thinking Really Hard Burn More Calories?”',tags:['brain']},
 {kind:'fact',text:'Students who expected to teach a passage, even though they never did, recalled it better than students expecting a test.',source:'Nestojko, Bui, Kornell & Bjork, Memory & Cognition, 2014',tags:['memory','practice']},
 {kind:'fact',text:'Practising recall beat building detailed concept maps for learning science texts, even on questions about connecting ideas.',source:'Karpicke & Blunt, Science, 2011',tags:['memory','practice']},
 {kind:'fact',text:'Mixing different types of practice problems led to far better test scores a week later than practising one type at a time.',source:'Rohrer & Taylor, Instructional Science, 2007',tags:['practice']},
 {kind:'fact',text:'Without review, we forget much of what we learn within days. Ebbinghaus first measured this “forgetting curve” on himself in 1885.',source:'Hermann Ebbinghaus, Memory, 1885',tags:['memory']},
 {kind:'fact',text:'Words you generate yourself are remembered better than words you only read. Making your own answer is part of learning.',source:'Slamecka & Graf, Journal of Experimental Psychology, 1978',tags:['memory','practice']},
 {kind:'fact',text:'In a NASA study, long-haul pilots given a short planned cockpit rest slept about 26 minutes and were more alert afterwards.',source:'Rosekind et al., NASA Technical Memorandum 108839, 1994',tags:['sleep']},
 {kind:'quote',text:'I have no special talents. I am only passionately curious.',source:'Albert Einstein, letter to Carl Seelig, 1952',tags:['motivation']},
 {kind:'quote',text:'The first principle is that you must not fool yourself, and you are the easiest person to fool.',source:'Richard Feynman, “Cargo Cult Science”, 1974',tags:['practice','motivation']},
 {kind:'quote',text:'We are what we repeatedly do. Excellence, then, is not an act, but a habit.',source:'Will Durant, The Story of Philosophy, 1926 (summarising Aristotle)',tags:['habit','motivation']},
 {kind:'quote',text:'How we spend our days is, of course, how we spend our lives.',source:'Annie Dillard, The Writing Life, 1989',tags:['phone','motivation']},
 {kind:'quote',text:'While we teach, we learn.',source:'Seneca, Letters to Lucilius, 7.8',tags:['practice']},
 {kind:'quote',text:'The more that you read, the more things you will know.',source:'Dr. Seuss, I Can Read With My Eyes Shut!, 1978',tags:['motivation']},
 {kind:'quote',text:'Knowing is not enough; we must apply. Willing is not enough; we must do.',source:'Johann Wolfgang von Goethe',tags:['practice','motivation']},
];
/** Same fact all day, a different one tomorrow; optionally prefer a topic. */
export function factOfDay(day:string,prefer?:BrainFact['tags'][number]){
 const seed=[...day].reduce((n,c)=>(n*31+c.charCodeAt(0))>>>0,7);
 const pool=prefer?BRAIN_FACTS.filter(f=>f.tags.includes(prefer)):BRAIN_FACTS;
 return (pool.length?pool:BRAIN_FACTS)[seed%(pool.length||BRAIN_FACTS.length)];
}
