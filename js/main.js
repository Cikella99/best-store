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
  const chipsWrap = document.getElementById("filter-chips");
  chipsWrap.innerHTML = ["Tutti", ...brands]
    .map(
      (b, i) =>
        `<button type="button" class="chip${i === 0 ? " active" : ""}" data-brand="${i === 0 ? "" : b}">${b}</button>`
    )
    .join("");

  let currentBrand = "";
  let currentSort = "default";

  function renderGrid() {
    let items = currentBrand ? PRODUCTS.filter((p) => p.brand === currentBrand) : PRODUCTS.slice();
    if (currentSort === "price-asc") items.sort((a, b) => a.price - b.price);
    if (currentSort === "price-desc") items.sort((a, b) => b.price - a.price);
    grid.innerHTML = items.length
      ? items.map(productCardHTML).join("")
      : '<p class="empty-state">Nessun prodotto trovato.</p>';
  }

  chipsWrap.addEventListener("click", (e) => {
    const btn = e.target.closest(".chip");
    if (!btn) return;
    chipsWrap.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
    btn.classList.add("active");
    currentBrand = btn.dataset.brand;
    renderGrid();
  });

  document.getElementById("sort-select").addEventListener("change", (e) => {
    currentSort = e.target.value;
    renderGrid();
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
  } else {
    document.querySelector('.main-nav > a[href="index.html"]')?.classList.add("active");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  renderPopularGrid();
  renderProductDetail();
  initCatalogPage();
  setActiveNav();
});
