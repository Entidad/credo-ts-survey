import type { DependencyManager, FeatureRegistry, Module } from '@aries-framework/core'

import { Protocol } from '@aries-framework/core'

import { QuestionnairenaireSubmissionApi } from './QuestionnairenaireSubmissionApi'
import { QuestionnairenaireSubmissionRole } from './QuestionnairenaireSubmissionRole'
import { QuestionnairenaireSubmissionRepository } from './repository'
import { QuestionnairenaireSubmissionService } from './services'

export class QuestionnairenaireSubmissionModule implements Module {
  public readonly api = QuestionnairenaireSubmissionApi

  /**
   * Registers the dependencies of the question answer module on the dependency manager.
   */
  public register(dependencyManager: DependencyManager, featureRegistry: FeatureRegistry) {
    // Api
    dependencyManager.registerContextScoped(QuestionnairenaireSubmissionApi)

    // Services
    dependencyManager.registerSingleton(QuestionnairenaireSubmissionService)

    // Repositories
    dependencyManager.registerSingleton(QuestionnairenaireSubmissionRepository)

    // Feature Registry
    featureRegistry.register(
      new Protocol({
        id: 'https://didcomm.org/questionanswer/1.0',
        roles: [QuestionnairenaireSubmissionRole.Questionnaireer, QuestionnairenaireSubmissionRole.Responder],
      })
    )
  }
}
