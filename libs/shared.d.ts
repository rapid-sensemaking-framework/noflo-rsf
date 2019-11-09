declare const DEFAULT_ALL_COMPLETED_TEXT = "Everyone has completed. Thanks for participating.";
declare const DEFAULT_TIMEOUT_TEXT = "The max time has been reached. Stopping now. Thanks for participating.";
declare const DEFAULT_INVALID_RESPONSE_TEXT = "That's not a valid response, please try again.";
declare const DEFAULT_MAX_RESPONSES_TEXT = "You've responded to everything. Thanks for participating. You will be notified when everyone has completed.";
declare const rulesText: (maxTime: any) => string;
declare const whichToInit: (contactableConfigs: any) => any;
declare const timer: (ms: any) => Promise<unknown>;
declare const collectFromContactables: (contactables: any[], maxTime: number, validate: (msg: string) => boolean, onInvalid: (msg: string, contactable: any) => void, isPersonalComplete: (personalResultsSoFar: any[]) => boolean, onPersonalComplete: (personalResultsSoFar: any[], contactable: any) => void, convertToResult: (msg: string, personalResultsSoFar: any[], contactable: any) => any, onResult: (result: any, personalResultsSoFar: any[], contactable: any) => void, isTotalComplete: (allResultsSoFar: any[]) => boolean) => Promise<{
    timeoutComplete: boolean;
    results: any[];
}>;
export { DEFAULT_ALL_COMPLETED_TEXT, DEFAULT_INVALID_RESPONSE_TEXT, DEFAULT_MAX_RESPONSES_TEXT, DEFAULT_TIMEOUT_TEXT, rulesText, whichToInit, timer, collectFromContactables };
