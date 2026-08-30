const CART_KEY = "bestStoreCart";

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}

function addToCart(id, qty) {
  const cart = getCart();
  const existing = cart.find((item) => item.id === id);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ id, qty });
  }
  saveCart(cart);
}

function removeFromCart(id) {
  saveCart(getCart().filter((item) => item.id !== id));
}

function setCartQty(id, qty) {
  const cart = getCart();
  const item = cart.find((i) => i.id === id);
  if (!item) return;
  item.qty = Math.max(1, qty);
  saveCart(cart);
}

function cartCount() {
  return getCart().reduce((sum, item) => sum + item.qty, 0);
}

function updateCartBadge() {
  const badge = document.getElementById("cart-count");
  if (!badge) return;
  const count = cartCount();
  badge.textContent = count;
  badge.hidden = count === 0;
}

function productCardHTML(p) {
  return `
    <article class="product-card">
      <a class="product-image" href="prodotto.html?id=${p.id}">
        <span class="badge">${p.badge}</span>
        <img src="${p.image}" alt="${p.brand} ${p.model}" loading="lazy">
      </a>
      <div class="product-info">
        <div class="product-title">
          <h3>${p.model}</h3>
          <span class="tag">${p.brand}</span>
        </div>
        <p class="product-desc">${p.desc}</p>
        <div class="product-footer">
          <span class="price">€${p.price}</span>
          <a href="prodotto.html?id=${p.id}" class="btn btn-primary btn-small">view</a>
        </div>
      </div>
    </article>`;
}

function renderPopularGrid() {
  const grid = document.getElementById("popular-grid");
  if (!grid) return;
  grid.innerHTML = PRODUCTS.map(productCardHTML).join("");
}

function renderProductDetail() {
  const root = document.getElementById("product-detail");
  if (!root) return;

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const product = PRODUCTS.find((p) => p.id === id) || PRODUCTS[0];

  document.title = `${product.brand} ${product.model} — Best Store`;

  document.getElementById("detail-image").src = product.image;
  document.getElementById("detail-image").alt = `${product.brand} ${product.model}`;
  document.getElementById("detail-badge").textContent = product.badge;
  document.getElementById("detail-brand").textContent = product.brand;
  document.getElementById("detail-model").textContent = product.model;
  document.getElementById("detail-price").textContent = `€${product.price}`;
  document.getElementById("detail-desc").textContent = product.desc;
  const crumb = document.getElementById("detail-model-crumb");
  if (crumb) crumb.textContent = `${product.brand} ${product.model}`;

  const related = PRODUCTS.filter((p) => p.id !== product.id).slice(0, 4);
  document.getElementById("related-grid").innerHTML = related.map(productCardHTML).join("");

  let qty = 1;
  const qtyValue = document.getElementById("detail-qty-value");
  document.getElementById("detail-qty-minus").addEventListener("click", () => {
    qty = Math.max(1, qty - 1);
    qtyValue.textContent = qty;
  });
  document.getElementById("detail-qty-plus").addEventListener("click", () => {
    qty += 1;
    qtyValue.textContent = qty;
  });

  const addBtn = document.getElementById("add-to-cart-btn");
  addBtn.addEventListener("click", () => {
    addToCart(product.id, qty);
    const original = addBtn.textContent;
    addBtn.textContent = "Aggiunto ✓";
    setTimeout(() => {
      addBtn.textContent = original;
    }, 1200);
  });
}

function renderCartPage() {
  const root = document.getElementById("cart-content");
  if (!root) return;

  function render() {
    const cart = getCart();

    if (!cart.length) {
      root.innerHTML = `
        <div class="cart-empty">
          <p>Il tuo carrello è vuoto.</p>
          <a href="catalogo.html" class="btn btn-primary">Vai allo shop</a>
        </div>`;
      return;
    }

    const lines = cart
      .map((item) => {
        const p = PRODUCTS.find((prod) => prod.id === item.id);
        if (!p) return "";
        return `
          <div class="cart-item" data-id="${p.id}">
            <a href="prodotto.html?id=${p.id}" class="cart-item-image">
              <img src="${p.image}" alt="${p.brand} ${p.model}">
            </a>
            <div class="cart-item-info">
              <span class="tag">${p.brand}</span>
              <h3><a href="prodotto.html?id=${p.id}">${p.model}</a></h3>
              <span class="cart-item-price">€${p.price}</span>
            </div>
            <div class="qty-stepper cart-item-qty">
              <button type="button" class="qty-minus" aria-label="Diminuisci">-</button>
              <span>${item.qty}</span>
              <button type="button" class="qty-plus" aria-label="Aumenta">+</button>
            </div>
            <span class="cart-item-total">€${p.price * item.qty}</span>
            <button type="button" class="cart-item-remove" aria-label="Rimuovi">
              <svg viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
            </button>
          </div>`;
      })
      .join("");

    const subtotal = cart.reduce((sum, item) => {
      const p = PRODUCTS.find((prod) => prod.id === item.id);
      return sum + (p ? p.price * item.qty : 0);
    }, 0);

    root.innerHTML = `
      <div class="cart-layout">
        <div class="cart-items">${lines}</div>
        <div class="cart-summary">
          <h2>Riepilogo</h2>
          <div class="summary-row"><span>Subtotale</span><span>€${subtotal}</span></div>
          <div class="summary-row"><span>Spedizione</span><span>Calcolata al checkout</span></div>
          <div class="summary-row summary-total"><span>Totale</span><span>€${subtotal}</span></div>
          <button type="button" class="btn btn-primary btn-large checkout-btn">Procedi al checkout</button>
        </div>
      </div>`;

    root.querySelectorAll(".cart-item").forEach((el) => {
      const id = el.dataset.id;
      const item = cart.find((i) => i.id === id);
      el.querySelector(".qty-minus").addEventListener("click", () => {
        setCartQty(id, item.qty - 1);
        render();
      });
      el.querySelector(".qty-plus").addEventListener("click", () => {
        setCartQty(id, item.qty + 1);
        render();
      });
      el.querySelector(".cart-item-remove").addEventListener("click", () => {
        removeFromCart(id);
        render();
      });
    });
  }

  render();
}

