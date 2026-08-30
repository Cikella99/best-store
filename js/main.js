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

function discountPercent(p) {
  if (!p.oldPrice) return 0;
  return Math.round((1 - p.price / p.oldPrice) * 100);
}

const WISHLIST_KEY = "bestStoreWishlist";

function getWishlist() {
  try {
    return JSON.parse(localStorage.getItem(WISHLIST_KEY)) || [];
  } catch {
    return [];
  }
}

function toggleWishlist(id) {
  const list = getWishlist();
  const idx = list.indexOf(id);
  if (idx === -1) {
    list.push(id);
  } else {
    list.splice(idx, 1);
  }
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(list));
  updateWishlistBadge();
}

function updateWishlistBadge() {
  const badge = document.getElementById("wishlist-count");
  if (!badge) return;
  const count = getWishlist().length;
  badge.textContent = count;
  badge.hidden = count === 0;
}

function renderWishlistPage() {
  const root = document.getElementById("wishlist-content");
  if (!root) return;

  function render() {
    const ids = getWishlist();
    const items = getProducts().filter((p) => ids.includes(p.id));
    root.innerHTML = items.length
      ? `<div class="products-grid">${items.map(productCardHTML).join("")}</div>`
      : `<div class="cart-empty"><p>Non hai ancora salvato nessun preferito.</p><a href="catalogo.html" class="btn btn-primary">Vai allo shop</a></div>`;
  }

  document.addEventListener("click", (e) => {
    if (e.target.closest(".wishlist-btn")) render();
  });

  render();
}

function productCardHTML(p) {
  const discount = discountPercent(p);
  const isFav = getWishlist().includes(p.id);
  return `
    <article class="product-card">
      <a class="product-image" href="prodotto.html?id=${p.id}">
        ${discount ? `<span class="badge">-${discount}%</span>` : ""}
        <img src="${p.image}" alt="${p.brand} ${p.model}" loading="lazy">
      </a>
      <button type="button" class="wishlist-btn${isFav ? " active" : ""}" data-id="${p.id}" aria-label="Aggiungi ai preferiti">
        <svg viewBox="0 0 24 24" fill="none"><path d="M12 20.2s-7.2-4.4-9.7-8.8C1 8 2.6 4.3 6.2 4.3c2.1 0 3.7 1.2 5.8 3.4 2.1-2.2 3.7-3.4 5.8-3.4 3.6 0 5.2 3.7 3.9 7.1-2.5 4.4-9.7 8.8-9.7 8.8z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>
      </button>
      <div class="product-info">
        <div class="product-title">
          <h3>${p.model}</h3>
          <span class="tag">${p.brand}</span>
        </div>
        <p class="product-desc">${p.desc}</p>
        <div class="product-footer">
          <span class="price-group">
            <span class="price">€${p.price}</span>
            ${discount ? `<span class="price-old">€${p.oldPrice}</span>` : ""}
          </span>
          <a href="prodotto.html?id=${p.id}" class="btn btn-primary btn-small">view</a>
        </div>
      </div>
    </article>`;
}

function renderPopularGrid() {
  const grid = document.getElementById("popular-grid");
  if (!grid) return;
  grid.innerHTML = getProducts().map(productCardHTML).join("");
}

