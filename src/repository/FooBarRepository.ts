import { EventEmitter, inject, injectable, InjectionSymbols, Repository, StorageService } from '@aries-framework/core'

import { FooBarRecord } from './FooBarRecord'

@injectable()
export class FooBarRepository extends Repository<FooBarRecord> {
  public constructor(
    @inject(InjectionSymbols.StorageService) storageService: StorageService<FooBarRecord>,
    eventEmitter: EventEmitter
  ) {
    super(FooBarRecord, storageService, eventEmitter)
  }
}
