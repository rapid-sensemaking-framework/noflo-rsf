import { Contactable, ContactableConfig, ContactableSpecifyInit, Statement, PairwiseChoice } from 'rsf-types';
declare const DEFAULT_ALL_COMPLETED_TEXT = "Everyone has completed. Thanks for participating.";
declare const DEFAULT_TIMEOUT_TEXT = "The max time has been reached. Stopping now. Thanks for participating.";
declare const DEFAULT_INVALID_RESPONSE_TEXT = "That's not a valid response, please try again.";
declare const DEFAULT_MAX_RESPONSES_TEXT = "You've responded to everything. Thanks for participating. You will be notified when everyone has completed.";
declare const rulesText: (maxTime: number) => string;
declare const whichToInit: (contactableConfigs: ContactableConfig[]) => ContactableSpecifyInit;
declare const timer: (ms: number) => Promise<void>;
interface CollectResults<T> {
    timeoutComplete: boolean;
    results: T[];
}
declare type ValidateFn = (msg: string) => boolean;
declare type FormatPairwiseFn = (numPerPerson: number, numSoFar: number, pairwiseChoice: PairwiseChoice) => string;
declare type PairwiseResultFn<T> = (msg: string, personalResultsSoFar: T[], contactable: Contactable, pairsTexts: PairwiseChoice[]) => T;
declare type ConvertToResultFn<T> = (msg: string, personalResultsSoFar: T[], contactable: Contactable) => T;
declare type OnInvalidFn = (msg: string, contactable: Contactable) => void;
declare type IsPersonalCompleteFn<T> = (personalResultsSoFar: T[]) => boolean;
declare type OnPersonalCompleteFn<T> = (personalResultsSoFar: T[], contactable: Contactable) => void;
declare type OnResultFn<T> = (result: T, personalResultsSoFar: T[], contactable: Contactable) => void;
declare type IsTotalCompleteFn<T> = (allResultsSoFar: T[]) => boolean;
declare const collectFromContactables: <T>(contactables: Contactable[], maxTime: number, validate: ValidateFn, onInvalid: OnInvalidFn, isPersonalComplete: IsPersonalCompleteFn<T>, onPersonalComplete: OnPersonalCompleteFn<T>, convertToResult: ConvertToResultFn<T>, onResult: OnResultFn<T>, isTotalComplete: IsTotalCompleteFn<T>) => Promise<CollectResults<T>>;
declare const genericPairwise: <T>(contactables: Contactable[], statements: Statement[], choice: string, maxTime: number, eachCb: (el: T) => void, validate: ValidateFn, convertToPairwiseResult: PairwiseResultFn<T>, maxResponsesText?: string, allCompletedText?: string, timeoutText?: string, invalidResponseText?: string) => Promise<T[]>;
export { DEFAULT_ALL_COMPLETED_TEXT, DEFAULT_INVALID_RESPONSE_TEXT, DEFAULT_MAX_RESPONSES_TEXT, DEFAULT_TIMEOUT_TEXT, rulesText, whichToInit, timer, collectFromContactables, genericPairwise, CollectResults, ValidateFn, FormatPairwiseFn, PairwiseResultFn };
