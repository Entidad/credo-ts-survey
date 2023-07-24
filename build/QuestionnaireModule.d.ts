import type { DependencyManager, FeatureRegistry, Module } from '@aries-framework/core';
import { QuestionnaireApi } from './QuestionnaireApi';
export declare class QuestionnaireModule implements Module {
    readonly api: typeof QuestionnaireApi;
    /**
     * Registers the dependencies of the question answer module on the dependency manager.
     */
    register(dependencyManager: DependencyManager, featureRegistry: FeatureRegistry): void;
}
