(() => {
  const initialReports = [
    {
      id: "r1",
      type: "Agua acumulada",
      place: "El Porvenir",
      age: "hace 12 min",
      status: "review",
      description: "Agua acumulada en parte de la vía. Imagen ilustrativa del prototipo.",
      photo: "assets/r-anegamiento.jpg",
      alt: "Agua acumulada sobre una vía"
    },
    {
      id: "r2",
      type: "Zona lodosa",
      place: "Florencia de Mora",
      age: "hace 24 min",
      status: "community",
      description: "Vecinos señalan lodo cerca de la entrada al sector. Foto de demostración.",
      photo: "assets/r-lodo.jpg",
      alt: "Zona con lodo junto a viviendas"
    },
    {
      id: "r3",
      type: "Vivienda afectada",
      place: "Río Seco",
      age: "hace 1 h",
      status: "review",
      description: "Registro ilustrativo de una vivienda expuesta a daños.",
      photo: "assets/r-vivienda.jpg",
      alt: "Vivienda en una zona expuesta"
    }
  ];
  const statusLabels = { review: "En revisión", community: "Confirmado por vecinos", resolved: "Atendido" };
  const reports = [...initialReports];
  const state = { filter: "all", zoom: 1, toastTimer: 0, pendingPhoto: "" };

  const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  const icon = (name) => `<svg class="icon" aria-hidden="true"><use href="#i-${name}"></use></svg>`;
  const getReport = (id) => reports.find((report) => report.id === id);

  function statusTag(status) {
    const className = status === "community" ? "status-community" : status === "resolved" ? "status-resolved" : "status-review";
    return `<span class="status-tag ${className}">${escapeHTML(statusLabels[status] || statusLabels.review)}</span>`;
  }

  function compactReport(report) {
    return `<article class="compact-report">
      <div class="report-thumb"><img src="${escapeHTML(report.photo)}" alt="${escapeHTML(report.alt || report.type)}" loading="lazy"></div>
      <div class="compact-report-copy"><strong>${escapeHTML(report.type)}</strong><span>${icon("pin")}${escapeHTML(report.place)} · <span class="report-time">${icon("clock")}${escapeHTML(report.age)}</span></span></div>
      ${statusTag(report.status)}
    </article>`;
  }

  function reportCard(report) {
    return `<article class="report-card" data-status="${escapeHTML(report.status)}">
      <img class="report-card-photo" src="${escapeHTML(report.photo)}" alt="${escapeHTML(report.alt || report.type)}" loading="lazy">
      <div class="report-card-body">
        <div class="report-card-top"><h2 class="report-type">${escapeHTML(report.type)}</h2>${statusTag(report.status)}</div>
        <div class="report-details"><span>${icon("pin")}${escapeHTML(report.place)}</span><span>${icon("clock")}${escapeHTML(report.age)}</span></div>
        <p class="report-description">${escapeHTML(report.description)}</p>
        <div class="report-card-actions"><span class="report-details">${report.isDemo ? "En esta sesión" : "Imagen de demostración"}</span><button class="text-button" type="button" data-report-id="${escapeHTML(report.id)}">Ver en mapa</button></div>
      </div>
    </article>`;
  }

  function renderReports() {
    const compact = reports.map(compactReport).join("");
    ["home-report-list", "map-report-list"].forEach((id) => {
      const container = document.getElementById(id);
      if (container) container.innerHTML = compact;
    });

    const visible = reports.filter((report) => state.filter === "all" || report.status === state.filter);
    const reportList = document.getElementById("report-list");
    if (reportList) {
      reportList.innerHTML = visible.length
        ? visible.map(reportCard).join("")
        : `<div class="empty-state"><strong>No hay reportes en esta categoría</strong>Cuando haya avisos que coincidan, aparecerán aquí.</div>`;
    }

    ["all", "review", "community", "resolved"].forEach((filter) => {
      const count = filter === "all" ? reports.length : reports.filter((report) => report.status === filter).length;
      const node = document.getElementById(`filter-count-${filter}`);
      if (node) node.textContent = String(count);
    });
    document.querySelectorAll(".count-badge, #nav-report-count").forEach((node) => { node.textContent = String(reports.length); });
    updateMapMarkers();
  }

  function updateMapMarkers() {
    const mapCoordinates = {
      "El Porvenir": [498, 195],
      "Florencia de Mora": [365, 310],
      "Alto Trujillo": [180, 105],
      "Río Seco": [357, 284],
      "Trujillo": [580, 355],
      "Otra zona": [410, 230]
    };
    document.querySelectorAll(".map-visual").forEach((svg) => {
      svg.querySelectorAll("[data-user-report]").forEach((marker) => marker.remove());
      reports.filter((report) => report.isDemo).forEach((report) => {
        const [x, y] = mapCoordinates[report.place] || mapCoordinates["Otra zona"];
        const marker = document.createElementNS("http://www.w3.org/2000/svg", "g");
        marker.setAttribute("class", "map-marker marker-warning");
        marker.setAttribute("data-layer", "reports");
        marker.setAttribute("data-report-id", report.id);
        marker.setAttribute("data-user-report", "true");
        marker.setAttribute("tabindex", "0");
        marker.setAttribute("role", "button");
        marker.setAttribute("aria-label", `Reporte de ${report.type}, ${report.place}`);
        marker.innerHTML = `<circle cx="${x}" cy="${y}" r="13"></circle><path d="M${x} ${y - 7}v8m0 5h.01"></path>`;
        svg.append(marker);
      });
    });
    applyMapLayers();
  }

  function applyMapLayers() {
    document.querySelectorAll("[data-layer-toggle]").forEach((button) => {
      const layer = button.dataset.layerToggle;
      const enabled = button.getAttribute("aria-pressed") === "true";
      document.querySelectorAll(`.map-visual [data-layer="${layer}"]`).forEach((item) => item.classList.toggle("is-hidden", !enabled));
    });
  }

  function navigate(page, updateHash = true) {
    const validPages = ["home", "map", "reports", "prepare", "history"];
    const target = validPages.includes(page) ? page : "home";
    document.querySelectorAll("[data-view]").forEach((view) => {
      const active = view.dataset.view === target;
      view.classList.toggle("is-active", active);
      view.hidden = !active;
    });
    document.querySelectorAll("[data-page]").forEach((button) => {
      const active = button.dataset.page === target;
      button.classList.toggle("is-active", active);
      if (active) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });
    if (updateHash && location.hash !== `#${target}`) history.replaceState(null, "", `#${target}`);
    document.getElementById("main-content")?.scrollTo({ top: 0, behavior: "smooth" });
  }

  function showToast(message) {
    const toast = document.getElementById("toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(state.toastTimer);
    state.toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 3200);
  }

  function showMapDetails(id) {
    const panel = document.getElementById("map-selected");
    if (!panel) return;
    const report = getReport(id);
    if (report) {
      panel.innerHTML = `${icon("message")}<span><strong>${escapeHTML(report.type)} · ${escapeHTML(report.place)}</strong> — ${escapeHTML(statusLabels[report.status])}; ${escapeHTML(report.age)}. ${escapeHTML(report.description)}</span>`;
    } else if (id === "sensor-1") {
      panel.innerHTML = `${icon("gauge")}<span><strong>Sensor de cauce</strong> — Lectura simulada: nivel 0, condición seca.</span>`;
    } else if (id?.startsWith("safe-")) {
      panel.innerHTML = `${icon("shield")}<span><strong>Punto de referencia segura</strong> — Ubicación esquemática; confirma rutas con Defensa Civil.</span>`;
    }
  }

  document.addEventListener("click", (event) => {
    const pageButton = event.target.closest("[data-page]");
    if (pageButton) {
      event.preventDefault();
      navigate(pageButton.dataset.page);
      return;
    }

    if (event.target.closest(".report-open")) {
      const dialog = document.getElementById("report-dialog");
      if (dialog?.showModal) dialog.showModal();
      else dialog?.setAttribute("open", "");
      return;
    }

    if (event.target.closest("[data-close-dialog]")) {
      document.getElementById("report-dialog")?.close();
      return;
    }

    const filterButton = event.target.closest("[data-filter]");
    if (filterButton) {
      state.filter = filterButton.dataset.filter;
      document.querySelectorAll("[data-filter]").forEach((button) => {
        const selected = button === filterButton;
        button.classList.toggle("is-selected", selected);
        button.setAttribute("aria-pressed", String(selected));
      });
      renderReports();
      return;
    }

    const layerButton = event.target.closest("[data-layer-toggle]");
    if (layerButton) {
      const enabled = layerButton.getAttribute("aria-pressed") !== "true";
      layerButton.setAttribute("aria-pressed", String(enabled));
      layerButton.classList.toggle("is-on", enabled);
      applyMapLayers();
      return;
    }

    const reportButton = event.target.closest("[data-report-id]");
    if (reportButton) {
      navigate("map");
      showMapDetails(reportButton.dataset.reportId);
      return;
    }

    const zoomButton = event.target.closest("[data-zoom]");
    if (zoomButton) {
      state.zoom = Math.min(1.5, Math.max(0.85, state.zoom + (zoomButton.dataset.zoom === "in" ? 0.1 : -0.1)));
      document.querySelectorAll(".map-frame-full .map-visual").forEach((svg) => {
        svg.style.transform = `scale(${state.zoom})`;
        svg.style.transition = "transform .2s ease";
      });
      return;
    }

    const chartButton = event.target.closest("[data-chart]");
    if (chartButton) {
      document.querySelectorAll("[data-chart]").forEach((button) => button.classList.toggle("is-selected", button === chartButton));
      const svg = document.getElementById("history-chart");
      const line = svg?.querySelector(".chart-line");
      const area = svg?.querySelector(".chart-area");
      const circle = svg?.querySelector("circle");
      if (chartButton.dataset.chart === "level") {
        const points = "M36 151 86 150 136 149 186 147 236 144 286 139 336 92 386 74 436 101 486 121 536 132 586 139 636 142 686 141 770 143";
        line?.setAttribute("d", points);
        area?.setAttribute("d", `${points}v19H36z`);
        circle?.setAttribute("cy", "74");
      } else {
        const points = "M36 148 86 148 136 140 186 143 236 127 286 58 336 39 386 95 436 121 486 137 536 142 586 143 636 145 686 143 770 144";
        line?.setAttribute("d", points);
        area?.setAttribute("d", `${points}v18H36z`);
        circle?.setAttribute("cy", "39");
      }
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const marker = event.target.closest(".map-marker[data-report-id]");
    if (!marker) return;
    event.preventDefault();
    showMapDetails(marker.dataset.reportId);
  });

  document.getElementById("report-dialog")?.addEventListener("click", (event) => {
    if (event.target === event.currentTarget) event.currentTarget.close();
  });

  const checklist = [...document.querySelectorAll("[data-check]")];
  function updateChecklist() {
    const checked = checklist.filter((input) => input.checked).length;
    const progress = document.getElementById("check-progress");
    if (progress) progress.textContent = `${checked}/${checklist.length}`;
  }
  checklist.forEach((input) => {
    input.checked = sessionStorage.getItem(`previunt-check-${input.dataset.check}`) === "true";
    input.addEventListener("change", () => {
      sessionStorage.setItem(`previunt-check-${input.dataset.check}`, String(input.checked));
      updateChecklist();
    });
  });
  updateChecklist();

  const photoInput = document.getElementById("report-photo");
  photoInput?.addEventListener("change", () => {
    const file = photoInput.files?.[0];
    const preview = document.getElementById("photo-preview");
    state.pendingPhoto = "";
    if (!file || !preview) {
      if (preview) { preview.innerHTML = ""; preview.hidden = true; }
      return;
    }
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
      photoInput.value = "";
      preview.innerHTML = "";
      preview.hidden = true;
      showToast("Elige una imagen de hasta 5 MB.");
      return;
    }
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      state.pendingPhoto = String(reader.result || "");
      preview.innerHTML = `<img src="${escapeHTML(state.pendingPhoto)}" alt="Vista previa de la foto seleccionada">`;
      preview.hidden = false;
    });
    reader.readAsDataURL(file);
  });

  document.getElementById("report-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const type = document.getElementById("report-type").value.trim();
    const place = document.getElementById("report-place").value.trim();
    const description = document.getElementById("report-description").value.trim();
    const error = document.getElementById("form-error");
    if (!type || !place || !description) {
      error.textContent = "Completa la situación, la zona y una descripción breve.";
      error.hidden = false;
      return;
    }
    const id = `r${Date.now()}`;
    reports.unshift({
      id, type, place, description,
      age: "ahora",
      status: "review",
      photo: state.pendingPhoto || "assets/r-anegamiento.jpg",
      alt: state.pendingPhoto ? `Foto del reporte: ${type}` : "Imagen de ejemplo, no adjuntada por el usuario",
      isDemo: true
    });
    renderReports();
    document.getElementById("report-dialog").close();
    event.currentTarget.reset();
    error.hidden = true;
    const preview = document.getElementById("photo-preview");
    preview.innerHTML = "";
    preview.hidden = true;
    state.pendingPhoto = "";
    navigate("reports");
    showToast("Reporte agregado solo a esta sesión de demostración.");
  });

  window.addEventListener("hashchange", () => {
    const page = location.hash.replace(/^#/, "");
    navigate(page === "inicio" ? "home" : page, false);
  });

  renderReports();
  const initialPage = location.hash.replace(/^#/, "");
  navigate(initialPage === "inicio" ? "home" : initialPage, false);
})();

