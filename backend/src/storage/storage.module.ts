// ── storage.module.ts ─────────────────────────────────────
import { Module, Global } from '@nestjs/common';
import { StorageService } from './storage.service';

// Global — щоб не імпортувати в кожен модуль окремо
@Global()
@Module({
  providers: [StorageService],
  exports:   [StorageService],
})
export class StorageModule {}
