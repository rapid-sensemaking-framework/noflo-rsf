import { Contactable, Statement, PairwiseQuantified } from 'rsf-types';
import { NofloComponent } from '../libs/noflo-types';
declare const coreLogic: (contactables: Contactable[], statements: Statement[], question: string, maxTime: number, eachCb: (pairwiseQuantified: PairwiseQuantified) => void, maxResponsesText: string, allCompletedText: string, timeoutText: string, invalidResponseText: string) => Promise<PairwiseQuantified[]>;
declare const getComponent: () => NofloComponent;
export { coreLogic, getComponent };
