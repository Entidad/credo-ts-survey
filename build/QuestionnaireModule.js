"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuestionnaireModule = void 0;
const core_1 = require("@aries-framework/core");
const core_2 = require("@aries-framework/core");
const QuestionnaireApi_1 = require("./QuestionnaireApi");
const QuestionnaireRole_1 = require("./QuestionnaireRole");
const repository_1 = require("./repository");
const services_1 = require("./services");
class QuestionnaireModule {
    constructor() {
        this.api = QuestionnaireApi_1.QuestionnaireApi;
    }
    /**
     * Registers the dependencies of the question answer module on the dependency manager.
     */
    register(dependencyManager, featureRegistry) {
        //entidad
        dependencyManager
            .resolve(core_1.AgentConfig)
            .logger.warn("The '@entidad/questionnaire' module is experimental and could have unexpected breaking changes. When using this module, make sure to use strict versions for all @entidad packages.");
        // Api
        dependencyManager.registerContextScoped(QuestionnaireApi_1.QuestionnaireApi);
        // Services
        dependencyManager.registerSingleton(services_1.QuestionnaireService);
        // Repositories
        dependencyManager.registerSingleton(repository_1.QuestionnaireRepository);
        // Feature Registry
        featureRegistry.register(new core_2.Protocol({
            id: 'https://didcomm.org/questionnaire/1.0',
            roles: [QuestionnaireRole_1.QuestionnaireRole.Questioner, QuestionnaireRole_1.QuestionnaireRole.Responder],
        }));
    }
}
exports.QuestionnaireModule = QuestionnaireModule;
//# sourceMappingURL=QuestionnaireModule.js.map