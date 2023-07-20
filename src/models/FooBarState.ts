/**
 * FooBar states inferred from RFC 0113.
 *
 * @see https://github.com/hyperledger/aries-rfcs/blob/main/features/0113-foo-bar/README.md
 */
export enum FooBarState {
  QuestionSent = 'foo-sent',
  QuestionReceived = 'foo-received',
  AnswerReceived = 'bar-received',
  AnswerSent = 'bar-sent',
}
