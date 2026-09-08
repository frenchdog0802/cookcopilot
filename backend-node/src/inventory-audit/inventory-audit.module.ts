import { Module } from '@nestjs/common';
import { InventoryAuditService } from './inventory-audit.service';

@Module({
  providers: [InventoryAuditService],
  exports: [InventoryAuditService],
})
export class InventoryAuditModule {}
