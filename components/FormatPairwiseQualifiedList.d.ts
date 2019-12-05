import { PairwiseQualified } from 'rsf-types';
import { NofloComponent } from '../libs/noflo-types';
declare const coreLogic: (list: PairwiseQualified[], anonymize: boolean) => string;
declare const getComponent: () => NofloComponent;
export { coreLogic, getComponent };
