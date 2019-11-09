import { Contactable, Statement } from 'rsf-types';
declare const coreLogic: (contactables: Contactable[], maxResponses: number, maxTime: number, prompt: string, statementCb?: (statement: Statement) => void, maxResponsesText?: string, allCompletedText?: string, timeoutText?: string) => Promise<Statement[]>;
declare const getComponent: () => any;
export { coreLogic, getComponent };
