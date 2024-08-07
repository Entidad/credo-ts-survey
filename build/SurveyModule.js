"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SurveyModule = void 0;
const core_1 = require("@credo-ts/core");
const SurveyApi_1 = require("./SurveyApi");
const SurveyRole_1 = require("./SurveyRole");
const repository_1 = require("./repository");
const services_1 = require("./services");
class SurveyModule {
    constructor() {
        this.api = SurveyApi_1.SurveyApi;
    }
    /**
     * Registers the dependencies of the question answer module on the dependency manager.
     */
    register(dependencyManager, featureRegistry) {
        //entidad
        dependencyManager
            .resolve(core_1.AgentConfig)
            .logger.warn("The '@entidad/survey' module is experimental and could have unexpected breaking changes. When using this module, make sure to use strict versions for all @entidad packages.");
        // Api
        dependencyManager.registerContextScoped(SurveyApi_1.SurveyApi);
        // Services
        dependencyManager.registerSingleton(services_1.SurveyService);
        // Repositories
        dependencyManager.registerSingleton(repository_1.SurveyRepository);
        // Feature Registry
        featureRegistry.register(new core_1.Protocol({
            id: 'https://didcomm.org/survey/1.0',
            roles: [SurveyRole_1.SurveyRole.Requester, SurveyRole_1.SurveyRole.Responder],
        }));
    }
}
exports.SurveyModule = SurveyModule;
//# sourceMappingURL=SurveyModule.js.map