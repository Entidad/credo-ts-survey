/**
 * FooBar states inferred from RFC 0113.
 *
 * @see https://github.com/hyperledger/aries-rfcs/blob/main/features/0113-question-answer/README.md
 */
export enum FooBarState {
  FooSent = 'question-sent',
  FooReceived = 'question-received',
  BarReceived = 'answer-received',
  BarSent = 'answer-sent',
}
