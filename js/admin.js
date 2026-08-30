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

document.addEventListener("DOMContentLoaded", () => {
  const tableBody = document.getElementById("admin-table-body");
  const viewTable = document.getElementById("view-table");
  const viewGrid = document.getElementById("view-grid");
  const emptyState = document.getElementById("admin-empty");
  const countEl = document.getElementById("product-count");
  const searchInput = document.getElementById("product-search");

  const modalBackdrop = document.getElementById("admin-modal-backdrop");
  const modalTitle = document.getElementById("admin-modal-title");
  const form = document.getElementById("product-form");
  const idField = document.getElementById("product-id");
  const brandField = document.getElementById("product-brand");
  const brandDatalist = document.getElementById("brand-datalist");
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
  const imagePreview = document.getElementById("image-preview");
  const imagePlaceholder = document.getElementById("image-placeholder");

  let products = getProducts();
  let currentImage = "";
  let currentView = "table";

  /* ---------- Tabs ---------- */

  document.querySelectorAll(".admin-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".admin-tab").forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      document.querySelectorAll(".admin-panel").forEach((p) => (p.hidden = true));
      document.getElementById(tab.dataset.panel).hidden = false;
      if (tab.dataset.panel === "panel-disposizione") renderOrderList();
    });
  });

  /* ---------- View toggle ---------- */

  document.querySelectorAll(".view-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".view-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentView = btn.dataset.view;
      viewTable.hidden = currentView !== "table";
      viewGrid.hidden = currentView !== "grid";
      render();
    });
  });

  searchInput.addEventListener("input", render);

  /* ---------- Product list (table + grid) ---------- */

  function getFilteredProducts() {
    const term = searchInput.value.trim().toLowerCase();
    if (!term) return products;
    return products.filter((p) => `${p.brand} ${p.model}`.toLowerCase().includes(term));
  }

  function productRowHTML(p) {
    const discount = discountPercentAdmin(p);
    return `
      <tr data-id="${p.id}">
        <td><img class="admin-thumb" src="${adminImgSrc(p.image)}" alt="${p.brand} ${p.model}"></td>
        <td>${p.model}</td>
        <td>${p.brand}</td>
        <td>${CATEGORY_LABELS[p.category] || "&mdash;"}</td>
        <td>€${p.price}${p.oldPrice ? ` <span class="price-old">€${p.oldPrice}</span>` : ""}</td>
        <td>${discount ? `-${discount}%` : "&mdash;"}</td>
        <td class="admin-row-actions">
          <button type="button" class="link-btn edit-btn">Modifica</button>
          <button type="button" class="link-btn delete-btn">Elimina</button>
        </td>
      </tr>`;
  }

  function productCardHTMLAdmin(p) {
    const discount = discountPercentAdmin(p);
    return `
      <div class="admin-product-card" data-id="${p.id}">
        <img src="${adminImgSrc(p.image)}" alt="${p.brand} ${p.model}">
        <span class="apc-brand">${p.brand}</span>
        <span class="apc-title">${p.model}</span>
        <span class="apc-meta">${CATEGORY_LABELS[p.category] || ""}</span>
        <span class="apc-price">€${p.price}${discount ? ` <span class="price-old">€${p.oldPrice}</span> -${discount}%` : ""}</span>
        <div class="apc-actions">
          <button type="button" class="link-btn edit-btn">Modifica</button>
          <button type="button" class="link-btn delete-btn">Elimina</button>
        </div>
      </div>`;
  }

  function render() {
    const filtered = getFilteredProducts();
    countEl.textContent = products.length;
    emptyState.hidden = filtered.length > 0;

    tableBody.innerHTML = filtered.map(productRowHTML).join("");
    viewGrid.innerHTML = filtered.map(productCardHTMLAdmin).join("");

    populateBrandDatalist();
  }

  function populateBrandDatalist() {
    const brands = [...new Set(products.map((p) => p.brand))].sort();
    brandDatalist.innerHTML = brands.map((b) => `<option value="${b}">`).join("");
  }

  /* ---------- Modal: subcategory, sizes ---------- */

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

  function openModal(product) {
    form.reset();
    imagePreview.hidden = true;
    imagePlaceholder.hidden = false;
    currentImage = "";
    setColorSelection(null);

    if (product) {
      modalTitle.textContent = "Modifica prodotto";
      idField.value = product.id;
      brandField.value = product.brand;
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
      currentImage = product.image;
      imagePreview.src = adminImgSrc(product.image);
      imagePreview.hidden = false;
      imagePlaceholder.hidden = true;
    } else {
      modalTitle.textContent = "Aggiungi prodotto";
      idField.value = "";
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
    const file = imageInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      currentImage = reader.result;
      imagePreview.src = currentImage;
      imagePreview.hidden = false;
      imagePlaceholder.hidden = true;
    };
    reader.readAsDataURL(file);
  });

  function handleListClick(e) {
    const item = e.target.closest("[data-id]");
    if (!item) return;
    const id = item.dataset.id;
    const product = products.find((p) => p.id === id);

    if (e.target.closest(".edit-btn")) {
      openModal(product);
    } else if (e.target.closest(".delete-btn")) {
      if (confirm(`Eliminare "${product.brand} ${product.model}" dal catalogo?`)) {
        products = products.filter((p) => p.id !== id);
        saveProducts(products);
        render();
      }
    }
  }

  tableBody.addEventListener("click", handleListClick);
  viewGrid.addEventListener("click", handleListClick);

  document.getElementById("reset-catalog-btn").addEventListener("click", () => {
    if (confirm("Ripristinare il catalogo originale? Le modifiche fatte da questo pannello andranno perse.")) {
      resetProducts();
      products = getProducts();
      render();
    }
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const id = idField.value;
    const selectedColor = document.querySelector('input[name="product-color"]:checked');
    const data = {
      brand: brandField.value.trim(),
      model: modelField.value.trim(),
      category: categoryField.value,
      gender: genderField.value,
      subcategory: subcategoryRow.hidden ? "" : subcategoryField.value,
      type: typeField.value,
      color: selectedColor ? selectedColor.value : "",
      price: Number(priceField.value),
      desc: descField.value.trim(),
      image: currentImage || "images/logo.jpeg"
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

  render();

  /* ---------- Disposizione (drag & drop ordering) ---------- */

  const orderList = document.getElementById("order-list");
  const disposizioneEmpty = document.getElementById("disposizione-empty");
  const sortSelect = document.getElementById("disposizione-sort");
  let activeFilter = "all";

  document.querySelectorAll(".chip-tab").forEach((chip) => {
    chip.addEventListener("click", () => {
      document.querySelectorAll(".chip-tab").forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      activeFilter = chip.dataset.filter;
      renderOrderList();
    });
  });

  function matchesFilter(p) {
    if (activeFilter === "all") return true;
    const [key, value] = activeFilter.split(":");
    if (key === "cat") return p.category === value;
    if (key === "gender") return p.gender === value || p.gender === "unisex";
    return true;
  }

  function getFilteredSorted() {
    const filtered = products.filter(matchesFilter);
    const sortMode = sortSelect.value;
    if (sortMode === "recent") {
      filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    } else if (sortMode === "oldest") {
      filtered.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
    } else {
      filtered.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }
    return filtered;
  }

  function renderOrderList() {
    const filtered = getFilteredSorted();
    disposizioneEmpty.hidden = filtered.length > 0;

    orderList.innerHTML = filtered
      .map(
        (p, i) => `
        <div class="order-item" draggable="true" data-id="${p.id}">
          <span class="order-num">${i + 1}</span>
          <svg class="drag-handle" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
            <circle cx="9" cy="6" r="1.4"/><circle cx="15" cy="6" r="1.4"/>
            <circle cx="9" cy="12" r="1.4"/><circle cx="15" cy="12" r="1.4"/>
            <circle cx="9" cy="18" r="1.4"/><circle cx="15" cy="18" r="1.4"/>
          </svg>
          <img src="${adminImgSrc(p.image)}" alt="${p.brand} ${p.model}">
          <div class="order-info">
            <strong>${p.brand} ${p.model}</strong>
            <span class="order-tags">${CATEGORY_LABELS[p.category] || ""} &middot; ${GENDER_LABELS[p.gender] || ""}</span>
          </div>
        </div>`
      )
      .join("");

    attachDragHandlers();
  }

  function attachDragHandlers() {
    const items = orderList.querySelectorAll(".order-item");

    items.forEach((item) => {
      item.addEventListener("dragstart", () => {
        item.classList.add("dragging");
      });
      item.addEventListener("dragend", () => {
        item.classList.remove("dragging");
        persistCurrentOrder();
      });
    });

    orderList.addEventListener("dragover", (e) => {
      e.preventDefault();
      const dragging = orderList.querySelector(".dragging");
      if (!dragging) return;
      const after = getDragAfterElement(orderList, e.clientY);
      if (after == null) {
        orderList.appendChild(dragging);
      } else {
        orderList.insertBefore(dragging, after);
      }
    });
  }

  function getDragAfterElement(container, y) {
    const els = [...container.querySelectorAll(".order-item:not(.dragging)")];
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

  function persistCurrentOrder() {
    const filtered = getFilteredSorted();
    const originalOrders = filtered.map((p) => p.order ?? 0).sort((a, b) => a - b);
    const newIdSequence = [...orderList.querySelectorAll(".order-item")].map((el) => el.dataset.id);

    newIdSequence.forEach((id, i) => {
      const product = products.find((p) => p.id === id);
      if (product) product.order = originalOrders[i];
    });

    saveProducts(products);
    renderOrderList();
  }

  sortSelect.addEventListener("change", () => {
    if (sortSelect.value === "current") {
      renderOrderList();
      return;
    }
    // Applying a sort re-arranges the filtered set and saves it as the new order.
    const filtered = getFilteredSorted();
    const originalOrders = filtered.map((p) => p.order ?? 0).sort((a, b) => a - b);
    filtered.forEach((p, i) => {
      p.order = originalOrders[i];
    });
    saveProducts(products);
    sortSelect.value = "current";
    renderOrderList();
  });

  renderOrderList();
});
