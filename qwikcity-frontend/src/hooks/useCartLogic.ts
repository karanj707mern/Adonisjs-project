import {
  component$,
  useStore,
  useVisibleTask$,
  useTask$,
} from "@builder.io/qwik";
import { useNavigate } from "@builder.io/qwik-city";
import {
  useCurrentUser,
  getCartItems,
  addCartItem,
  removeCartItem,
  updateCartItemQuantity,
  clearCart,
  notifyCartChanged,
  getWishlistItems,
  removeWishlistItem,
  notifyWishlistChanged,
} from "~/lib/storage";
import { getStoreSettings } from "~/lib/api/settings";
import { createOrder, previewCheckout } from "~/lib/api/order";
import { toast } from "~/lib/toast";

export interface CartItem {
  id: string | number;
  product: Record<string, unknown>;
  quantity: number;
  [key: string]: unknown;
}

export interface AddressForm {
  recipientName: string;
  phoneNumber: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  [key: string]: unknown;
}

export interface StoreSettings {
  shippingCharge: number;
  expressShippingCharge: number;
  sameDayShippingCharge: number;
  codCharge: number;
  handlingCharge: number;
  taxRate: number;
  freeShippingThreshold: number | null;
  shippingOptions: Array<{
    key: string;
    label: string;
    amount: number;
    etaDays: number;
  }>;
}

export interface UseCartLogicResult {
  items: CartItem[];
  error: string;
  placing: boolean;
  savedAddresses: Record<string, unknown>[];
  selectedAddressId: string;
  storeSettings: StoreSettings;
  selectedShippingType: string;
  selectedPaymentMethod: string;
  addingToCartId: string | number | null;
  promoCode: string;
  pricingPreview: Record<string, unknown> | null;
  addressForm: AddressForm;
  previewSubtotal: number;
  discount: number;
  previewShipping: number;
  previewHandling: number;
  previewCodCharge: number;
  previewTax: number;
  total: number;
  canCheckout: boolean;
  itemCount: number;
  subtotal: number;
  qualifiesForFreeShipping: boolean;
  shipping: number;
  handling: number;
  codCharge: number;
  tax: number;
  wishlistItems: Record<string, unknown>[];
  filteredWishlistItems: Record<string, unknown>[];
  isLoggedIn: boolean;
  setError: (v: string) => void;
  setPromoCode: (v: string) => void;
  setSelectedShippingType: (v: string) => void;
  setSelectedPaymentMethod: (v: string) => void;
  handleAddToCart$: (product: Record<string, unknown>) => Promise<void>;
  handleRemoveWishlistItem$: (productId: string | number) => Promise<void>;
  handleQuantityChange$: (
    itemId: string | number,
    nextQuantity: number,
  ) => Promise<void>;
  handleRemoveItem$: (
    itemId: string | number,
    itemName: string,
  ) => Promise<void>;
  handleClearCart$: () => Promise<void>;
  handleCheckout$: () => Promise<void>;
  handleAddressChange$: (name: string, value: string) => void;
  handleSavedAddressSelect$: (nextId: string) => void;
  selectedShippingOption: Record<string, unknown>;
  resetCheckoutDetails: () => void;
  currentUser: Record<string, unknown> | null;
}

const DEFAULT_ADDRESS_FORM: AddressForm = {
  recipientName: "",
  phoneNumber: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "India",
};

