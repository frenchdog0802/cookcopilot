import { Module } from '@nestjs/common';
import { PantryItemsController } from './pantry-items.controller';
import { PantryItemsService } from './pantry-items.service';

@Module({
  controllers: [PantryItemsController],
  providers: [PantryItemsService],
  exports: [PantryItemsService],
})
export class PantryItemsModule {}
