import {
  Controller,
  Delete,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ok } from '../common/api-response';
import { BadRequestError } from '../common/errors/http-errors';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UsageQuotaService } from '../usage-quota/usage-quota.service';
import { CloudinaryService } from './cloudinary.service';

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

@Controller('api/upload')
export class UploadController {
  constructor(
    private readonly cloudinaryService: CloudinaryService,
    private readonly usageQuotaService: UsageQuotaService,
  ) {}

  @Post('image')
  @UseInterceptors(
    FileInterceptor('image', { limits: { fileSize: MAX_UPLOAD_BYTES } }),
  )
  async uploadImage(
    @CurrentUser() userId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    this.assertValidImage(file);
    await this.usageQuotaService.checkAndIncrementImageUpload(userId);
    const result = await this.cloudinaryService.uploadImage(
      userId,
      file!.buffer,
    );
    return ok({
      imageUrl: result.secure_url,
      publicId: result.public_id,
    });
  }

  @Delete(['image/:publicId', 'image/*publicId'])
  async deleteImage(
    @CurrentUser() userId: string,
    @Param('publicId') publicId: string,
  ) {
    const decoded = decodeURIComponent(publicId);
    await this.cloudinaryService.deleteImage(userId, decoded);
    return ok({ message: 'Image deleted' });
  }

  private assertValidImage(file: Express.Multer.File | undefined): void {
    if (!file?.buffer?.length) {
      throw new BadRequestError('image file is required');
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      throw new BadRequestError('image exceeds 8MB limit');
    }
    if (file.mimetype && !ALLOWED_MIME.has(file.mimetype)) {
      throw new BadRequestError('unsupported image type');
    }
  }
}
