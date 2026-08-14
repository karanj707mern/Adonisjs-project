import React from "react";
import { render, waitFor } from "@testing-library/react";
import MainNavbar from "../../components/MainNavbar";

const mockGetCart = jest.fn();
const mockGetWishlist = jest.fn();
const mockSignOutCurrentUser = jest.fn();

const readGuestCartFromLocalStorage = () => {
  const cart = JSON.parse(localStorage.getItem("cart-items") ?? "[]");
  return Array.isArray(cart) ? cart : [];
};

const readGuestWishlistFromLocalStorage = () => {
  const wishlist = JSON.parse(localStorage.getItem("wishlist-items") ?? "[]");
  return Array.isArray(wishlist) ? wishlist : [];
};

