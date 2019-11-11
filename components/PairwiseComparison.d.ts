import { Contactable, Statement, PairwiseVote } from 'rsf-types';
import { NofloComponent } from '../libs/noflo-types';
declare const coreLogic: (contactables: Contactable[], statements: Statement[], choice: string, maxTime: number, pairwiseVoteCb?: (pairwiseVote: PairwiseVote) => void, maxResponsesText?: string, allCompletedText?: string, timeoutText?: string, invalidResponseText?: string) => Promise<PairwiseVote[]>;
declare const getComponent: () => NofloComponent;
export { coreLogic, getComponent };
