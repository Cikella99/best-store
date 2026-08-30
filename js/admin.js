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

document.addEventListener("DOMContentLoaded", () => {
  const tableBody = document.getElementById("admin-table-body");
  const emptyState = document.getElementById("admin-empty");
  const countEl = document.getElementById("product-count");

  const modalBackdrop = document.getElementById("admin-modal-backdrop");
  const modalTitle = document.getElementById("admin-modal-title");
  const form = document.getElementById("product-form");
  const idField = document.getElementById("product-id");
  const brandField = document.getElementById("product-brand");
  const modelField = document.getElementById("product-model");
  const priceField = document.getElementById("product-price");
  const oldPriceField = document.getElementById("product-oldprice");
  const descField = document.getElementById("product-desc");
  const imageInput = document.getElementById("product-image-input");
  const imagePreview = document.getElementById("image-preview");
  const imagePlaceholder = document.getElementById("image-placeholder");

  let products = getProducts();
  let currentImage = "";

  function render() {
    countEl.textContent = products.length;
    emptyState.hidden = products.length > 0;

    tableBody.innerHTML = products
      .map((p) => {
        const discount = discountPercentAdmin(p);
        return `
          <tr data-id="${p.id}">
            <td><img class="admin-thumb" src="${adminImgSrc(p.image)}" alt="${p.brand} ${p.model}"></td>
            <td>${p.model}</td>
            <td>${p.brand}</td>
            <td>€${p.price}${p.oldPrice ? ` <span class="price-old">€${p.oldPrice}</span>` : ""}</td>
            <td>${discount ? `-${discount}%` : "&mdash;"}</td>
            <td class="admin-row-actions">
              <button type="button" class="link-btn edit-btn">Modifica</button>
              <button type="button" class="link-btn delete-btn">Elimina</button>
            </td>
          </tr>`;
      })
      .join("");
  }

  function openModal(product) {
    form.reset();
    imagePreview.hidden = true;
    imagePlaceholder.hidden = false;
    currentImage = "";

    if (product) {
      modalTitle.textContent = "Modifica prodotto";
      idField.value = product.id;
      brandField.value = product.brand;
      modelField.value = product.model;
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

  tableBody.addEventListener("click", (e) => {
    const row = e.target.closest("tr");
    if (!row) return;
    const id = row.dataset.id;
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
  });

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
    const data = {
      brand: brandField.value.trim(),
      model: modelField.value.trim(),
      price: Number(priceField.value),
      desc: descField.value.trim(),
      image: currentImage || "images/logo.jpeg"
    };
    if (oldPriceField.value) {
      data.oldPrice = Number(oldPriceField.value);
    }

    if (id) {
      products = products.map((p) => (p.id === id ? { ...p, ...data } : p));
    } else {
      data.id = Date.now().toString(36);
      products = [...products, data];
    }

    saveProducts(products);
    render();
    closeModal();
  });

  render();
});
