import { Contactable, Statement, PairwiseVote } from 'rsf-types';
declare const coreLogic: (contactables: Contactable[], statements: Statement[], choice: string, maxTime: number, pairwiseVoteCb?: (pairwiseVote: PairwiseVote) => void, maxResponsesText?: string, allCompletedText?: string, timeoutText?: string, invalidResponseText?: string) => Promise<PairwiseVote[]>;
declare const getComponent: () => any;
export { coreLogic, getComponent };
