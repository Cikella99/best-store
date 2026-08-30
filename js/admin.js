function discountPercentAdmin(p) {
  if (!p.oldPrice) return 0;
  return Math.round((1 - p.price / p.oldPrice) * 100);
}

// Product image paths are stored site-root-relative (e.g. "images/x.webp")
// so the storefront pages at the root can use them directly. This admin
// page lives one folder down, so displaying them here needs a "../" prefix.
function adminImgSrc(path) {
  if (!path || path.startsWith("data:") || path.startsWith("http") || path.startsWith("../")) {
    return path;
  }
  return `../${path}`;
}

function totalUnits(p) {
  if (!p.sizes) return null;
  return Object.values(p.sizes).reduce((sum, n) => sum + (Number(n) || 0), 0);
}

const CATEGORY_LABELS = { shoes: "Scarpe", clothing: "Abbigliamento", accessories: "Accessori" };
const GENDER_LABELS = { men: "Uomo", woman: "Donna", unisex: "Unisex" };
const SIZE_LIST = ["39", "40", "41", "42", "43", "44", "45"];

const SUBCATEGORY_OPTIONS = {
  clothing: [
    { value: "tshirts", label: "T-shirts" },
    { value: "pants", label: "Pants" },
    { value: "felpe", label: "Felpe" },
    { value: "giacche", label: "Giacche" }
  ],
  accessories: [
    { value: "cappelli", label: "Cappelli" },
    { value: "calzini", label: "Calzini" },
    { value: "borse", label: "Borse" }
  ]
};

const ORDER_STATUS_LABELS = {
  received: "Ricevuto",
  processing: "In lavorazione",
  shipping: "In spedizione",
  delivered: "Consegnato",
  cancelled: "Annullato"
};

