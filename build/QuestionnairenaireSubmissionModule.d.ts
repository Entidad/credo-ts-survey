import type { DependencyManager, FeatureRegistry, Module } from '@aries-framework/core';
import { QuestionnairenaireSubmissionApi } from './QuestionnairenaireSubmissionApi';
export declare class QuestionnairenaireSubmissionModule implements Module {
    readonly api: typeof QuestionnairenaireSubmissionApi;
    /**
     * Registers the dependencies of the question answer module on the dependency manager.
     */
    register(dependencyManager: DependencyManager, featureRegistry: FeatureRegistry): void;
}