export function useCartLogic(): UseCartLogicResult {
  const nav = useNavigate();
  const userStore = useCurrentUser();
  const currentUser =
    (userStore.user as Record<string, unknown> | null) ?? null;
  const isLoggedIn = Boolean(currentUser?.id);

  const store = useStore<{
    items: CartItem[];
    error: string;
    placing: boolean;
    savedAddresses: Record<string, unknown>[];
    selectedAddressId: string;
    storeSettings: StoreSettings;
    selectedShippingType: string;
    selectedPaymentMethod: string;
    addingToCartId: string | number | null;
    promoCode: string;
    pricingPreview: Record<string, unknown> | null;
    addressForm: AddressForm;
    previewSubtotal: number;
    discount: number;
    previewShipping: number;
    previewHandling: number;
    previewCodCharge: number;
    previewTax: number;
    total: number;
    canCheckout: boolean;
    itemCount: number;
    subtotal: number;
    qualifiesForFreeShipping: boolean;
    shipping: number;
    handling: number;
    codCharge: number;
    tax: number;
    wishlistItems: Record<string, unknown>[];
  }>({
    items: [],
    error: "",
    placing: false,
    savedAddresses: [],
    selectedAddressId: "",
    storeSettings: {
      shippingCharge: 99,
      expressShippingCharge: 149,
      sameDayShippingCharge: 249,
      codCharge: 25,
      handlingCharge: 20,
      taxRate: 0,
      freeShippingThreshold: null,
      shippingOptions: [],
    },
    selectedShippingType: "standard",
    selectedPaymentMethod: "online",
    addingToCartId: null,
    promoCode: "",
    pricingPreview: null,
    addressForm: { ...DEFAULT_ADDRESS_FORM },
    previewSubtotal: 0,
    discount: 0,
    previewShipping: 0,
    previewHandling: 0,
    previewCodCharge: 0,
    previewTax: 0,
    total: 0,
    canCheckout: false,
    itemCount: 0,
    subtotal: 0,
    qualifiesForFreeShipping: false,
    shipping: 0,
    handling: 0,
    codCharge: 0,
    tax: 0,
    wishlistItems: [],
  });

  const redirectToAuth = () => {
    nav(
      "/auth?from=" +
        encodeURIComponent("/cart") +
        "&authMessage=" +
        encodeURIComponent("Sign in to view your cart."),
    );
  };

  useVisibleTask$(() => {
    const refresh = () => {
      store.items = getCartItems() as CartItem[];
    };
    refresh();
    const onCart = () => refresh();
    window.addEventListener("moringa:cart-changed", onCart as EventListener);
    window.addEventListener("storage", onCart as EventListener);
    return () => {
      window.removeEventListener(
        "moringa:cart-changed",
        onCart as EventListener,
      );
      window.removeEventListener("storage", onCart as EventListener);
    };
  });

  useVisibleTask$(({ cleanup }) => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const schedule = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        if (store.error) {
          store.error = "";
        }
      }, 5000);
    };
    schedule();
    return () => {
      if (timer) clearTimeout(timer);
    };
  });

  useVisibleTask$(() => {
    (async () => {
      try {
        const settings = await getStoreSettings();
        store.storeSettings = settings as StoreSettings;
      } catch {
        // keep defaults
      }
      try {
        store.wishlistItems = getWishlistItems();
      } catch {
        store.wishlistItems = [];
      }
    })();
  });

  useVisibleTask$(({ cleanup }) => {
    const onWishlist = () => {
      store.wishlistItems = getWishlistItems();
    };
    window.addEventListener(
      "moringa:wishlist-changed",
      onWishlist as EventListener,
    );
    window.addEventListener("storage", onWishlist as EventListener);
    cleanup(() => {
      window.removeEventListener(
        "moringa:wishlist-changed",
        onWishlist as EventListener,
      );
      window.removeEventListener("storage", onWishlist as EventListener);
    });
  });

  useTask$(({ track }) => {
    const items = track(() => store.items);
    const af = track(() => store.addressForm);
    const st = track(() => store.selectedShippingType);
    const pm = track(() => store.selectedPaymentMethod);
    const pc = track(() => store.promoCode);
    const ss = track(() => store.storeSettings);
    const pl = track(() => store.placing);

    const itemCount = items.reduce((t, i) => t + (i.quantity || 0), 0);
    const subtotal = items.reduce(
      (t, i) => t + (Number(i.product.price) || 0) * (i.quantity || 0),
      0,
    );
    const freeThreshold = ss.freeShippingThreshold;
    const qualifiesForFreeShipping =
      freeThreshold !== null &&
      freeThreshold !== undefined &&
      subtotal >= freeThreshold;
    const selectedOption = ss.shippingOptions.find((o) => o.key === st) ||
      ss.shippingOptions[0] || {
        key: "standard",
        label: "Standard Delivery",
        amount: ss.shippingCharge || 0,
        etaDays: 4,
      };
    const shipping =
      items.length === 0 || qualifiesForFreeShipping
        ? 0
        : Number(selectedOption.amount) || 0;
    const handling = items.length === 0 ? 0 : Number(ss.handlingCharge) || 0;
    const codCharge =
      items.length === 0 || pm !== "cod" ? 0 : Number(ss.codCharge) || 0;
    const tax = subtotal * ((Number(ss.taxRate) || 0) / 100);

    store.itemCount = itemCount;
    store.subtotal = subtotal;
    store.qualifiesForFreeShipping = qualifiesForFreeShipping;
    store.shipping = shipping;
    store.handling = handling;
    store.codCharge = codCharge;
    store.tax = tax;

    const hasRequiredFields =
      af.recipientName.trim() !== "" &&
      af.phoneNumber.trim() !== "" &&
      af.addressLine1.trim() !== "" &&
      af.city.trim() !== "" &&
      af.state.trim() !== "" &&
      af.postalCode.trim() !== "" &&
      af.country.trim() !== "";

    store.canCheckout = items.length > 0 && hasRequiredFields && !pl;
  });

  useTask$(async ({ track }) => {
    const af = track(() => store.addressForm);
    const len = track(() => store.items.length);
    const pc = track(() => store.promoCode);
    const pm = track(() => store.selectedPaymentMethod);
    const st = track(() => store.selectedShippingType);
    const can = track(() => store.canCheckout);

    if (len === 0 || !can) {
      store.pricingPreview = null;
      store.previewSubtotal = store.subtotal;
      store.discount = 0;
      store.previewShipping = store.shipping;
      store.previewHandling = store.handling;
      store.previewCodCharge = store.codCharge;
      store.previewTax = store.tax;
      store.total =
        store.subtotal +
        store.shipping +
        store.handling +
        store.codCharge +
        store.tax;
      return;
    }

    await new Promise((r) => setTimeout(r, 350));

    try {
      const data = (await previewCheckout({
        ...af,
        shippingType: st,
        paymentMethod: pm,
        promoCode: pc.trim() || undefined,
      })) as Record<string, unknown>;
      store.pricingPreview = data;
      store.previewSubtotal = Number(data.subtotal ?? store.subtotal);
      store.discount = Number(data.discountAmount ?? 0);
      store.previewShipping = Number(data.shippingAmount ?? store.shipping);
      store.previewHandling = Number(data.handlingAmount ?? store.handling);
      store.previewCodCharge = Number(data.codAmount ?? store.codCharge);
      store.previewTax = Number(data.taxAmount ?? store.tax);
      store.total = Number(
        data.total ??
          store.subtotal +
            store.shipping +
            store.handling +
            store.codCharge +
            store.tax,
      );
      store.error = "";
    } catch (err) {
      store.pricingPreview = null;
      store.error =
        (err as Error).message || "Could not apply checkout pricing.";
    }
  });

  const selectedShippingOption = store.storeSettings.shippingOptions.find(
    (o) => o.key === store.selectedShippingType,
  ) ||
    store.storeSettings.shippingOptions[0] || {
      key: "standard",
      label: "Standard Delivery",
      amount: store.storeSettings.shippingCharge || 0,
      etaDays: 4,
    };

  const filteredWishlistItems = store.wishlistItems.filter(
    (item) => !store.items.some((cartItem) => cartItem.id === item.id),
  );

  const handleAddToCart = async (product: Record<string, unknown>) => {
    const productId = product.id as string | number;
    if ((currentUser as Record<string, unknown> | null)?.role === "ADMIN") {
      toast.error(
        "Admin accounts cannot add products to cart or place orders.",
      );
      return;
    }
    if ((product.stock as number) <= 0) {
      toast.error("This item is currently out of stock.");
      return;
    }
    if (store.addingToCartId === productId) return;

    store.addingToCartId = productId;
    try {
      const updatedCart = await addCartItem({ id: productId, quantity: 1 });
      store.items = updatedCart as unknown as CartItem[];
      notifyCartChanged();
      store.error = "";
      toast.success(`${product.name as string} was added to your cart.`);
    } catch (err) {
      store.error = (err as Error).message || "Could not add item to cart.";
    } finally {
      store.addingToCartId = null;
    }
  };

  const handleRemoveWishlistItem = async (productId: string | number) => {
    try {
      await removeWishlistItem(productId);
      store.wishlistItems = store.wishlistItems.filter(
        (item) => item.id !== productId,
      );
      notifyWishlistChanged();
      toast.info("Removed from your wishlist.");
    } catch {
      // ignore
    }
  };

  const handleQuantityChange = async (
    itemId: string | number,
    nextQuantity: number,
  ) => {
    try {
      const updatedItemsRaw = await updateCartItemQuantity(
        itemId,
        nextQuantity,
      );
      const updatedItems = Array.isArray(updatedItemsRaw)
        ? (updatedItemsRaw as CartItem[])
        : [];
      store.items = updatedItems;
      notifyCartChanged();
      store.error = "";
    } catch (err) {
      if ((err as Error & { status: number }).status === 401) {
        redirectToAuth();
        return;
      }
      store.error = (err as Error).message || "Could not update cart item.";
    }
  };

  const handleRemoveItem = async (
    itemId: string | number,
    itemName: string,
  ) => {
    try {
      const updatedItemsRaw = await removeCartItem(itemId);
      const updatedItems = Array.isArray(updatedItemsRaw)
        ? (updatedItemsRaw as CartItem[])
        : [];
      store.items = updatedItems;
      notifyCartChanged();
      if (updatedItems.length === 0) {
        store.pricingPreview = null;
      }
      store.error = "";
      toast.info(`${itemName} was removed from your cart.`);
    } catch (err) {
      if ((err as Error & { status: number }).status === 401) {
        redirectToAuth();
        return;
      }
      store.error = (err as Error).message || "Could not remove cart item.";
    }
  };

  const handleClearCart = async () => {
    try {
      await clearCart();
      store.items = [];
      notifyCartChanged();
      store.pricingPreview = null;
      store.error = "";
      toast.info("Your cart has been cleared.");
    } catch (err) {
      if ((err as Error & { status: number }).status === 401) {
        redirectToAuth();
        return;
      }
      store.error = (err as Error).message || "Could not clear your cart.";
    }
  };

  const handleCheckout = async () => {
    if (store.items.length === 0) {
      store.error = "Add at least one item before checkout.";
      return;
    }
    if (!store.canCheckout) {
      store.error = "Complete the shipping address before continuing.";
      return;
    }
    if ((currentUser as Record<string, unknown> | null)?.role === "ADMIN") {
      store.error = "Admin accounts cannot place orders.";
      return;
    }
    if (!currentUser) {
      redirectToAuth();
      return;
    }

    const orderPayload = {
      ...store.addressForm,
      shippingType: store.selectedShippingType,
      paymentMethod: store.selectedPaymentMethod,
      promoCode: store.promoCode.trim() || undefined,
    };

    store.placing = true;
    try {
      if (store.selectedPaymentMethod === "cod") {
        const order = (await createOrder(orderPayload)) as Record<
          string,
          unknown
        >;
        store.error = "";
        clearCart();
        store.items = [];
        notifyCartChanged();
        store.pricingPreview = null;
        toast.success(
          `${order.orderTitle as string} placed successfully. Order number ${order.orderNumber as string}.`,
        );
        setTimeout(() => {
          nav(
            "/orders?orderMessage=" +
              encodeURIComponent(
                `${order.orderTitle as string} placed successfully. Order number ${order.orderNumber as string}.`,
              ),
          );
        }, 100);
        return;
      }

      const session = (await createOrder(orderPayload)) as Record<
        string,
        unknown
      >;
      store.error = "";

      const { useRazorpayPayment } = await import("./useRazorpayPayment");
      const { processCheckout } = useRazorpayPayment();

      const result = await processCheckout({
        orderPayload,
        currentUser,
        router: { push: nav.bind(null) },
      });

      if (!result.success && result.error) {
        store.error = result.error;
      }
    } catch (err) {
      if ((err as Error & { status: number }).status === 401) {
        redirectToAuth();
        return;
      }
      store.error = (err as Error).message || "Could not place your order.";
    } finally {
      store.placing = false;
    }
  };

  const handleAddressChange = (name: string, value: string) => {
    store.addressForm[name] = value;
  };

  const handleSavedAddressSelect = (nextId: string) => {
    store.selectedAddressId = nextId;
    const selected = store.savedAddresses.find(
      (address) => String(address.id) === nextId,
    );
    if (!selected) return;
    store.addressForm = {
      recipientName:
        (selected.recipientName as string) ?? store.addressForm.recipientName,
      phoneNumber:
        (selected.phoneNumber as string) ?? store.addressForm.phoneNumber,
      addressLine1:
        (selected.addressLine1 as string) ?? store.addressForm.addressLine1,
      addressLine2:
        (selected.addressLine2 as string) ?? store.addressForm.addressLine2,
      city: (selected.city as string) ?? store.addressForm.city,
      state: (selected.state as string) ?? store.addressForm.state,
      postalCode:
        (selected.postalCode as string) ?? store.addressForm.postalCode,
      country: (selected.country as string) ?? store.addressForm.country,
    };
  };

  const resetCheckoutDetails = () => {
    store.selectedAddressId = "";
    store.selectedShippingType = "standard";
    store.selectedPaymentMethod = "online";
    store.promoCode = "";
    store.pricingPreview = null;
    store.addressForm = { ...DEFAULT_ADDRESS_FORM };
  };

  return {
    items: store.items,
    error: store.error,
    placing: store.placing,
    savedAddresses: store.savedAddresses,
    selectedAddressId: store.selectedAddressId,
    storeSettings: store.storeSettings,
    selectedShippingType: store.selectedShippingType,
    selectedPaymentMethod: store.selectedPaymentMethod,
    addingToCartId: store.addingToCartId,
    promoCode: store.promoCode,
    pricingPreview: store.pricingPreview,
    addressForm: store.addressForm,
    previewSubtotal: store.previewSubtotal,
    discount: store.discount,
    previewShipping: store.previewShipping,
    previewHandling: store.previewHandling,
    previewCodCharge: store.previewCodCharge,
    previewTax: store.previewTax,
    total: store.total,
    canCheckout: store.canCheckout,
    itemCount: store.itemCount,
    subtotal: store.subtotal,
    qualifiesForFreeShipping: store.qualifiesForFreeShipping,
    shipping: store.shipping,
    handling: store.handling,
    codCharge: store.codCharge,
    tax: store.tax,
    wishlistItems: store.wishlistItems,
    filteredWishlistItems,
    isLoggedIn,
    setError: (v: string) => {
      store.error = v;
    },
    setPromoCode: (v: string) => {
      store.promoCode = v;
    },
    setSelectedShippingType: (v: string) => {
      store.selectedShippingType = v;
    },
    setSelectedPaymentMethod: (v: string) => {
      store.selectedPaymentMethod = v;
    },
    handleAddToCart$: handleAddToCart,
    handleRemoveWishlistItem$: handleRemoveWishlistItem,
    handleQuantityChange$: handleQuantityChange,
    handleRemoveItem$: handleRemoveItem,
    handleClearCart$: handleClearCart,
    handleCheckout$: handleCheckout,
    handleAddressChange$: handleAddressChange,
    handleSavedAddressSelect$: handleSavedAddressSelect,
    selectedShippingOption,
    resetCheckoutDetails,
    currentUser,
  };
}