document.addEventListener("DOMContentLoaded", () => {
  const viewTable = document.getElementById("view-table");
  const tableBody = document.getElementById("admin-table-body");
  const orderList = document.getElementById("order-list");
  const emptyState = document.getElementById("admin-empty");
  const countEl = document.getElementById("product-count");
  const searchInput = document.getElementById("product-search");

  const modalBackdrop = document.getElementById("admin-modal-backdrop");
  const modalTitle = document.getElementById("admin-modal-title");
  const form = document.getElementById("product-form");
  const idField = document.getElementById("product-id");
  const brandSelect = document.getElementById("product-brand-select");
  const brandCustomRow = document.getElementById("product-brand-custom-row");
  const brandCustomInput = document.getElementById("product-brand-custom");
  const modelField = document.getElementById("product-model");
  const categoryField = document.getElementById("product-category");
  const genderField = document.getElementById("product-gender");
  const subcategoryField = document.getElementById("product-subcategory");
  const subcategoryRow = document.getElementById("subcategory-row");
  const typeField = document.getElementById("product-type");
  const sizesRow = document.getElementById("sizes-row");
  const sizesGrid = document.getElementById("sizes-stock-grid");
  const priceField = document.getElementById("product-price");
  const oldPriceField = document.getElementById("product-oldprice");
  const descField = document.getElementById("product-desc");
  const imageInput = document.getElementById("product-image-input");
  const imageGallery = document.getElementById("admin-image-gallery");

  let products = getProducts();
  let currentImages = [];
  let currentView = "grid";
  let activeFilter = "all";

  /* ---------- Tabs: Prodotti / Ordini ---------- */

  const tabProducts = document.getElementById("tab-products");
  const tabOrders = document.getElementById("tab-orders");

  document.querySelectorAll(".admin-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".admin-tab").forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      const isOrders = tab.dataset.tab === "orders";
      tabProducts.hidden = isOrders;
      tabOrders.hidden = !isOrders;
      if (isOrders) renderOrders();
    });
  });

  /* ---------- View toggle ---------- */

  document.querySelectorAll(".view-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".view-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentView = btn.dataset.view;
      render();
    });
  });

  /* ---------- Filters: chips + search + sort ---------- */

  document.querySelectorAll(".chip-tab").forEach((chip) => {
    chip.addEventListener("click", () => {
      document.querySelectorAll(".chip-tab").forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      activeFilter = chip.dataset.filter;
      render();
    });
  });

  searchInput.addEventListener("input", render);

  function matchesSingleFilter(filter, p) {
    if (filter === "all") return true;
    if (filter === "sale") return !!p.oldPrice;
    const [key, value] = filter.split(":");
    if (key === "cat") return p.category === value;
    if (key === "gender") return p.gender === value || p.gender === "unisex";
    if (key === "sub") return p.subcategory === value;
    return true;
  }

  // Compound filters (e.g. "gender:men+sub:tshirts") require every "+"-joined
  // condition to match, since subcategory pages on the storefront only exist
  // nested under a gender.
  function matchesFilter(p) {
    return activeFilter.split("+").every((f) => matchesSingleFilter(f, p));
  }

  function matchesSearch(p) {
    const term = searchInput.value.trim().toLowerCase();
    if (!term) return true;
    return `${p.brand} ${p.model}`.toLowerCase().includes(term);
  }

  function getFilteredSorted() {
    return products.filter((p) => matchesFilter(p) && matchesSearch(p)).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  /* ---------- Rendering ---------- */

  const dragHandleSVG = `<svg class="drag-handle" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
    <circle cx="9" cy="6" r="1.4"/><circle cx="15" cy="6" r="1.4"/>
    <circle cx="9" cy="12" r="1.4"/><circle cx="15" cy="12" r="1.4"/>
    <circle cx="9" cy="18" r="1.4"/><circle cx="15" cy="18" r="1.4"/>
  </svg>`;

  const deleteIconSVG = `<svg viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;

  function tableRowHTML(p, index) {
    const discount = discountPercentAdmin(p);
    const units = totalUnits(p);
    return `
      <tr draggable="true" data-id="${p.id}">
        <td class="drag-handle-cell">${dragHandleSVG}</td>
        <td class="order-num-cell">${index}</td>
        <td><img class="admin-thumb" src="${adminImgSrc(p.image)}" alt="${p.brand} ${p.model}"></td>
        <td>${p.model}</td>
        <td>${p.brand}</td>
        <td>${CATEGORY_LABELS[p.category] || "&mdash;"}</td>
        <td>${units === null ? "&mdash;" : units}</td>
        <td>€${p.price}${p.oldPrice ? ` <span class="price-old">€${p.oldPrice}</span>` : ""}</td>
        <td>${discount ? `-${discount}%` : "&mdash;"}</td>
        <td class="admin-row-actions">
          <button type="button" class="cart-item-remove delete-btn" aria-label="Elimina">${deleteIconSVG}</button>
        </td>
      </tr>`;
  }

  function gridCardHTML(p, index) {
    const discount = discountPercentAdmin(p);
    return `
      <div class="order-item" draggable="true" data-id="${p.id}">
        ${dragHandleSVG}
        <button type="button" class="cart-item-remove delete-btn" aria-label="Elimina">${deleteIconSVG}</button>
        <img src="${adminImgSrc(p.image)}" alt="${p.brand} ${p.model}">
        <div class="order-info">
          <span class="order-tags">#${index} &middot; ${CATEGORY_LABELS[p.category] || ""} &middot; ${GENDER_LABELS[p.gender] || ""}</span>
          <span class="apc-brand">${p.brand}</span>
          <strong class="apc-title">${p.model}</strong>
          <span class="apc-price">€${p.price}${discount ? ` <span class="price-old">€${p.oldPrice}</span> -${discount}%` : ""}</span>
        </div>
      </div>`;
  }

  function render() {
    const filtered = getFilteredSorted();
    countEl.textContent = products.length;
    emptyState.hidden = filtered.length > 0;
    populateBrandDropdown();

    if (currentView === "table") {
      viewTable.hidden = false;
      orderList.hidden = true;
      tableBody.innerHTML = filtered.map((p, i) => tableRowHTML(p, i + 1)).join("");
      attachRowInteractions(tableBody, "list");
    } else {
      viewTable.hidden = true;
      orderList.hidden = false;
      orderList.innerHTML = filtered.map((p, i) => gridCardHTML(p, i + 1)).join("");
      attachRowInteractions(orderList, "grid");
    }
  }

  function populateBrandDropdown(selectedBrand) {
    const brands = [...new Set(products.map((p) => p.brand))].sort();
    brandSelect.innerHTML =
      `<option value="" disabled${selectedBrand ? "" : " selected"}>Seleziona un brand</option>` +
      brands.map((b) => `<option value="${b}">${b}</option>`).join("") +
      `<option value="__other__">Altro</option>`;
    if (selectedBrand) brandSelect.value = brands.includes(selectedBrand) ? selectedBrand : "__other__";
  }

  brandSelect.addEventListener("change", () => {
    const isOther = brandSelect.value === "__other__";
    brandCustomRow.hidden = !isOther;
    brandCustomInput.required = isOther;
    if (isOther) brandCustomInput.focus();
  });

  /* ---------- Click to open, delete button, drag reorder ---------- */

  function attachRowInteractions(container, mode) {
    const items = container.querySelectorAll("[data-id]");

    items.forEach((item) => {
      item.addEventListener("click", (e) => {
        if (e.target.closest(".delete-btn") || e.target.closest(".drag-handle")) return;
        const product = products.find((p) => p.id === item.dataset.id);
        if (product) openModal(product);
      });

      item.querySelector(".delete-btn")?.addEventListener("click", (e) => {
        e.stopPropagation();
        const product = products.find((p) => p.id === item.dataset.id);
        if (!product) return;
        if (confirm(`Eliminare "${product.brand} ${product.model}" dal catalogo?`)) {
          products = products.filter((p) => p.id !== product.id);
          saveProducts(products);
          render();
        }
      });

      item.addEventListener("dragstart", () => item.classList.add("dragging"));
      item.addEventListener("dragend", () => {
        item.classList.remove("dragging");
        persistCurrentOrder(container);
      });
    });

    container.addEventListener("dragover", (e) => {
      e.preventDefault();
      const dragging = container.querySelector(".dragging");
      if (!dragging) return;
      const after =
        mode === "grid" ? getDragAfterElementGrid(container, e.clientX, e.clientY) : getDragAfterElement(container, e.clientY);
      if (after == null) {
        container.appendChild(dragging);
      } else {
        container.insertBefore(dragging, after);
      }
    });
  }

  function getDragAfterElement(container, y) {
    const els = [...container.querySelectorAll("[data-id]:not(.dragging)")];
    return els.reduce(
      (closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
          return { offset, element: child };
        }
        return closest;
      },
      { offset: Number.NEGATIVE_INFINITY, element: null }
    ).element;
  }

  // Grid layout needs a 2D-aware check: find the nearest card to the
  // pointer, then decide whether to drop before or after it based on
  // which side of its center the pointer is on.
  function getDragAfterElementGrid(container, x, y) {
    const els = [...container.querySelectorAll("[data-id]:not(.dragging)")];
    let nearest = null;
    let nearestDist = Number.POSITIVE_INFINITY;

    els.forEach((child) => {
      const box = child.getBoundingClientRect();
      const centerX = box.left + box.width / 2;
      const centerY = box.top + box.height / 2;
      const dist = (x - centerX) ** 2 + (y - centerY) ** 2;
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = { element: child, isAfter: x > centerX };
      }
    });

    if (!nearest) return null;
    return nearest.isAfter ? nearest.element.nextElementSibling : nearest.element;
  }

  function persistCurrentOrder(container) {
    const filtered = getFilteredSorted();
    const originalOrders = filtered.map((p) => p.order ?? 0).sort((a, b) => a - b);
    const newIdSequence = [...container.querySelectorAll("[data-id]")].map((el) => el.dataset.id);

    newIdSequence.forEach((id, i) => {
      const product = products.find((p) => p.id === id);
      if (product) product.order = originalOrders[i];
    });

    saveProducts(products);
    render();
  }

  /* ---------- Modal: add / edit ---------- */

  function updateSubcategoryOptions(category, selectedValue) {
    const options = SUBCATEGORY_OPTIONS[category] || [];
    if (!options.length) {
      subcategoryRow.hidden = true;
      subcategoryField.innerHTML = "";
      return;
    }
    subcategoryRow.hidden = false;
    subcategoryField.innerHTML = options.map((o) => `<option value="${o.value}">${o.label}</option>`).join("");
    if (selectedValue) subcategoryField.value = selectedValue;
  }

  function buildSizesGrid(category, existingSizes) {
    if (category !== "shoes") {
      sizesRow.hidden = true;
      sizesGrid.innerHTML = "";
      return;
    }
    sizesRow.hidden = false;
    const sizes = existingSizes || {};
    sizesGrid.innerHTML = SIZE_LIST.map(
      (size) => `
        <label class="size-stock-item">
          <span>${size}</span>
          <input type="number" min="0" step="1" data-size="${size}" value="${sizes[size] || 0}">
        </label>`
    ).join("");

    sizesGrid.querySelectorAll("input").forEach((input) => {
      input.addEventListener("focus", () => input.select());
    });
  }

  categoryField.addEventListener("change", () => {
    updateSubcategoryOptions(categoryField.value);
    buildSizesGrid(categoryField.value);
  });

  function setColorSelection(value) {
    document.querySelectorAll('input[name="product-color"]').forEach((r) => {
      r.checked = r.value === value;
    });
  }

  function renderImageGallery() {
    imageGallery.innerHTML = currentImages.length
      ? currentImages
          .map(
            (src, i) => `
        <div class="admin-image-thumb${i === 0 ? " is-cover" : ""}">
          <img src="${adminImgSrc(src)}" alt="Foto ${i + 1}">
          <button type="button" class="admin-image-remove" data-index="${i}" aria-label="Rimuovi foto">${deleteIconSVG}</button>
        </div>`
          )
          .join("")
      : `<p class="admin-image-empty">Nessuna foto caricata</p>`;

    imageGallery.querySelectorAll(".admin-image-remove").forEach((btn) => {
      btn.addEventListener("click", () => {
        currentImages.splice(Number(btn.dataset.index), 1);
        renderImageGallery();
      });
    });
  }

  function openModal(product) {
    form.reset();
    currentImages = product ? productImages(product).slice() : [];
    renderImageGallery();
    setColorSelection(null);

    brandCustomRow.hidden = true;
    brandCustomInput.value = "";
    brandCustomInput.required = false;

    if (product) {
      modalTitle.textContent = "Modifica prodotto";
      idField.value = product.id;
      populateBrandDropdown(product.brand);
      modelField.value = product.model;
      categoryField.value = product.category || "shoes";
      genderField.value = product.gender || "unisex";
      updateSubcategoryOptions(categoryField.value, product.subcategory);
      buildSizesGrid(categoryField.value, product.sizes);
      typeField.value = product.type || "";
      setColorSelection(product.color);
      priceField.value = product.price;
      oldPriceField.value = product.oldPrice || "";
      descField.value = product.desc || "";
    } else {
      modalTitle.textContent = "Aggiungi prodotto";
      idField.value = "";
      populateBrandDropdown();
      categoryField.value = "shoes";
      genderField.value = "unisex";
      updateSubcategoryOptions("shoes");
      buildSizesGrid("shoes");
    }

    modalBackdrop.hidden = false;
  }

  function closeModal() {
    modalBackdrop.hidden = true;
  }

  document.getElementById("add-product-btn").addEventListener("click", () => openModal(null));
  document.getElementById("admin-modal-close").addEventListener("click", closeModal);
  document.getElementById("admin-cancel-btn").addEventListener("click", closeModal);
  modalBackdrop.addEventListener("click", (e) => {
    if (e.target === modalBackdrop) closeModal();
  });

  imageInput.addEventListener("change", () => {
    const files = [...imageInput.files];
    if (!files.length) return;
    const startIndex = currentImages.length;
    files.forEach((file, i) => {
      const reader = new FileReader();
      reader.onload = () => {
        currentImages[startIndex + i] = reader.result;
        renderImageGallery();
      };
      reader.readAsDataURL(file);
    });
    imageInput.value = "";
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const id = idField.value;
    const selectedColor = document.querySelector('input[name="product-color"]:checked');
    const brand = brandSelect.value === "__other__" ? brandCustomInput.value.trim() : brandSelect.value;
    const data = {
      brand,
      model: modelField.value.trim(),
      category: categoryField.value,
      gender: genderField.value,
      subcategory: subcategoryRow.hidden ? "" : subcategoryField.value,
      type: typeField.value,
      color: selectedColor ? selectedColor.value : "",
      price: Number(priceField.value),
      desc: descField.value.trim(),
      image: currentImages[0] || "images/logo.jpeg",
      images: currentImages.length > 1 ? currentImages.slice() : undefined
    };
    if (oldPriceField.value) {
      data.oldPrice = Number(oldPriceField.value);
    }
    if (!sizesRow.hidden) {
      const sizes = {};
      sizesGrid.querySelectorAll("input[data-size]").forEach((input) => {
        sizes[input.dataset.size] = Number(input.value) || 0;
      });
      data.sizes = sizes;
    }

    if (id) {
      products = products.map((p) => (p.id === id ? { ...p, ...data } : p));
    } else {
      const maxOrder = products.reduce((max, p) => Math.max(max, p.order ?? 0), -1);
      data.id = Date.now().toString(36);
      data.order = maxOrder + 1;
      data.createdAt = new Date().toISOString();
      products = [...products, data];
    }

    saveProducts(products);
    render();
    closeModal();
  });

  /* ---------- Ordini ---------- */

  const ordersCountEl = document.getElementById("orders-count");
  const ordersTableBody = document.getElementById("orders-table-body");
  const ordersEmpty = document.getElementById("orders-empty");
  const ordersSearchInput = document.getElementById("orders-search");

  function matchesOrderSearch(order) {
    const term = ordersSearchInput.value.trim().toLowerCase();
    if (!term) return true;
    const haystack = `${order.id} ${order.items.map((it) => `${it.brand} ${it.model}`).join(" ")}`.toLowerCase();
    return haystack.includes(term);
  }

  ordersSearchInput.addEventListener("input", renderOrders);

  function orderRowHTML(order) {
    const date = new Date(order.createdAt).toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" });
    const itemsSummary = order.items.map((it) => `${it.qty}× ${it.model}`).join(", ");
    const thumbs = order.items
      .map((it) => `<img class="admin-thumb admin-thumb-sm" src="${adminImgSrc(it.image)}" alt="${it.brand} ${it.model}">`)
      .join("");
    const statusOptions = Object.entries(ORDER_STATUS_LABELS)
      .map(([value, label]) => `<option value="${value}" ${order.status === value ? "selected" : ""}>${label}</option>`)
      .join("");
    return `
      <tr data-id="${order.id}">
        <td>${order.id}</td>
        <td>${date}</td>
        <td>
          <div class="order-products-cell">
            <div class="order-products-thumbs">${thumbs}</div>
            <span>${itemsSummary}</span>
          </div>
        </td>
        <td>€${order.total}</td>
        <td>
          <select class="disposizione-sort order-status-select" data-id="${order.id}">${statusOptions}</select>
        </td>
      </tr>`;
  }

  function renderOrders() {
    const allOrders = getOrders();
    const orders = allOrders
      .filter(matchesOrderSearch)
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    ordersCountEl.textContent = allOrders.length;
    ordersEmpty.hidden = orders.length > 0;
    ordersTableBody.innerHTML = orders.map(orderRowHTML).join("");

    ordersTableBody.querySelectorAll(".order-status-select").forEach((select) => {
      select.addEventListener("change", () => {
        const list = getOrders();
        const order = list.find((o) => o.id === select.dataset.id);
        if (order) {
          order.status = select.value;
          saveOrders(list);
        }
      });
    });
  }

  render();
});
