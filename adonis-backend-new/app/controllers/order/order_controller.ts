import type { HttpContext } from '@adonisjs/core/http';
import { inject } from '@adonisjs/fold';
import OrderService from './order_service';
import SocketNotifier from '#services/socket_notifier';
import {
  createOrderValidator,
  verifyPaymentValidator,
  updateOrderValidator,
  refundOrderValidator,
  createOrderIssueValidator,
  updateOrderIssueValidator,
  queryOrderValidator,
} from './order_validators';

export default class OrderController {
  constructor(
    private orderService: OrderService,
    @inject('SocketNotifier') private socketNotifier: SocketNotifier,
  ) {}

  private async emitOrderUpdated(orderId: number): Promise<void> {
    try {
      this.socketNotifier.emitOrderUpdated({ id: orderId });
    } catch {
      // ignore socket emit failures
    }
  }

  async createCheckoutSession(ctx: HttpContext) {
    const userId = (ctx.auth as any)?.user?.id as number;
    const data = await ctx.request.validateUsing(createOrderValidator);
    const result = await this.orderService.createCheckoutSession(
      userId,
      data as any,
    );
    if (result?.orderId) {
      await this.emitOrderUpdated(result.orderId as number);
    }
    return result;
  }

  async preview(ctx: HttpContext) {
    const userId = (ctx.auth as any)?.user?.id as number;
    const data = await ctx.request.validateUsing(createOrderValidator);
    return this.orderService.previewCheckout(userId, data as any);
  }

  async create(ctx: HttpContext) {
    const userId = (ctx.auth as any)?.user?.id as number;
    const data = await ctx.request.validateUsing(createOrderValidator);
    const result = await this.orderService.create(userId, data as any);
    if (result?.id) {
      await this.emitOrderUpdated(result.id as number);
    }
    return result;
  }

  async verifyPayment(ctx: HttpContext) {
    const userId = (ctx.auth as any)?.user?.id as number;
    const data = await ctx.request.validateUsing(verifyPaymentValidator);
    const result = await this.orderService.verifyPayment(
      userId,
      data.orderId,
      data.razorpayOrderId,
      data.razorpayPaymentId,
      data.razorpaySignature,
    );
    if (result?.success && result.orderId) {
      await this.emitOrderUpdated(result.orderId as number);
    }
    return result;
  }

  async handleRazorpayWebhook(ctx: HttpContext) {
    const signature = ctx.request.header('x-razorpay-signature');
    const rawBody = (ctx.request as any).rawBody;
    const result = await this.orderService.handleRazorpayWebhook(
      rawBody,
      signature,
    );
    if (result?.orderId) {
      await this.emitOrderUpdated(result.orderId as number);
    }
    return result;
  }

  async findMyOrders(ctx: HttpContext) {
    const userId = (ctx.auth as any)?.user?.id as number;
    const query = await ctx.request.validateUsing(queryOrderValidator);
    return this.orderService.findAllWithQuery(userId, query as any);
  }

  async findAdminOrders(ctx: HttpContext) {
    const query = await ctx.request.validateUsing(queryOrderValidator);
    return this.orderService.findAdminOrders(query as any);
  }

  async findOpenOrders(ctx: HttpContext) {
    return this.orderService.findOpenOrders();
  }

  async findCancelledOrders(ctx: HttpContext) {
    return this.orderService.findCancelledOrders();
  }

  async findAdminIssues(ctx: HttpContext) {
    return this.orderService.findAdminIssues();
  }

  async findOne(ctx: HttpContext) {
    const userId = (ctx.auth as any)?.user?.id as number;
    const id = Number(ctx.request.param('id'));
    return this.orderService.findOne(userId, id);
  }

  async getInvoice(ctx: HttpContext) {
    const userId = (ctx.auth as any)?.user?.id as number;
    const id = Number(ctx.request.param('id'));
    return this.orderService.getInvoice(userId, id);
  }

  async createIssue(ctx: HttpContext) {
    const userId = (ctx.auth as any)?.user?.id as number;
    const id = Number(ctx.request.param('id'));
    const data = await ctx.request.validateUsing(createOrderIssueValidator);
    const result = await this.orderService.createIssue(userId, id, data as any);
    await this.emitOrderUpdated(id);
    return result;
  }

  async update(ctx: HttpContext) {
    const id = Number(ctx.request.param('id'));
    const data = await ctx.request.validateUsing(updateOrderValidator);
    const result = await this.orderService.update(id, data as any);
    if (result?.id) {
      await this.emitOrderUpdated(result.id as number);
    }
    return result;
  }

  async updateIssue(ctx: HttpContext) {
    const issueId = Number(ctx.request.param('issueId'));
    const data = await ctx.request.validateUsing(updateOrderIssueValidator);
    const issue = await this.orderService.updateIssue(issueId, data as any);
    if (issue?.order?.id) {
      await this.emitOrderUpdated(issue.order.id as number);
    }
    return issue;
  }

  async refundOrder(ctx: HttpContext) {
    const id = Number(ctx.request.param('id'));
    const data = await ctx.request.validateUsing(refundOrderValidator);
    const result = await this.orderService.refundOrder(id, data as any);
    if (result?.id) {
      await this.emitOrderUpdated(result.id as number);
    }
    return result;
  }

  async remove(ctx: HttpContext) {
    const userId = (ctx.auth as any)?.user?.id as number;
    const id = Number(ctx.request.param('id'));
    const result = await this.orderService.remove(userId, id);
    if (result?.id) {
      await this.emitOrderUpdated(result.id as number);
    }
    return result;
  }

  async track(ctx: HttpContext) {
    const userId = (ctx.auth as any)?.user?.id as number | undefined;
    const id = Number(ctx.request.param('id'));
    return this.orderService.trackOrder(id, userId);
  }
}
