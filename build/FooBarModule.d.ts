import type { DependencyManager, FeatureRegistry, Module } from '@aries-framework/core';
import { FooBarApi } from './FooBarApi';
export declare class FooBarModule implements Module {
    readonly api: typeof FooBarApi;
    /**
     * Registers the dependencies of the question answer module on the dependency manager.
     */
    register(dependencyManager: DependencyManager, featureRegistry: FeatureRegistry): void;
}
