const DATA_PATHS = {
  settings: "data/settings.json",
  services: "data/services.json",
  prices: "data/prices.json",
  testimonials: "data/testimonials.json",
  gallery: "data/gallery.json",
  orders: "data/orders.json",
  workers: "data/workers.json"
};

const ORDER_STATUSES = ["Baru", "Diproses", "Dicuci", "Dijemur", "Disetrika", "Packing", "Selesai", "Diambil", "Dikirim"];
const PAYMENT_STATUSES = ["Belum Bayar", "DP", "Lunas"];
const COMPLETED_STATUSES = ["Selesai", "Diambil", "Dikirim"];

const state = {
  settings: {},
  services: [],
  prices: [],
  testimonials: [],
  gallery: [],
  orders: [],
  workers: []
};

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0
});

document.addEventListener("DOMContentLoaded", async () => {
  document.getElementById("year")?.append(new Date().getFullYear());
  setupNavigation();

  try {
    await loadData();
    applySettings();

    if (document.body.dataset.page === "admin") {
      initDashboard();
    } else {
      initPublicSite();
    }
  } catch (error) {
    console.error(error);
    document.body.insertAdjacentHTML("afterbegin", `<div class="result-box">Data belum bisa dimuat. Pastikan file JSON tersedia.</div>`);
  }
});

async function loadData() {
  const entries = await Promise.all(
    Object.entries(DATA_PATHS).map(async ([key, path]) => {
      const response = await fetch(path);
      if (!response.ok) throw new Error(`Gagal memuat ${path}`);
      return [key, await response.json()];
    })
  );

  entries.forEach(([key, value]) => {
    state[key] = value;
  });
}

