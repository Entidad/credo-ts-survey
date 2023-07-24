import { EventEmitter, inject, injectable, InjectionSymbols, Repository, StorageService } from '@aries-framework/core'

import { QuestionnairenaireSubmissionRecord } from './QuestionnairenaireSubmissionRecord'

@injectable()
export class QuestionnairenaireSubmissionRepository extends Repository<QuestionnairenaireSubmissionRecord> {
  public constructor(
    @inject(InjectionSymbols.StorageService) storageService: StorageService<QuestionnairenaireSubmissionRecord>,
    eventEmitter: EventEmitter
  ) {
    super(QuestionnairenaireSubmissionRecord, storageService, eventEmitter)
  }
}
