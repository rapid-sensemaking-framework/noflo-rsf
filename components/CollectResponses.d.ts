declare const coreLogic: (contactables: any, maxResponses: any, maxTime: any, prompt: any, statementCb?: (newResult: any) => void, maxResponsesText?: string, allCompletedText?: string, timeoutText?: string) => Promise<any[]>;
declare const getComponent: () => any;
export { coreLogic, getComponent };
