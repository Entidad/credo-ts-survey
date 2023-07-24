"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuestionnairenaireSubmissionModule = void 0;
const core_1 = require("@aries-framework/core");
const QuestionnairenaireSubmissionApi_1 = require("./QuestionnairenaireSubmissionApi");
const QuestionnairenaireSubmissionRole_1 = require("./QuestionnairenaireSubmissionRole");
const repository_1 = require("./repository");
const services_1 = require("./services");
class QuestionnairenaireSubmissionModule {
    constructor() {
        this.api = QuestionnairenaireSubmissionApi_1.QuestionnairenaireSubmissionApi;
    }
    /**
     * Registers the dependencies of the question answer module on the dependency manager.
     */
    register(dependencyManager, featureRegistry) {
        // Api
        dependencyManager.registerContextScoped(QuestionnairenaireSubmissionApi_1.QuestionnairenaireSubmissionApi);
        // Services
        dependencyManager.registerSingleton(services_1.QuestionnairenaireSubmissionService);
        // Repositories
        dependencyManager.registerSingleton(repository_1.QuestionnairenaireSubmissionRepository);
        // Feature Registry
        featureRegistry.register(new core_1.Protocol({
            id: 'https://didcomm.org/questionanswer/1.0',
            roles: [QuestionnairenaireSubmissionRole_1.QuestionnairenaireSubmissionRole.Questionnaireer, QuestionnairenaireSubmissionRole_1.QuestionnairenaireSubmissionRole.Responder],
        }));
    }
}
exports.QuestionnairenaireSubmissionModule = QuestionnairenaireSubmissionModule;
//# sourceMappingURL=QuestionnairenaireSubmissionModule.js.map