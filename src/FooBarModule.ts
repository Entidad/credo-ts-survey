import type { DependencyManager, FeatureRegistry, Module } from '@aries-framework/core'

import { Protocol } from '@aries-framework/core'

import { FooBarApi } from './FooBarApi'
import { FooBarRole } from './FooBarRole'
import { FooBarRepository } from './repository'
import { FooBarService } from './services'

export class FooBarModule implements Module {
  public readonly api = FooBarApi

  /**
   * Registers the dependencies of the foo bar module on the dependency manager.
   */
  public register(dependencyManager: DependencyManager, featureRegistry: FeatureRegistry) {
    // Api
    dependencyManager.registerContextScoped(FooBarApi)

    // Services
    dependencyManager.registerSingleton(FooBarService)

    // Repositories
    dependencyManager.registerSingleton(FooBarRepository)

    // Feature Registry
    featureRegistry.register(
      new Protocol({
        id: 'https://didcomm.org/foobar/1.0',
        roles: [FooBarRole.Fooer, FooBarRole.Responder],
      })
    )
  }
}
