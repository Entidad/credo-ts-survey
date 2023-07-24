"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuestionnaireModule = void 0;
const core_1 = require("@aries-framework/core");
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
        // Api
        dependencyManager.registerContextScoped(QuestionnaireApi_1.QuestionnaireApi);
        // Services
        dependencyManager.registerSingleton(services_1.QuestionnaireService);
        // Repositories
        dependencyManager.registerSingleton(repository_1.QuestionnaireRepository);
        // Feature Registry
        featureRegistry.register(new core_1.Protocol({
            id: 'https://didcomm.org/questionanswer/1.0',
            roles: [QuestionnaireRole_1.QuestionnaireRole.Questioner, QuestionnaireRole_1.QuestionnaireRole.Responder],
        }));
    }
}
exports.QuestionnaireModule = QuestionnaireModule;
//# sourceMappingURL=QuestionnaireModule.js.map