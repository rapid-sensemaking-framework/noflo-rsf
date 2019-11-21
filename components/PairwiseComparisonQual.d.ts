import { Contactable, Statement, PairwiseQualified } from 'rsf-types';
import { NofloComponent } from '../libs/noflo-types';
declare const coreLogic: (contactables: Contactable[], statements: Statement[], choice: string, maxTime: number, eachCb: (pairwiseQualified: PairwiseQualified) => void, maxResponsesText: string, allCompletedText: string, timeoutText: string, invalidResponseText: string) => Promise<PairwiseQualified[]>;
declare const getComponent: () => NofloComponent;
export { coreLogic, getComponent };
