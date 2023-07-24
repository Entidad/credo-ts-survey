import type { DependencyManager, FeatureRegistry } from '@aries-framework/core'

import { Protocol } from '@aries-framework/core'

import {
  QuestionnairenaireSubmissionApi,
  QuestionnairenaireSubmissionModule,
  QuestionnairenaireSubmissionRepository,
  QuestionnairenaireSubmissionRole,
  QuestionnairenaireSubmissionService,
} from '@aries-framework/question-answer'

const dependencyManager = {
  registerInstance: jest.fn(),
  registerSingleton: jest.fn(),
  registerContextScoped: jest.fn(),
} as unknown as DependencyManager

const featureRegistry = {
  register: jest.fn(),
} as unknown as FeatureRegistry

describe('QuestionnairenaireSubmissionModule', () => {
  test('registers dependencies on the dependency manager', () => {
    const questionSubmissionModule = new QuestionnairenaireSubmissionModule()
    questionSubmissionModule.register(dependencyManager, featureRegistry)

    expect(dependencyManager.registerContextScoped).toHaveBeenCalledTimes(1)
    expect(dependencyManager.registerContextScoped).toHaveBeenCalledWith(QuestionnairenaireSubmissionApi)

    expect(dependencyManager.registerSingleton).toHaveBeenCalledTimes(2)
    expect(dependencyManager.registerSingleton).toHaveBeenCalledWith(QuestionnairenaireSubmissionService)
    expect(dependencyManager.registerSingleton).toHaveBeenCalledWith(QuestionnairenaireSubmissionRepository)

    expect(featureRegistry.register).toHaveBeenCalledTimes(1)
    expect(featureRegistry.register).toHaveBeenCalledWith(
      new Protocol({
        id: 'https://didcomm.org/questionanswer/1.0',
        roles: [QuestionnairenaireSubmissionRole.Questionnaireer, QuestionnairenaireSubmissionRole.Responder],
      })
    )
  })
})
