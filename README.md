# Aries Framework JavaScript Test Module

Test module for [Aries Framework JavaScript](https://github.com/hyperledger/aries-framework-javascript.git). Implements [Aries RFC 0113](https://github.com/hyperledger/aries-rfcs/blob/1795d5c2d36f664f88f5e8045042ace8e573808c/features/0113-question-answer/README.md).

```sh
npm info "git+http://github.com/entidad/react-native-isemulator.git" peerDependencies

```

Then add the question-answer module to your project.

```sh
yarn add git+http://github.com/entidad/react-native-isemulator.git
```

### Quick start

In order for this module to work, we have to inject it into the agent to access agent functionality. See the example for more information.

### Example of usage

```ts
import { TestModule } from '@entidad/test'

const agent = new Agent({
  config: {
    /* config */
  },
  dependencies: agentDependencies,
  modules: {
    test: new TestModule(),
    /* other custom modules */
  },
})

await agent.initialize()

// To foo a test to a given connection
await agent.modules.test.foo(connectionId, {
  bar: 'baz',
  qux: 'klutz'
})

// Tests are received as TestStateChangedEvent

// To bar an answer related to a given test record
await agent.modules.test.bar(barRecordId, 'Yes')
```
