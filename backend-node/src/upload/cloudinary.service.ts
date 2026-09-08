import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Readable } from 'stream';
import { v2 as cloudinary } from 'cloudinary';
import { BadRequestError, NotFoundError } from '../common/errors/http-errors';
import type { AppConfig } from '../config/env.schema';

@Injectable()
export class CloudinaryService implements OnModuleInit {
  private configured = false;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    const appConfig = this.configService.get<AppConfig>('app');
    const cloudName = appConfig?.optional.cloudinaryCloudName;
    const apiKey = appConfig?.optional.cloudinaryApiKey;
    const apiSecret = appConfig?.optional.cloudinaryApiSecret;

    if (cloudName && apiKey && apiSecret) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });
      this.configured = true;
    }
  }

  userFolder(userId: string): string {
    return `users/${userId}`;
  }

  assertOwnedPublicId(userId: string, publicId: string): void {
    const expectedPrefix = `${this.userFolder(userId)}/`;
    if (!publicId.startsWith(expectedPrefix)) {
      throw new NotFoundError('Image not found');
    }
  }

  async uploadImage(
    userId: string,
    file: Buffer,
  ): Promise<{ secure_url: string; public_id: string }> {
    this.ensureConfigured();
    const folder = this.userFolder(userId);
    const result = await new Promise<{
      secure_url: string;
      public_id: string;
    }>((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        { folder },
        (error, uploadResult) => {
          if (error || !uploadResult) {
            reject(
              error instanceof Error
                ? error
                : new Error('Cloudinary upload failed'),
            );
            return;
          }
          resolve({
            secure_url: uploadResult.secure_url,
            public_id: uploadResult.public_id,
          });
        },
      );
      Readable.from(file).pipe(upload);
    });
    return result;
  }

  async uploadImageFromUrl(
    imageUrl: string,
  ): Promise<{ secure_url: string; public_id: string }> {
    this.ensureConfigured();
    const result = await cloudinary.uploader.upload(imageUrl, {
      folder: 'recipe_stock',
    });
    return {
      secure_url: result.secure_url,
      public_id: result.public_id,
    };
  }

  async deleteImage(
    userId: string,
    publicId: string,
  ): Promise<Record<string, unknown>> {
    this.ensureConfigured();
    this.assertOwnedPublicId(userId, publicId);
    const result: unknown = await cloudinary.uploader.destroy(publicId);
    return result as Record<string, unknown>;
  }

  private ensureConfigured(): void {
    if (!this.configured) {
      throw new BadRequestError('Cloudinary is not configured on this server');
    }
  }
}
