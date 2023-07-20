/**
 * FooBar states inferred from RFC 0113.
 *
 * @see https://github.com/hyperledger/aries-rfcs/blob/main/features/0113-foo-bar/README.md
 */
export enum FooBarState {
  FooSent = 'foo-sent',
  FooReceived = 'foo-received',
  BarReceived = 'bar-received',
  BarSent = 'bar-sent',
}
