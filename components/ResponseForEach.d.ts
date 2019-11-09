import { Contactable, Statement, Option, Reaction } from 'rsf-types';
declare const coreLogic: (contactables: Contactable[], statements: Statement[], options: Option[], maxTime: number, reactionCb?: (reaction: Reaction) => void, maxResponsesText?: string, allCompletedText?: string, timeoutText?: string, invalidResponseText?: string) => Promise<Reaction[]>;
declare const getComponent: () => any;
export { coreLogic, getComponent };
