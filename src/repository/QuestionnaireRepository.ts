import { EventEmitter, inject, injectable, InjectionSymbols, Repository, StorageService } from '@aries-framework/core'

import { QuestionnaireRecord } from './QuestionnaireRecord'

@injectable()
export class QuestionnaireRepository extends Repository<QuestionnaireRecord> {
  public constructor(
    @inject(InjectionSymbols.StorageService) storageService: StorageService<QuestionnaireRecord>,
    eventEmitter: EventEmitter
  ) {
    super(QuestionnaireRecord, storageService, eventEmitter)
  }
}
