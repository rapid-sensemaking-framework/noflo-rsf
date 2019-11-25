import { NofloComponent } from '../libs/noflo-types';
import { Contactable } from 'rsf-types';
declare const coreLogic: (contactables: Contactable[], message: string) => Promise<void[]>;
declare const getComponent: () => NofloComponent;
export { coreLogic, getComponent };
