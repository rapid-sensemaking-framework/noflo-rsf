const DEFAULT_ALL_COMPLETED_TEXT = `Everyone has completed. Thanks for participating.`
const DEFAULT_TIMEOUT_TEXT = `The max time has been reached. Stopping now. Thanks for participating.`
const DEFAULT_INVALID_RESPONSE_TEXT = `That's not a valid response, please try again.`
const DEFAULT_MAX_RESPONSES_TEXT = `You've responded to everything. Thanks for participating. You will be notified when everyone has completed.`
// TODO: improve the human readable time
const rulesText = (maxTime) => `The process will stop automatically after ${maxTime} milliseconds.`

module.exports = {
    DEFAULT_ALL_COMPLETED_TEXT,
    DEFAULT_INVALID_RESPONSE_TEXT,
    DEFAULT_MAX_RESPONSES_TEXT,
    DEFAULT_TIMEOUT_TEXT,
    rulesText
}