import { Contactable, ContactableConfig } from 'rsf-types';
declare const DEFAULT_ALL_COMPLETED_TEXT = "Everyone has completed. Thanks for participating.";
declare const DEFAULT_TIMEOUT_TEXT = "The max time has been reached. Stopping now. Thanks for participating.";
declare const DEFAULT_INVALID_RESPONSE_TEXT = "That's not a valid response, please try again.";
declare const DEFAULT_MAX_RESPONSES_TEXT = "You've responded to everything. Thanks for participating. You will be notified when everyone has completed.";
declare const rulesText: (maxTime: any) => string;
declare const whichToInit: (contactableConfigs: ContactableConfig[]) => {};
declare const timer: (ms: number) => Promise<void>;
declare const collectFromContactables: <T>(contactables: Contactable[], maxTime: number, validate: (msg: string) => boolean, onInvalid: (msg: string, contactable: Contactable) => void, isPersonalComplete: (personalResultsSoFar: T[]) => boolean, onPersonalComplete: (personalResultsSoFar: T[], contactable: Contactable) => void, convertToResult: (msg: string, personalResultsSoFar: T[], contactable: Contactable) => T, onResult: (result: any, personalResultsSoFar: T[], contactable: Contactable) => void, isTotalComplete: (allResultsSoFar: T[]) => boolean) => Promise<{
    timeoutComplete: boolean;
    results: T[];
}>;
export { DEFAULT_ALL_COMPLETED_TEXT, DEFAULT_INVALID_RESPONSE_TEXT, DEFAULT_MAX_RESPONSES_TEXT, DEFAULT_TIMEOUT_TEXT, rulesText, whichToInit, timer, collectFromContactables };
