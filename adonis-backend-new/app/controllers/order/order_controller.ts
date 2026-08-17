import type { HttpContext } from '@adonisjs/core/http';
import { inject } from '@adonisjs/fold';
import OrderService from './order_service';
import {
  createOrderValidator,
  verifyPaymentValidator,
  updateOrderValidator,
  refundOrderValidator,
  createOrderIssueValidator,
  updateOrderIssueValidator,
  queryOrderValidator,
} from './order_validators';

@inject()
export default class OrderController {
  constructor(private orderService: OrderService) {}

  async createCheckoutSession(ctx: HttpContext) {
    const userId = (ctx.auth as any)?.user?.id as number;
    const data = await ctx.request.validateUsing(createOrderValidator);
    return this.orderService.createCheckoutSession(userId, data as any);
  }

  async preview(ctx: HttpContext) {
    const userId = (ctx.auth as any)?.user?.id as number;
    const data = await ctx.request.validateUsing(createOrderValidator);
    return this.orderService.previewCheckout(userId, data as any);
  }

  async create(ctx: HttpContext) {
    const userId = (ctx.auth as any)?.user?.id as number;
    const data = await ctx.request.validateUsing(createOrderValidator);
    return this.orderService.create(userId, data as any);
  }

  async verifyPayment(ctx: HttpContext) {
    const userId = (ctx.auth as any)?.user?.id as number;
    const data = await ctx.request.validateUsing(verifyPaymentValidator);
    return this.orderService.verifyPayment(
      userId,
      data.orderId,
      data.razorpayOrderId,
      data.razorpayPaymentId,
      data.razorpaySignature,
    );
  }

  async handleRazorpayWebhook(ctx: HttpContext) {
    const signature = ctx.request.header('x-razorpay-signature');
    const rawBody = (ctx.request as any).rawBody;
    return this.orderService.handleRazorpayWebhook(rawBody, signature);
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
    return this.orderService.createIssue(userId, id, data as any);
  }

  async update(ctx: HttpContext) {
    const id = Number(ctx.request.param('id'));
    const data = await ctx.request.validateUsing(updateOrderValidator);
    return this.orderService.update(id, data as any);
  }

  async updateIssue(ctx: HttpContext) {
    const issueId = Number(ctx.request.param('issueId'));
    const data = await ctx.request.validateUsing(updateOrderIssueValidator);
    return this.orderService.updateIssue(issueId, data as any);
  }

  async refundOrder(ctx: HttpContext) {
    const id = Number(ctx.request.param('id'));
    const data = await ctx.request.validateUsing(refundOrderValidator);
    return this.orderService.refundOrder(id, data as any);
  }

  async remove(ctx: HttpContext) {
    const userId = (ctx.auth as any)?.user?.id as number;
    const id = Number(ctx.request.param('id'));
    return this.orderService.remove(userId, id);
  }

  async track(ctx: HttpContext) {
    const userId = (ctx.auth as any)?.user?.id as number | undefined;
    const id = Number(ctx.request.param('id'));
    return this.orderService.trackOrder(id, userId);
  }
}
