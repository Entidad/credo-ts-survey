import type { DependencyManager, FeatureRegistry } from '@aries-framework/core'

import { Protocol } from '@aries-framework/core'

import {
  QuestionnaireApi,
  QuestionnaireModule,
  QuestionnaireRepository,
  QuestionnaireRole,
  QuestionnaireService,
} from '@aries-framework/question-answer'

const dependencyManager = {
  registerInstance: jest.fn(),
  registerSingleton: jest.fn(),
  registerContextScoped: jest.fn(),
} as unknown as DependencyManager

const featureRegistry = {
  register: jest.fn(),
} as unknown as FeatureRegistry

describe('QuestionnaireModule', () => {
  test('registers dependencies on the dependency manager', () => {
    const questionnaireModule = new QuestionnaireModule()
    questionnaireModule.register(dependencyManager, featureRegistry)

    expect(dependencyManager.registerContextScoped).toHaveBeenCalledTimes(1)
    expect(dependencyManager.registerContextScoped).toHaveBeenCalledWith(QuestionnaireApi)

    expect(dependencyManager.registerSingleton).toHaveBeenCalledTimes(2)
    expect(dependencyManager.registerSingleton).toHaveBeenCalledWith(QuestionnaireService)
    expect(dependencyManager.registerSingleton).toHaveBeenCalledWith(QuestionnaireRepository)

    expect(featureRegistry.register).toHaveBeenCalledTimes(1)
    expect(featureRegistry.register).toHaveBeenCalledWith(
      new Protocol({
        id: 'https://didcomm.org/questionanswer/1.0',
        roles: [QuestionnaireRole.Questioner, QuestionnaireRole.Responder],
      })
    )
  })
})
