import { Contactable, Statement } from 'rsf-types';
import { NofloComponent } from '../libs/noflo-types';
declare const coreLogic: (contactables: Contactable[], maxResponses: number, maxTime: number, prompt: string, statementCb?: (statement: Statement) => void, maxResponsesText?: string, allCompletedText?: string, timeoutText?: string) => Promise<Statement[]>;
declare const getComponent: () => NofloComponent;
export { coreLogic, getComponent };
