import { Body, Controller, Get, Headers, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { ok } from '../common/api-response';
import { BadRequestError } from '../common/errors/http-errors';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import {
  CreateCheckoutRequestDto,
  SyncPurchaseRequestDto,
  ValidateReceiptRequestDto,
} from './dto/subscription.dto';
import { StripeSubscriptionService } from './stripe-subscription.service';
import { SubscriptionService } from './subscription.service';

type RawBodyRequest = Request & { rawBody?: Buffer };

@Controller('api/subscription')
export class SubscriptionController {
  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly stripeSubscriptionService: StripeSubscriptionService,
  ) {}

  @Public()
  @Get('plans')
  getPlans() {
    return ok(this.subscriptionService.getPlansCatalog());
  }

  @Get('status')
  async getStatus(@CurrentUser() userId: string) {
    return ok(await this.subscriptionService.getStatus(userId));
  }

  @Post('sync')
  async syncPurchase(
    @CurrentUser() userId: string,
    @Body() request: SyncPurchaseRequestDto,
  ) {
    const status = await this.subscriptionService.syncPurchase(userId, request);
    return ok({ success: true, status });
  }

  @Post('validate-receipt')
  async validateReceipt(
    @CurrentUser() userId: string,
    @Body() request: ValidateReceiptRequestDto,
  ) {
    return ok(await this.subscriptionService.validateReceipt(userId, request));
  }

  @Post('checkout')
  async createCheckout(
    @CurrentUser() userId: string,
    @Body() request: CreateCheckoutRequestDto,
  ) {
    return ok(
      await this.stripeSubscriptionService.createCheckoutSession(
        userId,
        request.billingPeriod,
      ),
    );
  }

  @Public()
  @Post('webhook')
  async handleWebhook(
    @Req() req: RawBodyRequest,
    @Headers('stripe-signature') signature?: string,
  ) {
    if (!req.rawBody) {
      throw new BadRequestError('Missing Stripe webhook payload');
    }
    await this.stripeSubscriptionService.handleWebhook(req.rawBody, signature);
    return ok(null);
  }
}
