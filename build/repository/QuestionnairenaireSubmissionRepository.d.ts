import { EventEmitter, Repository, StorageService } from '@aries-framework/core';
import { QuestionnairenaireSubmissionRecord } from './QuestionnairenaireSubmissionRecord';
export declare class QuestionnairenaireSubmissionRepository extends Repository<QuestionnairenaireSubmissionRecord> {
    constructor(storageService: StorageService<QuestionnairenaireSubmissionRecord>, eventEmitter: EventEmitter);
}
