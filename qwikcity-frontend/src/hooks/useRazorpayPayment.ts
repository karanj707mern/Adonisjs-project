import { useSignal } from "@builder.io/qwik";
import { createCheckoutSession, verifyPayment } from "~/lib/api/order";
import { toast } from "~/lib/toast";

export interface PaymentResult {
  success: boolean;
  error?: string;
}

interface ProcessCheckoutParams {
  orderPayload: Record<string, unknown>;
  currentUser: Record<string, unknown> | null;
  router: {
    push: (url: string) => void;
  };
}

export function useRazorpayPayment() {
  const loading = useSignal(false);

  const loadRazorpayScript = async (): Promise<void> => {
    if (
      typeof window !== "undefined" &&
      (window as unknown as { Razorpay: unknown }).Razorpay
    ) {
      return Promise.resolve();
    }

    if (typeof window === "undefined") {
      throw new Error("Could not load Razorpay checkout.");
    }

    const existingScript = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]',
    );

    if (existingScript) {
      return new Promise<void>((resolve, reject) => {
        existingScript.addEventListener(
          "load",
          () => resolve(),
          { once: true },
        );
        existingScript.addEventListener(
          "error",
          () => reject(new Error("Could not load Razorpay checkout.")),
          { once: true },
        );
      });
    }

    return new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () =>
        reject(new Error("Could not load Razorpay checkout."));
      document.body.appendChild(script);
    });
  };

  const processCheckout = async ({
    orderPayload,
    currentUser,
    router,
  }: ProcessCheckoutParams): Promise<PaymentResult> => {
    let session: Record<string, unknown> | null = null;
    let checkoutOpened = false;
    let paymentCompleted = false;

    try {
      loading.value = true;

      if (orderPayload.paymentMethod === "cod") {
        const order = (await createCheckoutSession(orderPayload)) as Record<
          string,
          unknown
        >;
        toast.success(
          `${order.orderTitle as string} placed successfully. Order number ${order.orderNumber as string}.`,
        );
        setTimeout(() => {
          router.push(
            "/orders?orderMessage=" +
              encodeURIComponent(
                `${order.orderTitle as string} placed successfully. Order number ${order.orderNumber as string}.`,
              ),
          );
        }, 100);
        return { success: true };
      }

      session = (await createCheckoutSession(orderPayload)) as Record<
        string,
        unknown
      >;

      await loadRazorpayScript();

      if (!session?.key || !session?.razorpayOrderId) {
        throw new Error("Razorpay checkout details were incomplete.");
      }

      const options = {
        key: session.key as string,
        amount: session.amount as number,
        currency: session.currency as string,
        order_id: session.razorpayOrderId as string,
        name: "Moringa Store",
        description: "Secure order payment",
        notes: {
          orderNumber: session.orderNumber,
        },
        handler: async function (response: Record<string, string>) {
          try {
            const checkoutSession = session as Record<string, unknown>;
            await verifyPayment({
              orderId: checkoutSession.orderId as string,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            router.push(
              `/orders?payment=success&orderId=${checkoutSession.orderId as string}&orderNumber=${encodeURIComponent(checkoutSession.orderNumber as string)}`,
            );
            paymentCompleted = true;
          } catch (err) {
            return {
              success: false,
              error: (err as Error).message || "Payment verification failed.",
            };
          }
        },
        prefill: {
          name: (orderPayload.recipientName as string) ||
            (currentUser?.name as string) ||
            "",
          email: currentUser?.email as string,
          contact: orderPayload.phoneNumber as string,
        },
        modal: {
          ondismiss: async () => {
            if (paymentCompleted) {
              return;
            }

            try {
              const { cancelOrder } = await import("~/lib/api/order");
              await cancelOrder(session!.orderId as string | number);
              toast.info("Payment was cancelled. Your cart is still available.");
            } catch (dismissError) {
              return {
                success: false,
                error: (dismissError as Error).message,
              };
            }
          },
        },
        theme: {
          color: "#0f5132",
        },
      };

      const RazorpayConstructor = (
        window as unknown as {
          Razorpay: new (options: unknown) => {
            on: (
              event: string,
              handler: (response: Record<string, unknown>) => void,
            ) => void;
            open: () => void;
          };
        }
      ).Razorpay;
      const rzp = new RazorpayConstructor(options);
      rzp.on("payment.failed", async (response: Record<string, unknown>) => {
        const failureDescription =
          (response?.error as Record<string, string>)?.description ||
          (response?.error as Record<string, string>)?.reason ||
          "Payment failed before it could be completed.";

        try {
          if ((session as Record<string, unknown> | null)?.orderId) {
            const { cancelOrder } = await import("~/lib/api/order");
            await cancelOrder(
              (session as Record<string, unknown>).orderId as string | number,
            );
          }
        } catch {
          // Ignore cleanup failures
        }

        return { success: false, error: failureDescription };
      });
      checkoutOpened = true;
      rzp.open();
      return { success: true };
    } catch (err) {
      if (session?.orderId && !checkoutOpened) {
        try {
          const { cancelOrder } = await import("~/lib/api/order");
          await cancelOrder(session.orderId as string | number);
        } catch {
          // Ignore cleanup failures
        }
      }
      if ((err as Error & { status: number }).status === 401) {
        return { success: false, error: "UNAUTHORIZED" };
      }
      return {
        success: false,
        error: (err as Error).message || "Could not place your order.",
      };
    } finally {
      loading.value = false;
    }
  };

  return { processCheckout, loading };
}
