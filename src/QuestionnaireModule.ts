import type { DependencyManager, FeatureRegistry, Module } from '@credo-ts/core'
import { AgentConfig } from '@credo-ts/core'

import { Protocol } from '@credo-ts/core'

import { QuestionnaireApi } from './QuestionnaireApi'
import { QuestionnaireRole } from './QuestionnaireRole'
import { QuestionnaireRepository } from './repository'
import { QuestionnaireService } from './services'

export class QuestionnaireModule implements Module {
  public readonly api = QuestionnaireApi

  /**
   * Registers the dependencies of the question answer module on the dependency manager.
   */
  public register(dependencyManager: DependencyManager, featureRegistry: FeatureRegistry) {
	//entidad
    dependencyManager
      .resolve(AgentConfig)
      .logger.warn(
        "The '@entidad/questionnaire' module is experimental and could have unexpected breaking changes. When using this module, make sure to use strict versions for all @entidad packages."
      )
    // Api
    dependencyManager.registerContextScoped(QuestionnaireApi)

    // Services
    dependencyManager.registerSingleton(QuestionnaireService)

    // Repositories
    dependencyManager.registerSingleton(QuestionnaireRepository)

    // Feature Registry
    featureRegistry.register(
      new Protocol({
        id: 'https://didcomm.org/questionnaire/1.0',
        roles: [QuestionnaireRole.Questioner, QuestionnaireRole.Responder],
      })
    )
  }
}
