"use strict";

const WHATSAPP_NUMBER = "6281234567890";
const CART_KEY = "langkah-cart-v2";
const FREE_SHIPPING_MINIMUM = 500000;
const SHIPPING_FEE = 20000;
const money = (amount) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);
const revealObserver = "IntersectionObserver" in window
  ? new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -35px 0px" })
  : null;

function observeTextReveals() {
  const revealTargets = document.querySelectorAll([
    ".hero-copy > *",
    ".section-heading",
    ".product-info",
    ".story-copy > *",
    ".newsletter > *",
    ".cart-heading > *",
    ".cart-item-info",
    ".order-summary > *",
    ".form-title",
    ".field",
    ".payment-option",
    ".footer-brand > *",
    ".footer-column > *",
    ".breadcrumb > *",
    ".empty-cart > *"
  ].join(", "));

  revealTargets.forEach((target, index) => {
    if (target.classList.contains("text-reveal")) return;
    target.classList.add("text-reveal");
    target.style.setProperty("--reveal-delay", `${(index % 5) * 75}ms`);
    if (revealObserver) revealObserver.observe(target);
    else target.classList.add("is-visible");
  });
}

const products = [
  { id: "sora-run", name: "Sora Run", category: "Running", price: 429000, oldPrice: 529000, label: "BEST SELLER", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80", alt: "Sneakers merah Sora Run" },
  { id: "daily-form", name: "Daily Form", category: "Sneakers", price: 389000, label: "NEW ARRIVAL", image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=900&q=80", alt: "Sneakers putih Daily Form" },
  { id: "terra-walk", name: "Terra Walk", category: "Casual", price: 459000, image: "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=900&q=80", alt: "Sepatu casual Terra Walk" },
  { id: "cloud-step", name: "Cloud Step", category: "Running", price: 499000, oldPrice: 579000, label: "FAVORIT", image: "https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=900&q=80", alt: "Sneakers Cloud Step" },
  { id: "weekend-low", name: "Weekend Low", category: "Sneakers", price: 349000, image: "https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=900&q=80", alt: "Sneakers Weekend Low" },
  { id: "urban-flex", name: "Urban Flex", category: "Casual", price: 419000, image: "https://images.unsplash.com/photo-1495555961986-6d4c1ecb7be3?auto=format&fit=crop&w=900&q=80", alt: "Sepatu Urban Flex" }
];

function readCart() {
  try {
    const stored = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    if (!Array.isArray(stored)) return [];
    return stored.filter((item) => item && products.some((product) => product.id === item.id) && Number.isInteger(item.size) && item.size >= 36 && item.size <= 44 && Number.isInteger(item.quantity) && item.quantity > 0);
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  renderCartCount(cart);
}

function renderCartCount(cart = readCart()) {
  document.querySelectorAll(".cart-count").forEach((count) => { count.textContent = String(cart.reduce((total, item) => total + item.quantity, 0)); });
}

function showToast(message) {
  document.querySelector(".toast")?.remove();
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.setAttribute("role", "status");
  toast.textContent = message;
  document.body.append(toast);
  window.setTimeout(() => toast.remove(), 2600);
}

function addToCart(id, size) {
  const cart = readCart();
  const existing = cart.find((item) => item.id === id && item.size === size);
  if (existing) existing.quantity += 1;
  else cart.push({ id, size, quantity: 1 });
  saveCart(cart);
  showToast(`${products.find((product) => product.id === id).name} ditambahkan ke keranjang`);
}

function renderProducts(filter = "Semua") {
  const grid = document.querySelector("#product-grid");
  if (!grid) return;
  const visibleProducts = filter === "Semua" ? products : products.filter((product) => product.category === filter);
  grid.innerHTML = visibleProducts.map((product) => `
    <article class="product-card">
      <div class="product-image">
        <img src="${product.image}" alt="${product.alt}" loading="lazy">
        ${product.label ? `<span class="product-label">${product.label}</span>` : ""}
        <button class="add-product" type="button" data-add="${product.id}" aria-label="Tambah ${product.name} ke keranjang">+</button>
      </div>
      <div class="product-info"><div class="product-details"><h3>${product.name}</h3><p class="product-category">${product.category}</p><label class="size-picker">Ukuran <select data-size="${product.id}" aria-label="Pilih ukuran ${product.name}">${Array.from({ length: 9 }, (_, index) => `<option value="${index + 36}">${index + 36}</option>`).join("")}</select></label></div><div class="product-price">${money(product.price)}${product.oldPrice ? `<span class="product-old-price">${money(product.oldPrice)}</span>` : ""}</div></div>
    </article>
  `).join("");
  observeTextReveals();
}

function cartTotals(cart) {
  const subtotal = cart.reduce((total, item) => {
    const product = products.find((entry) => entry.id === item.id);
    return total + (product ? product.price * item.quantity : 0);
  }, 0);
  const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_MINIMUM ? 0 : SHIPPING_FEE;
  return { subtotal, shipping, total: subtotal + shipping };
}

function summaryMarkup(cart, checkout = false) {
  const { subtotal, shipping, total } = cartTotals(cart);
  const items = checkout ? cart.map((item) => {
    const product = products.find((entry) => entry.id === item.id);
    return `<div class="summary-product"><img src="${product.image}" alt=""><span>${product.name}<small>Ukuran ${item.size} · ${item.quantity} × ${money(product.price)}</small></span><strong>${money(product.price * item.quantity)}</strong></div>`;
  }).join("") : "";
  if (!cart.length) {
    return `<h2>Ringkasan pesanan</h2>${checkout ? '<p class="checkout-empty">Keranjangmu masih kosong. Pilih sepatu favoritmu sebelum melanjutkan.</p><a class="button button-dark summary-button" href="index.html#koleksi">Cari sepatu <span aria-hidden="true">↗</span></a>' : '<p class="summary-note">Yuk, temukan sepatu yang cocok untuk langkahmu berikutnya.</p><a class="button button-dark summary-button" href="index.html#koleksi">Jelajahi koleksi <span aria-hidden="true">↗</span></a>'}`;
  }
  return `<h2>Ringkasan pesanan</h2>${items}<div class="summary-row"><span>Subtotal</span><strong>${money(subtotal)}</strong></div><div class="summary-row"><span>Pengiriman</span><strong>${shipping ? money(shipping) : "Gratis"}</strong></div>${subtotal < FREE_SHIPPING_MINIMUM ? `<p class="summary-note">Belanja ${money(FREE_SHIPPING_MINIMUM - subtotal)} lagi untuk menikmati gratis ongkir.</p>` : '<p class="summary-note">Selamat, pesananmu mendapat gratis ongkir!</p>'}<div class="summary-row summary-total"><span>Total</span><strong>${money(total)}</strong></div>${checkout ? '<p class="summary-note">Ongkir dapat disesuaikan admin berdasarkan alamat pengiriman.</p>' : '<a class="button button-dark summary-button" href="pembayaran.html">Lanjut ke pembayaran <span aria-hidden="true">↗</span></a>'}`;
}

function renderCartPage() {
  const itemsElement = document.querySelector("#cart-items");
  const summaryElement = document.querySelector("#order-summary");
  if (!itemsElement || !summaryElement) return;
  const cart = readCart();
  document.querySelector("#cart-page-count").textContent = `${cart.reduce((total, item) => total + item.quantity, 0)} produk`;
  if (!cart.length) {
    itemsElement.innerHTML = '<div class="empty-cart"><span class="empty-cart-icon">⌑</span><h2>Keranjangmu masih kosong.</h2><p>Temukan sepatu yang siap menemani cerita berikutnya.</p><a class="button button-dark" href="index.html#koleksi">Jelajahi koleksi <span aria-hidden="true">↗</span></a></div>';
  } else {
    itemsElement.innerHTML = cart.map((item) => {
      const product = products.find((entry) => entry.id === item.id);
      return `<article class="cart-item"><img class="cart-item-image" src="${product.image}" alt="${product.alt}"><div class="cart-item-info"><h2>${product.name}</h2><p>${product.category} · Ukuran ${item.size}</p><strong>${money(product.price)}</strong><div class="cart-item-controls"><div class="quantity-control"><button type="button" data-quantity="${product.id}" data-size="${item.size}" data-delta="-1" aria-label="Kurangi jumlah ${product.name} ukuran ${item.size}">−</button><span>${item.quantity}</span><button type="button" data-quantity="${product.id}" data-size="${item.size}" data-delta="1" aria-label="Tambah jumlah ${product.name} ukuran ${item.size}">+</button></div><button class="remove-item" type="button" data-remove="${product.id}" data-size="${item.size}">Hapus</button></div></div><strong class="cart-item-total">${money(product.price * item.quantity)}</strong></article>`;
    }).join("");
  }
  summaryElement.innerHTML = summaryMarkup(cart);
  observeTextReveals();
}

function renderCheckoutSummary() {
  const summary = document.querySelector("#checkout-summary");
  if (summary) {
    summary.innerHTML = summaryMarkup(readCart(), true);
    observeTextReveals();
  }
}

function whatsappUrl(message) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

document.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const addButton = target.closest("[data-add]");
  if (addButton) {
    const id = addButton.getAttribute("data-add");
    const size = Number(document.querySelector(`[data-size="${id}"]`)?.value);
    addToCart(id, size);
    return;
  }
  const quantityButton = target.closest("[data-quantity]");
  if (quantityButton) {
    const id = quantityButton.getAttribute("data-quantity");
    const size = Number(quantityButton.getAttribute("data-size"));
    const delta = Number(quantityButton.getAttribute("data-delta"));
    const cart = readCart();
    const item = cart.find((entry) => entry.id === id && entry.size === size);
    if (!item) return;
    item.quantity += delta;
    saveCart(cart.filter((entry) => entry.quantity > 0));
    renderCartPage();
    renderCheckoutSummary();
    return;
  }
  const removeButton = target.closest("[data-remove]");
  if (removeButton) {
    const id = removeButton.getAttribute("data-remove");
    const size = Number(removeButton.getAttribute("data-size"));
    saveCart(readCart().filter((item) => item.id !== id || item.size !== size));
    renderCartPage();
    renderCheckoutSummary();
  }
});

document.querySelectorAll(".category-chip").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelector(".category-chip.selected")?.classList.remove("selected");
    button.classList.add("selected");
    renderProducts(button.dataset.filter);
  });
});

