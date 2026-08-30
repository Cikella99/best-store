function productCardHTML(p) {
  return `
    <article class="product-card">
      <div class="product-image">
        <span class="badge">${p.badge}</span>
        <img src="${p.image}" alt="${p.brand} ${p.model}" loading="lazy">
      </div>
      <div class="product-info">
        <div class="product-title">
          <h3>${p.model}</h3>
          <span class="tag">${p.brand}</span>
        </div>
        <p class="product-desc">${p.desc}</p>
        <div class="product-footer">
          <span class="price">€${p.price}</span>
          <a href="prodotto.html?id=${p.id}" class="btn btn-primary btn-small">buy now</a>
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

document.addEventListener("DOMContentLoaded", () => {
  renderPopularGrid();
  renderProductDetail();
});
