"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FooBarModule = void 0;
const core_1 = require("@aries-framework/core");
const FooBarApi_1 = require("./FooBarApi");
const FooBarRole_1 = require("./FooBarRole");
const repository_1 = require("./repository");
const services_1 = require("./services");
class FooBarModule {
    constructor() {
        this.api = FooBarApi_1.FooBarApi;
    }
    /**
     * Registers the dependencies of the question answer module on the dependency manager.
     */
    register(dependencyManager, featureRegistry) {
        // Api
        dependencyManager.registerContextScoped(FooBarApi_1.FooBarApi);
        // Services
        dependencyManager.registerSingleton(services_1.FooBarService);
        // Repositories
        dependencyManager.registerSingleton(repository_1.FooBarRepository);
        // Feature Registry
        featureRegistry.register(new core_1.Protocol({
            id: 'https://didcomm.org/questionanswer/1.0',
            roles: [FooBarRole_1.FooBarRole.Fooer, FooBarRole_1.FooBarRole.Responder],
        }));
    }
}
exports.FooBarModule = FooBarModule;
//# sourceMappingURL=FooBarModule.js.map