function renderProductDetail() {
  const root = document.getElementById("product-detail");
  if (!root) return;

  const products = getProducts();
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const product = products.find((p) => p.id === id) || products[0];
  if (!product) {
    root.innerHTML = "<p>Nessun prodotto disponibile al momento.</p>";
    return;
  }

  document.title = `${product.brand} ${product.model} — Best Store`;

  document.getElementById("detail-image").src = product.image;
  document.getElementById("detail-image").alt = `${product.brand} ${product.model}`;
  document.getElementById("detail-brand").textContent = product.brand;
  document.getElementById("detail-model").textContent = product.model;
  document.getElementById("detail-price").textContent = `€${product.price}`;
  document.getElementById("detail-desc").textContent = product.desc;

  const discount = discountPercent(product);
  const badgeEl = document.getElementById("detail-badge");
  const oldPriceEl = document.getElementById("detail-price-old");
  if (discount) {
    badgeEl.textContent = `-${discount}%`;
    badgeEl.hidden = false;
    oldPriceEl.textContent = `€${product.oldPrice}`;
    oldPriceEl.hidden = false;
  } else {
    badgeEl.hidden = true;
    oldPriceEl.hidden = true;
  }
  const crumb = document.getElementById("detail-model-crumb");
  if (crumb) crumb.textContent = `${product.brand} ${product.model}`;

  const related = products.filter((p) => p.id !== product.id).slice(0, 4);
  document.getElementById("related-grid").innerHTML = related.map(productCardHTML).join("");

  document.querySelectorAll(".size-pill").forEach((pill) => {
    pill.addEventListener("click", () => {
      document.querySelectorAll(".size-pill").forEach((p) => p.classList.remove("selected"));
      pill.classList.add("selected");
    });
  });

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
    const products = getProducts();

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
        const p = products.find((prod) => prod.id === item.id);
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
      const p = products.find((prod) => prod.id === item.id);
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
  const typeParam = params.get("type");
  const catTitles = { men: "Uomo", woman: "Donna", sales: "Saldi" };
  const typeTitles = { shoes: "Scarpe", clothing: "Abbigliamento", accessories: "Accessori" };
  const pageTitle = catTitles[cat] || typeTitles[typeParam] || "Shop";
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
  } else if (typeTitles[typeParam]) {
    heroSection.hidden = false;
    heroTitle.textContent = pageTitle;
    header.hidden = true;
  } else {
    plainTitle.textContent = pageTitle;
  }

  const categoriaFilter = document.getElementById("filter-categoria");
  const showCategoria = !typeParam && (!cat || cat === "men" || cat === "woman");
  categoriaFilter.hidden = !showCategoria;

  const products = getProducts();
  const brands = [...new Set(products.map((p) => p.brand))];
  const brandOptions = document.getElementById("brand-options");
  brandOptions.innerHTML = brands
    .map((b) => `<label class="filter-option"><input type="checkbox" value="${b}">${b}</label>`)
    .join("");

  let selectedBrands = [];
  let currentSort = "default";

  const prices = products.map((p) => p.price);
  const priceMin = Math.min(...prices);
  const priceMax = Math.max(...prices);
  let priceLow = priceMin;
  let priceHigh = priceMax;

  const minSlider = document.getElementById("price-min");
  const maxSlider = document.getElementById("price-max");
  const minLabel = document.getElementById("price-min-label");
  const maxLabel = document.getElementById("price-max-label");
  const rangeFill = document.getElementById("range-fill");

  [minSlider, maxSlider].forEach((s) => {
    s.min = priceMin;
    s.max = priceMax;
  });
  minSlider.value = priceMin;
  maxSlider.value = priceMax;

  function updateSliderUI() {
    minLabel.textContent = `€${priceLow}`;
    maxLabel.textContent = `€${priceHigh}`;
    const span = priceMax - priceMin || 1;
    const leftPct = ((priceLow - priceMin) / span) * 100;
    const rightPct = ((priceHigh - priceMin) / span) * 100;
    rangeFill.style.left = `${leftPct}%`;
    rangeFill.style.width = `${rightPct - leftPct}%`;
  }

  function renderGrid() {
    let items = products.filter((p) => {
      const brandOk = selectedBrands.length === 0 || selectedBrands.includes(p.brand);
      const priceOk = p.price >= priceLow && p.price <= priceHigh;
      return brandOk && priceOk;
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

  minSlider.addEventListener("input", () => {
    if (Number(minSlider.value) > Number(maxSlider.value)) minSlider.value = maxSlider.value;
    priceLow = Number(minSlider.value);
    priceHigh = Number(maxSlider.value);
    updateSliderUI();
    renderGrid();
  });

  maxSlider.addEventListener("input", () => {
    if (Number(maxSlider.value) < Number(minSlider.value)) maxSlider.value = minSlider.value;
    priceLow = Number(minSlider.value);
    priceHigh = Number(maxSlider.value);
    updateSliderUI();
    renderGrid();
  });

  updateSliderUI();

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
      document.querySelector('.nav-item > a[href="catalogo.html"]')?.classList.add("active");
    }
  } else if (path === "prodotto.html") {
    document.querySelector('.nav-item > a[href="catalogo.html"]')?.classList.add("active");
  } else if (path === "carrello.html" || path === "login.html" || path === "preferiti.html") {
    // no top-level nav item corresponds to these pages
  } else {
    document.querySelector('.main-nav > a[href="index.html"]')?.classList.add("active");
  }
}

document.addEventListener("click", (e) => {
  const btn = e.target.closest(".wishlist-btn");
  if (!btn) return;
  e.preventDefault();
  toggleWishlist(btn.dataset.id);
  btn.classList.toggle("active");
});

function initLoginPage() {
  const phoneStep = document.getElementById("phone-step");
  if (!phoneStep) return;

  const codeStep = document.getElementById("code-step");
  const successStep = document.getElementById("success-step");
  const sentPhone = document.getElementById("sent-phone");
  const successName = document.getElementById("success-name");

  let enteredName = "";

  phoneStep.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("login-name").value.trim();
    const surname = document.getElementById("login-surname").value.trim();
    enteredName = [name, surname].filter(Boolean).join(" ");
    sentPhone.textContent = document.getElementById("login-phone").value.trim();
    phoneStep.hidden = true;
    codeStep.hidden = false;
  });

  document.getElementById("back-to-phone").addEventListener("click", () => {
    codeStep.hidden = true;
    phoneStep.hidden = false;
  });

  codeStep.addEventListener("submit", (e) => {
    e.preventDefault();
    const code = document.getElementById("login-code").value.trim();
    if (code !== "123456") {
      alert("Codice non valido. In questa demo usa 123456.");
      return;
    }
    codeStep.hidden = true;
    successStep.hidden = false;
    successName.textContent = enteredName || "utente";
  });
}

function sizeHeroToViewport() {
  const heroInner = document.querySelector(".hero-inner");
  if (!heroInner) return;

  const announcement = document.querySelector(".announcement-bar");
  const header = document.querySelector(".site-header");
  const trustStrip = document.getElementById("below-hero");

  const used =
    (announcement ? announcement.offsetHeight : 0) +
    (header ? header.offsetHeight : 0) +
    (trustStrip ? trustStrip.offsetHeight : 0) +
    32;

  heroInner.style.minHeight = `calc(100vh - ${used}px)`;
}

document.addEventListener("DOMContentLoaded", () => {
  renderPopularGrid();
  renderProductDetail();
  initCatalogPage();
  renderCartPage();
  renderWishlistPage();
  initLoginPage();
  setActiveNav();
  updateCartBadge();
  updateWishlistBadge();
  sizeHeroToViewport();
});

window.addEventListener("load", sizeHeroToViewport);
window.addEventListener("resize", sizeHeroToViewport);
