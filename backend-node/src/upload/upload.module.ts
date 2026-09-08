import { Module } from '@nestjs/common';
import { UsageQuotaModule } from '../usage-quota/usage-quota.module';
import { CloudinaryService } from './cloudinary.service';
import { UploadController } from './upload.controller';

@Module({
  imports: [UsageQuotaModule],
  controllers: [UploadController],
  providers: [CloudinaryService],
  exports: [CloudinaryService],
})
export class UploadModule {}
