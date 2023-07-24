import { EventEmitter, Repository, StorageService } from '@aries-framework/core';
import { FooBarRecord } from './FooBarRecord';
export declare class FooBarRepository extends Repository<FooBarRecord> {
    constructor(storageService: StorageService<FooBarRecord>, eventEmitter: EventEmitter);
}
