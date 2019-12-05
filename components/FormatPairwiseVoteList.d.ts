import { PairwiseVote } from 'rsf-types';
import { NofloComponent } from '../libs/noflo-types';
declare const coreLogic: (list: PairwiseVote[], anonymize: boolean) => string;
declare const getComponent: () => NofloComponent;
export { coreLogic, getComponent };
