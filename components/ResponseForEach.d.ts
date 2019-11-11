import { Contactable, Statement, Option, Reaction } from 'rsf-types';
import { NofloComponent } from '../libs/noflo-types';
declare const coreLogic: (contactables: Contactable[], statements: Statement[], options: Option[], maxTime: number, reactionCb?: (reaction: Reaction) => void, maxResponsesText?: string, allCompletedText?: string, timeoutText?: string, invalidResponseText?: string) => Promise<Reaction[]>;
declare const getComponent: () => NofloComponent;
export { coreLogic, getComponent };
