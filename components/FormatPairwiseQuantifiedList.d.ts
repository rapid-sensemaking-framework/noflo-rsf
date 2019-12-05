import { PairwiseQuantified } from 'rsf-types';
import { NofloComponent } from '../libs/noflo-types';
declare const coreLogic: (list: PairwiseQuantified[], anonymize: boolean) => string;
declare const getComponent: () => NofloComponent;
export { coreLogic, getComponent };
