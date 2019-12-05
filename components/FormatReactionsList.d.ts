import { Reaction } from 'rsf-types';
import { NofloComponent } from '../libs/noflo-types';
declare const coreLogic: (reactions: Reaction[], anonymize: boolean) => string;
declare const getComponent: () => NofloComponent;
export { coreLogic, getComponent };