document.querySelectorAll("[data-wa-link]").forEach((link) => {
  link.href = whatsappUrl("Halo Langkah, saya ingin bertanya tentang koleksi sepatu.");
});

document.querySelector("#newsletter-form")?.addEventListener("submit", (event) => {
  event.preventDefault();
  document.querySelector("#newsletter-message").textContent = "Terima kasih! Kamu akan segera mendapat kabar dari Langkah.";
  event.currentTarget.reset();
});

document.querySelector("#checkout-form")?.addEventListener("submit", (event) => {
  event.preventDefault();
  const cart = readCart();
  if (!cart.length) {
    showToast("Keranjangmu masih kosong. Tambahkan produk sebelum memesan.");
    return;
  }
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const data = new FormData(form);
  const { subtotal, shipping, total } = cartTotals(cart);
  const itemLines = cart.map((item) => {
    const product = products.find((entry) => entry.id === item.id);
    return `- ${product.name} ukuran ${item.size} (${item.quantity}x) — ${money(product.price * item.quantity)}`;
  }).join("\n");
  const message = [
    "Halo Langkah, saya ingin memesan sepatu:",
    "",
    itemLines,
    "",
    `Subtotal: ${money(subtotal)}`,
    `Pengiriman: ${shipping ? money(shipping) : "Gratis"}`,
    `Total sementara: ${money(total)}`,
    `Metode pembayaran: ${data.get("payment")}`,
    "",
    `Nama: ${data.get("name")}`,
    `WhatsApp: ${data.get("phone")}`,
    `Alamat: ${data.get("address")}, ${data.get("city")}, ${data.get("postal")}`,
    data.get("email") ? `Email: ${data.get("email")}` : "",
    data.get("note") ? `Catatan: ${data.get("note")}` : ""
  ].filter(Boolean).join("\n");
  window.open(whatsappUrl(message), "_blank", "noopener,noreferrer");
});

renderProducts();
renderCartCount();
renderCartPage();
renderCheckoutSummary();
observeTextReveals();
