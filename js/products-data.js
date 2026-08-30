const PRODUCTS = [
  {
    id: "05",
    brand: "Nike",
    model: "Zoom Vomero 5",
    price: 189,
    image: "images/shoes/scarpe-05.webp",
    desc: "Sneaker running iconica in mesh traspirante e overlay argento metallizzato: comfort premium in chiave Y2K per l'uso quotidiano."
  },
  {
    id: "06",
    brand: "Adidas",
    model: "Samba Leopard",
    price: 159,
    image: "images/shoes/scarpe-06.webp",
    desc: "La Samba OG in cavallino leopardato con le iconiche tre strisce a contrasto: uno statement animalier per look dal carattere deciso."
  },
  {
    id: "07",
    brand: "Jordan",
    model: "4 Retro Red Thunder",
    price: 259,
    oldPrice: 324,
    image: "images/shoes/scarpe-07.webp",
    desc: "Nabuk rosso acceso, dettagli a rete e suola bianca a contrasto: la Jordan 4 che non passa mai inosservata."
  },
  {
    id: "08",
    brand: "Jordan",
    model: "1 Low Cream Pink",
    price: 179,
    image: "images/shoes/scarpe-08.webp",
    desc: "Pelle color crema e swoosh rosa cipria per la Jordan 1 Low: eleganza retro in una silhouette bassa e versatile."
  },
  {
    id: "09",
    brand: "Jordan",
    model: "6 Retro Washed Denim",
    price: 239,
    image: "images/shoes/scarpe-09.webp",
    desc: "Suede blu denim, dettagli corallo e suola traslucida: ispirazione workwear per una delle Jordan più amate."
  },
  {
    id: "10",
    brand: "Onitsuka Tiger",
    model: "Mexico 66",
    price: 119,
    oldPrice: 132,
    image: "images/shoes/scarpe-10.webp",
    desc: "Tomaia gialla e strisce nere a contrasto: il design giapponese che ha fatto la storia dello sport, sempre attuale."
  },
  {
    id: "11",
    brand: "Salomon",
    model: "XT-6 Vanilla Ice",
    price: 219,
    image: "images/shoes/scarpe-11.webp",
    desc: "Mesh tecnico, costruzione a strati e suola aggressiva: la silhouette da trail reinterpretata in chiave urban."
  },
  {
    id: "12",
    brand: "Asics",
    model: "Gel-1130",
    price: 149,
    oldPrice: 213,
    image: "images/shoes/scarpe-12.webp",
    desc: "Mesh nero e overlay bianchi a contrasto: il runner Asics che unisce prestazioni tecniche e stile street."
  }
];

const ADMIN_PRODUCTS_KEY = "bestStoreAdminProducts";

function getProducts() {
  try {
    const stored = localStorage.getItem(ADMIN_PRODUCTS_KEY);
    return stored ? JSON.parse(stored) : PRODUCTS;
  } catch {
    return PRODUCTS;
  }
}

function saveProducts(list) {
  localStorage.setItem(ADMIN_PRODUCTS_KEY, JSON.stringify(list));
}

function resetProducts() {
  localStorage.removeItem(ADMIN_PRODUCTS_KEY);
}
