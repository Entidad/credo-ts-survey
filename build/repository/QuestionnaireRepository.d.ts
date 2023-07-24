import { EventEmitter, Repository, StorageService } from '@aries-framework/core';
import { QuestionnaireRecord } from './QuestionnaireRecord';
export declare class QuestionnaireRepository extends Repository<QuestionnaireRecord> {
    constructor(storageService: StorageService<QuestionnaireRecord>, eventEmitter: EventEmitter);
}
