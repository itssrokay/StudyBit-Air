import {mergeLearningStates} from './sync.ts';
import {parseLibrary,type LearningState} from './learning.ts';
/**
 * A save lost a revision race (Wi-Fi sync, another tab, or the Android background
 * daily review wrote first). Instead of refusing every later edit, fold both copies
 * together: records added on either side are kept, deletions are respected, and on a
 * genuine same-field conflict this device's newer edit wins.
 */
export function rebaseLocalEdits(base:LearningState|null,local:LearningState,remote:LearningState):LearningState{
 try{return mergeLearningStates(base,local,remote,'phone').state;}
 catch{return parseLibrary(local);}
}