function setupNavigation() {
  const toggle = document.querySelector(".nav-toggle");
  const menu = document.querySelector(".nav-menu");
  if (!toggle || !menu) return;

  toggle.addEventListener("click", () => {
    const isOpen = menu.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  menu.addEventListener("click", (event) => {
    if (event.target.matches("a")) {
      menu.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    }
  });
}

function applySettings() {
  const settings = state.settings;
  document.querySelectorAll("[data-setting]").forEach((element) => {
    const key = element.dataset.setting;
    element.textContent = settings[key] || "";
  });

  document.querySelectorAll("[data-setting-image]").forEach((element) => {
    const key = element.dataset.settingImage;
    if (settings[key]) element.src = settings[key];
  });

  document.querySelectorAll("[data-social]").forEach((element) => {
    const url = settings[element.dataset.social];
    if (url) element.href = url;
  });

  const mapsFrame = document.getElementById("maps-frame");
  if (mapsFrame && settings.google_maps_embed) mapsFrame.src = settings.google_maps_embed;

  const floatingWhatsApp = document.getElementById("floating-whatsapp");
  if (floatingWhatsApp) floatingWhatsApp.href = buildWhatsAppUrl("Halo Fresh Laundry, saya ingin bertanya tentang layanan laundry.");
}

function initPublicSite() {
  renderServices();
  renderPrices();
  renderGallery();
  renderTestimonials();
  setupCalculator();
  setupTracking();
  setupWhatsAppOrder();
}

function renderServices() {
  const target = document.getElementById("services-list");
  if (!target) return;

  target.innerHTML = state.services
    .filter((service) => service.active)
    .map((service) => `
      <article class="service-card">
        <div class="service-icon" aria-hidden="true">${escapeHtml(service.name.slice(0, 2))}</div>
        <h3>${escapeHtml(service.name)}</h3>
        <p>${escapeHtml(service.description)}</p>
        <span class="badge">${escapeHtml(service.duration)}</span>
      </article>
    `)
    .join("");
}

function renderPrices() {
  const target = document.getElementById("prices-table");
  if (!target) return;

  target.innerHTML = state.prices
    .filter((item) => item.active)
    .map((item) => `
      <tr>
        <td><strong>${escapeHtml(item.service_name)}</strong></td>
        <td>${escapeHtml(item.unit)}</td>
        <td>${rupiah.format(item.price)}</td>
        <td>${item.estimated_days === 0 ? "Sesuai jadwal" : `${item.estimated_days} hari`}</td>
      </tr>
    `)
    .join("");
}

function renderGallery() {
  const target = document.getElementById("gallery-list");
  if (!target) return;

  target.innerHTML = state.gallery
    .filter((item) => item.active)
    .map((item) => `
      <article class="gallery-card">
        <img src="${escapeAttribute(item.image)}" alt="${escapeAttribute(item.title)}" loading="lazy">
        <div>
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.description)}</p>
        </div>
      </article>
    `)
    .join("");
}

function renderTestimonials() {
  const target = document.getElementById("testimonials-list");
  if (!target) return;

  target.innerHTML = state.testimonials
    .filter((item) => item.active)
    .map((item) => `
      <article class="testimonial-card">
        <img src="${escapeAttribute(item.photo)}" alt="${escapeAttribute(item.name)}" loading="lazy">
        <p class="stars">${"&#9733;".repeat(Number(item.rating || 0))}</p>
        <p>"${escapeHtml(item.message)}"</p>
        <strong>${escapeHtml(item.name)}</strong>
      </article>
    `)
    .join("");
}

function setupCalculator() {
  const serviceSelect = document.getElementById("calculator-service");
  const qtyInput = document.getElementById("calculator-qty");
  const result = document.getElementById("calculator-result");
  const button = document.getElementById("calculator-whatsapp");
  if (!serviceSelect || !qtyInput || !result || !button) return;

  const activePrices = state.prices.filter((item) => item.active);
  serviceSelect.innerHTML = activePrices.map((item) => `<option value="${escapeAttribute(item.id)}">${escapeHtml(item.service_name)} - ${rupiah.format(item.price)}/${escapeHtml(item.unit)}</option>`).join("");

  const update = () => {
    const selected = activePrices.find((item) => item.id === serviceSelect.value);
    const qty = Number(qtyInput.value || 0);
    if (!selected || qty <= 0) {
      result.textContent = "Masukkan berat atau jumlah yang valid.";
      return null;
    }

    const total = selected.price * qty;
    const estimate = selected.estimated_days === 0 ? "sesuai jadwal" : `${selected.estimated_days} hari`;
    result.innerHTML = `<strong>Total estimasi: ${rupiah.format(total)}</strong><br>Layanan ${escapeHtml(selected.service_name)}, ${qty} ${escapeHtml(selected.unit)}, estimasi selesai ${estimate}.`;
    return { selected, qty, total, estimate };
  };

  serviceSelect.addEventListener("change", update);
  qtyInput.addEventListener("input", update);
  button.addEventListener("click", () => {
    const calculation = update();
    if (!calculation) return;
    const message = [
      "Halo Fresh Laundry, saya ingin order laundry.",
      "",
      "Nama:",
      "Alamat:",
      "No. WhatsApp:",
      `Layanan: ${calculation.selected.service_name}`,
      `Berat / Jumlah: ${calculation.qty} ${calculation.selected.unit}`,
      `Estimasi Harga: ${rupiah.format(calculation.total)}`,
      "Catatan:"
    ].join("\n");
    window.open(buildWhatsAppUrl(message), "_blank", "noopener");
  });

  update();
}

function setupTracking() {
  const form = document.getElementById("tracking-form");
  const input = document.getElementById("tracking-invoice");
  const result = document.getElementById("tracking-result");
  if (!form || !input || !result) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const invoice = input.value.trim().toUpperCase();
    const order = state.orders.find((item) => item.invoice_number.toUpperCase() === invoice);

    if (!order) {
      result.innerHTML = `<strong>Invoice tidak ditemukan.</strong><br>Periksa kembali nomor invoice atau hubungi admin.`;
      return;
    }

    result.innerHTML = `
      <strong>${escapeHtml(order.invoice_number)}</strong><br>
      Customer: ${escapeHtml(order.customer_name)}<br>
      Layanan: ${escapeHtml(order.service)}<br>
      Total: ${rupiah.format(order.total_price)}<br>
      Pembayaran: ${escapeHtml(order.payment_status)}<br>
      Status: ${escapeHtml(order.order_status)}<br>
      Estimasi selesai: ${formatDate(order.estimated_done_at)}
    `;
  });
}

function setupWhatsAppOrder() {
  const form = document.getElementById("whatsapp-form");
  const serviceSelect = document.getElementById("wa-service");
  if (!form || !serviceSelect) return;

  serviceSelect.innerHTML = state.services
    .filter((service) => service.active)
    .map((service) => `<option value="${escapeAttribute(service.name)}">${escapeHtml(service.name)}</option>`)
    .join("");

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const message = [
      "Halo Fresh Laundry, saya ingin order laundry.",
      "",
      `Nama: ${valueOf("wa-name")}`,
      `Alamat: ${valueOf("wa-address")}`,
      `No. WhatsApp: ${valueOf("wa-phone")}`,
      `Layanan: ${valueOf("wa-service")}`,
      `Berat / Jumlah: ${valueOf("wa-qty")}`,
      `Catatan: ${valueOf("wa-notes")}`
    ].join("\n");
    window.open(buildWhatsAppUrl(message), "_blank", "noopener");
  });
}