function initCatalogPage() {
  const grid = document.getElementById("catalog-grid");
  if (!grid) return;

  const params = new URLSearchParams(window.location.search);
  const cat = params.get("cat");
  const titles = { men: "Uomo", woman: "Donna", sales: "Saldi" };
  const pageTitle = titles[cat] || "Shop";
  document.title = `${pageTitle} — Best Store`;

  const heroSection = document.getElementById("catalog-hero");
  const heroInner = document.getElementById("catalog-hero-inner");
  const heroTitle = document.getElementById("catalog-hero-title");
  const header = document.getElementById("catalog-header");
  const plainTitle = document.getElementById("catalog-title");

  if (cat === "men" || cat === "woman") {
    heroSection.hidden = false;
    heroInner.classList.add(cat === "men" ? "tint-blue" : "tint-pink");
    heroTitle.textContent = pageTitle;
    header.hidden = true;
  } else {
    plainTitle.textContent = pageTitle;
  }

  const brands = [...new Set(PRODUCTS.map((p) => p.brand))];
  const brandOptions = document.getElementById("brand-options");
  brandOptions.innerHTML = brands
    .map((b) => `<label class="filter-option"><input type="checkbox" value="${b}">${b}</label>`)
    .join("");

  let selectedBrands = [];
  let priceRange = "all";
  let currentSort = "default";

  function priceInRange(price, range) {
    if (range === "all") return true;
    const [min, max] = range.split("-").map(Number);
    return price >= min && price <= max;
  }

  function renderGrid() {
    let items = PRODUCTS.filter((p) => {
      const brandOk = selectedBrands.length === 0 || selectedBrands.includes(p.brand);
      return brandOk && priceInRange(p.price, priceRange);
    });
    if (currentSort === "price-asc") items.sort((a, b) => a.price - b.price);
    if (currentSort === "price-desc") items.sort((a, b) => b.price - a.price);
    grid.innerHTML = items.length
      ? items.map(productCardHTML).join("")
      : '<p class="empty-state">Nessun prodotto trovato.</p>';
  }

  const brandBtn = document.querySelector('[data-key="brand"] .filter-btn');
  brandOptions.addEventListener("change", () => {
    selectedBrands = [...brandOptions.querySelectorAll("input:checked")].map((i) => i.value);
    brandBtn.firstChild.textContent = selectedBrands.length ? `Brand (${selectedBrands.length})` : "Brand";
    renderGrid();
  });

  const priceOptions = document.getElementById("price-options");
  const priceBtn = document.querySelector('[data-key="prezzo"] .filter-btn');
  const priceLabels = { all: "Prezzo", "0-150": "Fino a €150", "150-220": "€150 – €220", "220-9999": "Oltre €220" };
  priceOptions.addEventListener("change", (e) => {
    priceRange = e.target.value;
    priceBtn.firstChild.textContent = priceLabels[priceRange];
    renderGrid();
  });

  const sortOptions = document.getElementById("sort-options");
  const sortBtn = document.querySelector('[data-key="sort"] .filter-btn');
  const sortLabels = { default: "In evidenza", "price-asc": "Prezzo: crescente", "price-desc": "Prezzo: decrescente" };
  sortOptions.addEventListener("change", (e) => {
    currentSort = e.target.value;
    sortBtn.firstChild.textContent = sortLabels[currentSort];
    renderGrid();
  });

  document.querySelectorAll(".filter-dropdown").forEach((dd) => {
    const btn = dd.querySelector(".filter-btn");
    const panel = dd.querySelector(".filter-panel");
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = dd.classList.contains("open");
      document.querySelectorAll(".filter-dropdown.open").forEach((o) => o.classList.remove("open"));
      if (!isOpen) dd.classList.add("open");
    });
    panel.addEventListener("click", (e) => e.stopPropagation());
  });

  document.addEventListener("click", () => {
    document.querySelectorAll(".filter-dropdown.open").forEach((o) => o.classList.remove("open"));
  });

  renderGrid();
}

function setActiveNav() {
  const path = window.location.pathname.split("/").pop() || "index.html";
  const params = new URLSearchParams(window.location.search);
  const cat = params.get("cat");

  document.querySelectorAll(".main-nav a").forEach((a) => a.classList.remove("active"));

  if (path === "catalogo.html") {
    if (cat === "men" || cat === "woman") {
      document.querySelector(`.nav-item > a[href*="cat=${cat}"]`)?.classList.add("active");
    } else if (cat === "sales") {
      document.querySelector('.main-nav > a[href*="cat=sales"]')?.classList.add("active");
    } else {
      document.querySelector('.main-nav > a[href="catalogo.html"]')?.classList.add("active");
    }
  } else if (path === "prodotto.html") {
    document.querySelector('.main-nav > a[href="catalogo.html"]')?.classList.add("active");
  } else if (path === "carrello.html") {
    // no top-level nav item corresponds to the cart
  } else {
    document.querySelector('.main-nav > a[href="index.html"]')?.classList.add("active");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  renderPopularGrid();
  renderProductDetail();
  initCatalogPage();
  renderCartPage();
  setActiveNav();
  updateCartBadge();
});
