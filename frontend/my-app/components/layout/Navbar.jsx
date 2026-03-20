"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getFeaturedCategories } from "@/lib/categoryData";

export default function Navbar() {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMobileDropdown, setOpenMobileDropdown] = useState(null);
  const [searchValue, setSearchValue] = useState("");
  const featured = getFeaturedCategories();
  const featuredMap = featured.reduce((acc, item) => {
    acc[item.slug] = item;
    return acc;
  }, {});
  const backendNameOverrides = {
    "coord-sets": "coordsets",
    "premium-collection": "premium collection",
    "kurta-sets": "kurthasets",
  };

  const categoryHref = (slugOrName) => {
    const featuredItem = featuredMap[slugOrName];
    const backendName =
      (featuredItem && (backendNameOverrides[featuredItem.slug] || featuredItem.title)) ||
      backendNameOverrides[slugOrName] ||
      slugOrName;
    return `/products/${encodeURIComponent(backendName)}`;
  };

  const toggleMobileMenu = () => {
    setMobileOpen((prev) => {
      const next = !prev;
      if (!next) {
        setOpenMobileDropdown(null);
      }
      return next;
    });
  };

  const closeMobileMenu = () => {
    setMobileOpen(false);
    setOpenMobileDropdown(null);
  };

  const toggleMobileDropdown = (key) => {
    setOpenMobileDropdown((prev) => (prev === key ? null : key));
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const trimmed = searchValue.trim();
    if (!trimmed) return;
    router.push(`/products?search=${encodeURIComponent(trimmed)}`);
  };

  return (
    <header className="header">

      {/* TOP ANNOUNCEMENT BAR */}
      <div className="topbar">
        NEW ARRIVALS | BUY 2 GET 25% OFF
      </div>

      {/* MAIN HEADER ROW */}
      <div className="header-main">

        {/* LEFT EMPTY SPACE (FOR CENTER ALIGNMENT) */}
        <div className="header-left">
          <button
            className={`mobile-menu-button ${mobileOpen ? "open" : ""}`}
            type="button"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            onClick={toggleMobileMenu}
          >
            <span />
            <span />
            <span />
          </button>
        </div>

        {/* LOGO */}
        <div className="logo">
          <Link href="/">
            <Image
              src="/images/logo/logo2.png"
              alt="Visista Closet"
              width={240}
              height={90}
              priority
            />
          </Link>
        </div>

        {/* SEARCH + ICONS */}
        <div className="nav-icons">

          {/* SEARCH BAR */}
          <form className="search-bar" onSubmit={handleSearchSubmit}>
            <input
              type="text"
              placeholder="What are you looking for?"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
            />
            <button className="search-button" type="submit" aria-label="Search">
              <Image
                src="/icons/search.png"
                alt=""
                width={18}
                height={18}
              />
            </button>
          </form>

          {/* ICONS */}
          <Link href="/account" aria-label="Account">
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </Link>

          <Link href="/wishlist" aria-label="Wishlist">
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </Link>

          <Link href="/cart" aria-label="Cart">
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4l1-12z" />
            </svg>
          </Link>

        </div>
      </div>

      {/* MENU BAR */}
      <nav className="menu-bar">
        <ul className="menu">

          <li className="dropdown">
            <Link href={categoryHref("kurtas")}>Kurtas</Link>
            <ul className="dropdown-menu">
              <li>
                <Link href={categoryHref("kurtis")}>Kurtis</Link>
              </li>
              <li>
                <Link href={categoryHref("kurta-sets")}>Kurta Sets</Link>
              </li>
            </ul>
          </li>

          <li>
            <Link href={categoryHref("coord-sets")}>Coord Sets</Link>
          </li>

          <li>
            <Link href={categoryHref("premium-collection")}>Premium Collection</Link>
          </li>

          <li>
            <Link href={categoryHref("new-arrivals")}>New</Link>
          </li>

        </ul>
      </nav>

      {/* MOBILE MENU */}
      <nav className={`mobile-menu ${mobileOpen ? "open" : ""}`} aria-hidden={!mobileOpen}>
        <ul className="mobile-menu-list">
          <li className="mobile-item">
            <button
              type="button"
              className="mobile-parent"
              aria-expanded={openMobileDropdown === "kurtas"}
              onClick={() => toggleMobileDropdown("kurtas")}
            >
              Kurtas
              <span className="mobile-caret" />
            </button>
            <ul className={`mobile-submenu ${openMobileDropdown === "kurtas" ? "open" : ""}`}>
              <li>
                <Link href={categoryHref("kurtis")} onClick={closeMobileMenu}>
                  Kurtis
                </Link>
              </li>
              <li>
                <Link href={categoryHref("kurta-sets")} onClick={closeMobileMenu}>
                  Kurta Sets
                </Link>
              </li>
            </ul>
          </li>

          <li className="mobile-item">
            <Link href={categoryHref("coord-sets")} onClick={closeMobileMenu}>
              Coord Sets
            </Link>
          </li>

          <li className="mobile-item">
            <Link href={categoryHref("premium-collection")} onClick={closeMobileMenu}>
              Premium Collection
            </Link>
          </li>

          <li className="mobile-item">
            <Link href={categoryHref("new-arrivals")} onClick={closeMobileMenu}>
              New
            </Link>
          </li>
        </ul>
      </nav>

    </header>
  );
}
