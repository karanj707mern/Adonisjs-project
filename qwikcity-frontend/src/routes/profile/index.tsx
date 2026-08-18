import { component$, useSignal, useStore, useVisibleTask$, $ } from "@builder.io/qwik";
import { useNavigate } from "@builder.io/qwik-city";
import {
  getProfile,
  updateProfile,
  uploadAvatar,
  listUserAddresses,
  createUserAddress,
  updateUserAddress,
  deleteUserAddress,
} from "~/lib/api/auth";
import {
  useCurrentUser,
  setCurrentUser,
  markAuthChecked,
  clearToken,
  markLoggedOut,
} from "~/lib/storage";
import { formatRupees } from "~/lib/formatters";
import { toast } from "~/lib/toast";

interface Address {
  id: string | number;
  label?: string;
  recipientName?: string;
  phoneNumber?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  isDefault?: boolean;
}

export default component$(() => {
  const nav = useNavigate();
  const userStore = useCurrentUser();

  const profile = useStore({
    name: "",
    phoneNumber: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
  });

  const addresses = useStore<Address[]>([]);
  const avatarPreview = useSignal<string | null>(null);
  const avatarFile = useSignal<File | null>(null);
  const loading = useSignal(true);
  const saving = useSignal(false);
  const addressSaving = useSignal(false);
  const deletingId = useSignal<string | number | null>(null);
  const editingAddress = useStore<{
    id: string | number | null;
    label: string;
    recipientName: string;
    phoneNumber: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    isDefault: boolean;
  }>({
    id: null,
    label: "",
    recipientName: "",
    phoneNumber: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
    isDefault: false,
  });

  const load = $(async () => {
    try {
      const data = (await getProfile()) as {
        user: Record<string, unknown>;
        message?: string;
      };
      const u = data.user;
      profile.name = (u.name as string) ?? "";
      profile.phoneNumber = (u.phoneNumber as string) ?? "";
      profile.addressLine1 = (u.addressLine1 as string) ?? "";
      profile.addressLine2 = (u.addressLine2 as string) ?? "";
      profile.city = (u.city as string) ?? "";
      profile.state = (u.state as string) ?? "";
      profile.postalCode = (u.postalCode as string) ?? "";
      profile.country = (u.country as string) ?? "India";
      avatarPreview.value = (u.avatar as string | null | undefined) ?? null;
      const addr = (u.addresses as Address[]) ?? [];
      addresses.length = 0;
      addr.forEach((a) => addresses.push(a));
    } catch (err) {
      if ((err as Error & { status: number }).status === 401) {
        clearToken();
        markLoggedOut();
        nav("/auth");
        return;
      }
      toast.error(err instanceof Error ? err.message : "Could not load profile");
    } finally {
      loading.value = false;
    }
  });

  useVisibleTask$(async () => {
    await load();
  });

  const handleAvatarChange = $((e: Event, currentTarget: HTMLInputElement) => {
    const file = currentTarget.files?.[0] ?? null;
    avatarFile.value = file;
    if (file) {
      avatarPreview.value = URL.createObjectURL(file);
    }
  });

  const handleAvatarUpload = $(async () => {
    if (!avatarFile.value) return;
    try {
      const formData = new FormData();
      formData.append("avatar", avatarFile.value);
      const data = (await uploadAvatar(formData)) as { avatarUrl: string };
      await updateProfile({ avatar: data.avatarUrl });
      avatarPreview.value = data.avatarUrl;
      avatarFile.value = null;
      toast.success("Avatar updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    }
  });

  const handleAvatarRemove = $(async () => {
    try {
      await updateProfile({ avatar: "" });
      avatarPreview.value = null;
      avatarFile.value = null;
      toast.success("Avatar removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Removal failed");
    }
  });

  const handleProfileSubmit = $(async () => {
    saving.value = true;
    try {
      const data = (await updateProfile(profile)) as {
        user: Record<string, unknown>;
        message?: string;
      };
      setCurrentUser(data.user);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("moringa:user-changed"));
      }
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      saving.value = false;
    }
  });

  const resetAddressForm = $(() => {
    editingAddress.id = null;
    editingAddress.label = "";
    editingAddress.recipientName = "";
    editingAddress.phoneNumber = "";
    editingAddress.addressLine1 = "";
    editingAddress.addressLine2 = "";
    editingAddress.city = "";
    editingAddress.state = "";
    editingAddress.postalCode = "";
    editingAddress.country = "India";
    editingAddress.isDefault = false;
  });

  const handleEditAddress = $((addr: Address) => {
    editingAddress.id = addr.id;
    editingAddress.label = addr.label ?? "";
    editingAddress.recipientName = addr.recipientName ?? "";
    editingAddress.phoneNumber = addr.phoneNumber ?? "";
    editingAddress.addressLine1 = addr.addressLine1 ?? "";
    editingAddress.addressLine2 = addr.addressLine2 ?? "";
    editingAddress.city = addr.city ?? "";
    editingAddress.state = addr.state ?? "";
    editingAddress.postalCode = addr.postalCode ?? "";
    editingAddress.country = addr.country ?? "India";
    editingAddress.isDefault = addr.isDefault ?? false;
  });

  const handleAddressSubmit = $(async () => {
    addressSaving.value = true;
    try {
      const payload = { ...editingAddress };
      if (editingAddress.id) {
        await updateUserAddress(editingAddress.id, payload);
        toast.success("Address updated");
      } else {
        await createUserAddress(payload);
        toast.success("Address added");
      }
      resetAddressForm();
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      addressSaving.value = false;
    }
  });

  const handleDeleteAddress = $(async (id: string | number) => {
    if (!confirm("Delete this address?")) return;
    deletingId.value = id;
    try {
      await deleteUserAddress(id);
      toast.success("Address deleted");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      deletingId.value = null;
    }
  });

  const handleSignOut = $(async () => {
    clearToken();
    markLoggedOut();
    toast.success("Signed out");
    nav("/");
  });

  if (loading.value) {
    return (
      <div class="container-page py-20 text-center text-slate-500">
        Loading…
      </div>
    );
  }

  return (
    <div class="container-page py-10">
      <h1 class="text-3xl font-bold">My Profile</h1>

      {/* Avatar */}
      <div class="mt-6 flex items-center gap-4">
        <div class="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          {avatarPreview.value ? (
            <img
              src={avatarPreview.value}
              alt=""
              class="h-full w-full object-cover"
            />
          ) : (
            <span class="text-2xl font-bold text-slate-400">
              {(profile.name?.[0] ?? "?").toUpperCase()}
            </span>
          )}
        </div>
        <div class="flex flex-col gap-2">
          <input
            type="file"
            accept="image/*"
            class="text-sm"
            onChange$={handleAvatarChange}
          />
          <div class="flex gap-2">
            <button
              type="button"
              class="btn-secondary text-xs"
              onClick$={handleAvatarUpload}
            >
              Upload
            </button>
            <button
              type="button"
              class="btn-ghost text-xs text-rose-500"
              onClick$={handleAvatarRemove}
            >
              Remove
            </button>
          </div>
        </div>
      </div>

      {/* Profile form */}
      <form
        preventdefault:submit
        onSubmit$={handleProfileSubmit}
        class="mt-8 max-w-lg space-y-4"
      >
        <div>
          <label class="mb-1 block text-sm font-medium">Name</label>
          <input
            class="input"
            value={profile.name}
            onInput$={(_, el) => (profile.name = el.value)}
            required
          />
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium">Phone</label>
          <input
            class="input"
            value={profile.phoneNumber}
            onInput$={(_, el) => (profile.phoneNumber = el.value)}
          />
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium">Address line 1</label>
          <input
            class="input"
            value={profile.addressLine1}
            onInput$={(_, el) => (profile.addressLine1 = el.value)}
          />
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium">Address line 2</label>
          <input
            class="input"
            value={profile.addressLine2}
            onInput$={(_, el) => (profile.addressLine2 = el.value)}
          />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="mb-1 block text-sm font-medium">City</label>
            <input
              class="input"
              value={profile.city}
              onInput$={(_, el) => (profile.city = el.value)}
            />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium">State</label>
            <input
              class="input"
              value={profile.state}
              onInput$={(_, el) => (profile.state = el.value)}
            />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="mb-1 block text-sm font-medium">Postal code</label>
            <input
              class="input"
              value={profile.postalCode}
              onInput$={(_, el) => (profile.postalCode = el.value)}
            />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium">Country</label>
            <input
              class="input"
              value={profile.country}
              onInput$={(_, el) => (profile.country = el.value)}
            />
          </div>
        </div>
        <button type="submit" class="btn-primary" disabled={saving.value}>
          {saving.value ? "Saving…" : "Save profile"}
        </button>
      </form>

      {/* Addresses */}
      <div class="mt-12">
        <h2 class="text-2xl font-bold">Addresses</h2>
        <div class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {addresses.map((addr) => (
            <div key={addr.id} class="card p-4">
              <p class="font-medium">{addr.label ?? "Address"}</p>
              <p class="mt-1 text-sm text-slate-600 dark:text-slate-300">
                {addr.recipientName}<br />
                {addr.addressLine1}<br />
                {addr.addressLine2}<br />
                {addr.city}, {addr.state} {addr.postalCode}<br />
                {addr.country}
              </p>
              <div class="mt-3 flex gap-2">
                <button
                  type="button"
                  class="text-sm text-neon hover:underline"
                  onClick$={() => handleEditAddress(addr)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  class="text-sm text-rose-500 hover:underline"
                  onClick$={() => handleDeleteAddress(addr.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}

          {/* Add new address form */}
          <div class="card p-4">
            <p class="mb-3 font-medium">
              {editingAddress.id ? "Edit address" : "New address"}
            </p>
            <div class="space-y-2">
              <input
                class="input"
                placeholder="Label (e.g. Home)"
                value={editingAddress.label}
                onInput$={(_, el) => (editingAddress.label = el.value)}
              />
              <input
                class="input"
                placeholder="Recipient name"
                value={editingAddress.recipientName}
                onInput$={(_, el) => (editingAddress.recipientName = el.value)}
              />
              <input
                class="input"
                placeholder="Phone"
                value={editingAddress.phoneNumber}
                onInput$={(_, el) => (editingAddress.phoneNumber = el.value)}
              />
              <input
                class="input"
                placeholder="Address line 1"
                value={editingAddress.addressLine1}
                onInput$={(_, el) => (editingAddress.addressLine1 = el.value)}
              />
              <input
                class="input"
                placeholder="Address line 2"
                value={editingAddress.addressLine2}
                onInput$={(_, el) => (editingAddress.addressLine2 = el.value)}
              />
              <div class="grid grid-cols-2 gap-2">
                <input
                  class="input"
                  placeholder="City"
                  value={editingAddress.city}
                  onInput$={(_, el) => (editingAddress.city = el.value)}
                />
                <input
                  class="input"
                  placeholder="State"
                  value={editingAddress.state}
                  onInput$={(_, el) => (editingAddress.state = el.value)}
                />
              </div>
              <div class="grid grid-cols-2 gap-2">
                <input
                  class="input"
                  placeholder="Postal code"
                  value={editingAddress.postalCode}
                  onInput$={(_, el) => (editingAddress.postalCode = el.value)}
                />
                <input
                  class="input"
                  placeholder="Country"
                  value={editingAddress.country}
                  onInput$={(_, el) => (editingAddress.country = el.value)}
                />
              </div>
              <label class="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={editingAddress.isDefault}
                  onChange$={(_, el) =>
                    (editingAddress.isDefault = (el as HTMLInputElement).checked)
                  }
                />
                Default address
              </label>
              <div class="flex gap-2">
                <button
                  type="button"
                  class="btn-primary"
                  disabled={addressSaving.value}
                  onClick$={handleAddressSubmit}
                >
                  {addressSaving.value ? "Saving…" : editingAddress.id ? "Update" : "Add"}
                </button>
                {editingAddress.id && (
                  <button
                    type="button"
                    class="btn-ghost"
                    onClick$={resetAddressForm}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sign out */}
      <div class="mt-12">
        <button
          type="button"
          class="btn-ghost text-rose-500"
          onClick$={handleSignOut}
        >
          Sign out
        </button>
      </div>
    </div>
  );
});