function initDashboard() {
  renderDashboardCards();
  renderWorkerPerformance();
  setupOrderFilters();
  renderOrdersTable();
}

function renderDashboardCards() {
  const target = document.getElementById("dashboard-cards");
  if (!target) return;

  const today = new Date().toISOString().slice(0, 10);
  const orders = state.orders;
  const cards = [
    ["Total orders", orders.length],
    ["Orders hari ini", orders.filter((order) => order.created_at === today).length],
    ["Total revenue", rupiah.format(sum(orders, "total_price"))],
    ["Belum lunas", orders.filter((order) => order.payment_status !== "Lunas").length],
    ["Order selesai", orders.filter((order) => COMPLETED_STATUSES.includes(order.order_status)).length],
    ["Pekerja aktif", state.workers.filter((worker) => worker.active).length]
  ];

  target.innerHTML = cards
    .map(([label, value]) => `<article class="metric-card"><span>${label}</span><strong>${value}</strong></article>`)
    .join("");
}

function renderWorkerPerformance() {
  const target = document.getElementById("worker-performance");
  if (!target) return;

  target.innerHTML = state.workers
    .filter((worker) => worker.active)
    .map((worker) => {
      const handled = state.orders.filter((order) => order.handled_by === worker.name);
      const completed = handled.filter((order) => COMPLETED_STATUSES.includes(order.order_status));
      const pending = handled.length - completed.length;
      return `
        <tr>
          <td><strong>${escapeHtml(worker.name)}</strong><br><span class="muted">${escapeHtml(worker.role)}</span></td>
          <td>${handled.length}</td>
          <td>${rupiah.format(sum(handled, "total_price"))}</td>
          <td>${completed.length}</td>
          <td>${pending}</td>
        </tr>
      `;
    })
    .join("");
}

function setupOrderFilters() {
  fillSelect("filter-status", ORDER_STATUSES);
  fillSelect("filter-payment", PAYMENT_STATUSES);
  fillSelect("filter-worker", state.workers.map((worker) => worker.name));

  ["filter-search", "filter-status", "filter-payment", "filter-worker"].forEach((id) => {
    document.getElementById(id)?.addEventListener("input", renderOrdersTable);
    document.getElementById(id)?.addEventListener("change", renderOrdersTable);
  });
}

function renderOrdersTable() {
  const target = document.getElementById("orders-table");
  if (!target) return;

  const search = document.getElementById("filter-search")?.value.toLowerCase() || "";
  const status = document.getElementById("filter-status")?.value || "";
  const payment = document.getElementById("filter-payment")?.value || "";
  const worker = document.getElementById("filter-worker")?.value || "";

  const filtered = state.orders.filter((order) => {
    const matchesSearch = `${order.invoice_number} ${order.customer_name}`.toLowerCase().includes(search);
    const matchesStatus = !status || order.order_status === status;
    const matchesPayment = !payment || order.payment_status === payment;
    const matchesWorker = !worker || order.handled_by === worker;
    return matchesSearch && matchesStatus && matchesPayment && matchesWorker;
  });

  target.innerHTML = filtered
    .map((order) => `
      <tr>
        <td><strong>${escapeHtml(order.invoice_number)}</strong></td>
        <td>${escapeHtml(order.customer_name)}</td>
        <td>${escapeHtml(order.service)}</td>
        <td>${rupiah.format(order.total_price)}</td>
        <td><span class="badge ${paymentClass(order.payment_status)}">${escapeHtml(order.payment_status)}</span></td>
        <td><span class="badge ${statusClass(order.order_status)}">${escapeHtml(order.order_status)}</span></td>
        <td>${escapeHtml(order.handled_by)}</td>
      </tr>
    `)
    .join("") || `<tr><td colspan="7">Tidak ada order yang cocok.</td></tr>`;
}

function fillSelect(id, items) {
  const select = document.getElementById(id);
  if (!select) return;
  select.insertAdjacentHTML("beforeend", items.map((item) => `<option value="${escapeAttribute(item)}">${escapeHtml(item)}</option>`).join(""));
}

function buildWhatsAppUrl(message) {
  const number = String(state.settings.whatsapp_number || "").replace(/\D/g, "");
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

function valueOf(id) {
  return document.getElementById(id)?.value.trim() || "";
}

function sum(items, key) {
  return items.reduce((total, item) => total + Number(item[key] || 0), 0);
}

function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(value));
}

function paymentClass(status) {
  if (status === "Lunas") return "success";
  if (status === "DP") return "warning";
  return "danger";
}

function statusClass(status) {
  if (COMPLETED_STATUSES.includes(status)) return "success";
  if (status === "Baru") return "warning";
  return "";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}
