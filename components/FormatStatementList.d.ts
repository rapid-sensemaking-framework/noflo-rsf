import { NofloComponent } from '../libs/noflo-types';
import { Statement } from 'rsf-types';
declare const coreLogic: (statements: Statement[], anonymize: boolean) => string;
declare const getComponent: () => NofloComponent;
export { getComponent, coreLogic };
