import type { DependencyManager, FeatureRegistry } from '@aries-framework/core'

import { Protocol } from '@aries-framework/core'

import {
  FooBarApi,
  FooBarModule,
  FooBarRepository,
  FooBarRole,
  FooBarService,
} from '@aries-framework/question-answer'

const dependencyManager = {
  registerInstance: jest.fn(),
  registerSingleton: jest.fn(),
  registerContextScoped: jest.fn(),
} as unknown as DependencyManager

const featureRegistry = {
  register: jest.fn(),
} as unknown as FeatureRegistry

describe('FooBarModule', () => {
  test('registers dependencies on the dependency manager', () => {
    const questionBarModule = new FooBarModule()
    questionBarModule.register(dependencyManager, featureRegistry)

    expect(dependencyManager.registerContextScoped).toHaveBeenCalledTimes(1)
    expect(dependencyManager.registerContextScoped).toHaveBeenCalledWith(FooBarApi)

    expect(dependencyManager.registerSingleton).toHaveBeenCalledTimes(2)
    expect(dependencyManager.registerSingleton).toHaveBeenCalledWith(FooBarService)
    expect(dependencyManager.registerSingleton).toHaveBeenCalledWith(FooBarRepository)

    expect(featureRegistry.register).toHaveBeenCalledTimes(1)
    expect(featureRegistry.register).toHaveBeenCalledWith(
      new Protocol({
        id: 'https://didcomm.org/questionanswer/1.0',
        roles: [FooBarRole.Fooer, FooBarRole.Responder],
      })
    )
  })
})
