const API = '/api/';
const state = {
  services: [],
  staff: [],
  selectedServices: new Set(),
  currentStep: 1
};

function $(selector, root = document) {
  return root.querySelector(selector);
}

function $all(selector, root = document) {
  return [...root.querySelectorAll(selector)];
}

function money(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
}

function showToast(message, type = 'info') {
  const toast = $('[data-toast]');
  if (!toast) return;
  toast.textContent = message;
  toast.style.borderColor = type === 'error' ? 'rgba(239, 68, 68, .55)' : 'rgba(212, 175, 55, .5)';
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 3200);
}

async function fetchJSON(url, options = {}) {
  const response = await fetch(url, {
    headers: { Accept: 'application/json', ...(options.headers || {}) },
    ...options
  });
  const data = await response.json().catch(() => ({ error: true, message: 'Respuesta inválida.' }));
  if (!response.ok || data.error) throw new Error(data.message || 'Error en la solicitud.');
  return data;
}

function pageName() {
  return document.body.dataset.page || '';
}

function renderShell() {
  const header = $('[data-header]');
  const footer = $('[data-footer]');
  const current = location.pathname.split('/').pop() || 'index.html';
  const nav = [
    ['index.html', 'Inicio'],
    ['servicios.html', 'Servicios'],
    ['barberos.html', 'Barberos'],
    ['agendar.html', 'Agendar'],
    ['mis-citas.html', 'Mis citas'],
    ['ubicacion.html', 'Ubicación'],
    ['contacto.html', 'Contacto'],
    ['acerca.html', 'Acerca']
  ];

  if (header) {
    header.innerHTML = `
      <header class="site-header">
        <div class="header-inner">
          <a class="brand" href="index.html"><span class="brand-mark">BF</span><span class="brand-copy"><strong>BarberFlow</strong><small>Vercel + Supabase</small></span></a>
          <button class="nav-toggle" type="button" aria-label="Abrir menú" data-nav-toggle><span></span><span></span><span></span></button>
          <nav class="site-nav" data-site-nav>${nav.map(([href, label]) => `<a class="${current === href ? 'active' : ''} ${href === 'agendar.html' ? 'nav-cta' : ''}" href="${href}">${label}</a>`).join('')}</nav>
        </div>
      </header>`;
  }

  if (footer) {
    footer.innerHTML = `
      <footer class="site-footer">
        <div class="footer-grid">
          <div><strong>BarberFlow</strong><p>Agenda para barbería con Vercel Functions y Supabase.</p></div>
          <div><span>Autor</span><p>Wilson Cristóbal Pinela León</p></div>
          <div><span>Curso</span><p>3ero Bachillerato Técnico "B"</p></div>
          <div><span>APIs</span><p>Nager.Date · Open-Meteo · QRServer</p></div>
        </div>
      </footer>`;
  }

  const toggle = $('[data-nav-toggle]');
  const siteNav = $('[data-site-nav]');
  if (toggle && siteNav) {
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('open');
      siteNav.classList.toggle('open');
    });
  }
}

function serviceCard(service, compact = false) {
  return `
    <article class="service-card" data-category="${escapeHTML(service.category)}">
      <span class="icon">${escapeHTML(service.icon)}</span>
      <h3>${escapeHTML(service.name)}</h3>
      <p>${escapeHTML(service.description || '')}</p>
      <div class="meta-row"><span class="badge">${escapeHTML(service.category)}</span><span class="badge">${money(service.price)}</span><span class="badge">${service.duration} min</span></div>
      ${compact ? '' : `<a class="btn primary" href="agendar.html?service=${encodeURIComponent(service.id)}">Agendar</a>`}
    </article>`;
}

function staffCard(worker) {
  return `
    <article class="barber-card">
      <span class="barber-avatar">${escapeHTML(worker.avatar || worker.name.slice(0, 1))}</span>
      <h3>${escapeHTML(worker.name)}</h3>
      <p>${escapeHTML(worker.role)} · ${escapeHTML(worker.specialty)}</p>
      <div class="badge-row"><span class="badge">${escapeHTML(worker.experience || '')}</span><span class="badge disponible">disponible</span></div>
      <p>${(worker.skills || []).map(escapeHTML).join(' · ')}</p>
      <a class="btn primary" href="agendar.html?staff=${encodeURIComponent(worker.id)}">Agendar con este trabajador</a>
    </article>`;
}

async function initWeather() {
  const widgets = $all('[data-weather]');
  if (!widgets.length) return;
  try {
    const { data } = await fetchJSON(`${API}weather`);
    widgets.forEach((widget) => {
      widget.innerHTML = `<strong>Clima en Guayaquil</strong><p>Referencia para planificar tu visita.</p><div class="weather-metrics"><div><span>Temperatura</span><strong>${escapeHTML(data.temperature)} °C</strong></div><div><span>Humedad</span><strong>${escapeHTML(data.humidity)}%</strong></div><div><span>Viento</span><strong>${escapeHTML(data.wind)} km/h</strong></div></div>`;
    });
  } catch {
    widgets.forEach((widget) => { widget.innerHTML = '<p>Clima no disponible.</p>'; });
  }
}

async function initHome() {
  const list = $('[data-featured-services]');
  if (!list) return;
  try {
    const { data } = await fetchJSON(`${API}services`);
    list.innerHTML = data.slice(0, 4).map((service) => serviceCard(service)).join('');
  } catch (error) {
    list.innerHTML = `<div class="empty-state">${escapeHTML(error.message)}</div>`;
  }
}

async function initServices() {
  const root = $('[data-services]');
  if (!root) return;
  const list = $('[data-services-list]', root);
  try {
    const { data } = await fetchJSON(`${API}services`);
    state.services = data;
    const render = (filter = 'todos') => {
      const visible = filter === 'todos' ? data : data.filter((service) => service.category === filter);
      list.innerHTML = visible.length ? visible.map((service) => serviceCard(service)).join('') : '<div class="empty-state">No hay servicios en esta categoría.</div>';
    };
    render();
    $all('[data-filter]', root).forEach((button) => button.addEventListener('click', () => {
      $all('[data-filter]', root).forEach((item) => item.classList.remove('active'));
      button.classList.add('active');
      render(button.dataset.filter);
    }));
  } catch (error) {
    list.innerHTML = `<div class="empty-state">${escapeHTML(error.message)}</div>`;
  }
}

async function initBarbers() {
  const list = $('[data-barbers-list]');
  if (!list) return;
  try {
    const { data } = await fetchJSON(`${API}barbers`);
    list.innerHTML = data.map(staffCard).join('');
  } catch (error) {
    list.innerHTML = `<div class="empty-state">${escapeHTML(error.message)}</div>`;
  }
}

function selectedServices() {
  return state.services.filter((service) => state.selectedServices.has(service.id));
}

function totals() {
  return selectedServices().reduce((acc, service) => ({ price: acc.price + Number(service.price), duration: acc.duration + Number(service.duration) }), { price: 0, duration: 0 });
}

function setStep(step) {
  state.currentStep = Math.min(4, Math.max(1, step));
  $all('[data-step]').forEach((item) => item.classList.toggle('active', Number(item.dataset.step) === state.currentStep));
  $all('[data-step-target]').forEach((item) => item.classList.toggle('active', Number(item.dataset.stepTarget) === state.currentStep));
  const progress = $('[data-progress-bar]');
  if (progress) progress.style.width = `${state.currentStep * 25}%`;
  $('[data-prev-step]')?.classList.toggle('hidden', state.currentStep === 1);
  $('[data-next-step]')?.classList.toggle('hidden', state.currentStep === 4);
  $('[data-submit-booking]')?.classList.toggle('hidden', state.currentStep !== 4);
}

async function initBooking() {
  const root = $('[data-booking]');
  if (!root) return;
  const picker = $('[data-service-picker]', root);
  const staffSelect = $('[data-staff-select]', root);
  const dateInput = $('[data-date-input]', root);
  const timeGrid = $('[data-time-grid]', root);
  const hourInput = $('[data-hour-input]', root);
  const summary = $('[data-booking-summary]', root);
  const note = $('[data-booking-note]', root);
  const recommendation = $('[data-recommendation]', root);
  const params = new URLSearchParams(location.search);
  dateInput.min = new Date().toISOString().slice(0, 10);

  function renderPicker() {
    picker.innerHTML = state.services.map((service) => `<button class="service-option ${state.selectedServices.has(service.id) ? 'selected' : ''}" type="button" data-service-id="${service.id}"><span class="icon">${escapeHTML(service.icon)}</span><strong>${escapeHTML(service.name)}</strong><small>${escapeHTML(service.category)} · ${money(service.price)} · ${service.duration} min</small></button>`).join('');
    $all('[data-service-id]', picker).forEach((button) => button.addEventListener('click', () => {
      const id = button.dataset.serviceId;
      if (state.selectedServices.has(id)) state.selectedServices.delete(id);
      else state.selectedServices.add(id);
      hourInput.value = '';
      renderPicker();
      renderSummary();
      updateRecommendation();
      loadAvailability();
    }));
  }

  function renderSummary() {
    const chosen = selectedServices();
    const total = totals();
    if (!chosen.length) {
      summary.innerHTML = '<strong>Resumen</strong><p>No hay servicios seleccionados.</p>';
      note.textContent = 'Selecciona servicios para calcular total.';
      return;
    }
    summary.innerHTML = `<strong>Resumen</strong><ul class="clean-list">${chosen.map((service) => `<li>${escapeHTML(service.name)} <span>${money(service.price)} · ${service.duration} min</span></li>`).join('')}</ul><div class="summary-total"><span>Total</span><strong>${money(total.price)}</strong><span>Duración</span><strong>${total.duration} min</strong></div>`;
    note.textContent = `Total ${money(total.price)} · ${total.duration} minutos.`;
  }

  async function updateRecommendation() {
    const ids = [...state.selectedServices];
    if (!ids.length) {
      recommendation.innerHTML = '<p>Selecciona servicios para ver una recomendación.</p>';
      return;
    }
    const query = new URLSearchParams({ service_ids: ids.join(',') });
    if (dateInput.value) query.set('date', dateInput.value);
    if (hourInput.value) query.set('time', hourInput.value);
    try {
      const { data } = await fetchJSON(`${API}recommendation?${query}`);
      const rec = data.recommended;
      recommendation.innerHTML = rec ? `<div class="badge-row"><span class="badge gold">Recomendado</span><span class="badge">${rec.match}% match</span></div><h3>${escapeHTML(rec.name)}</h3><p>${escapeHTML(rec.role)} · ${escapeHTML(rec.specialty)}</p><button class="btn secondary" type="button" data-accept-rec="${rec.id}">Usar recomendación</button>` : '<p>No hay recomendación disponible.</p>';
      $('[data-accept-rec]', recommendation)?.addEventListener('click', (event) => {
        staffSelect.value = event.currentTarget.dataset.acceptRec;
        loadAvailability();
      });
    } catch (error) {
      recommendation.innerHTML = `<p>${escapeHTML(error.message)}</p>`;
    }
  }

  async function loadAvailability() {
    hourInput.value = '';
    const total = totals();
    if (!state.selectedServices.size || !staffSelect.value || !dateInput.value || total.duration <= 0) {
      timeGrid.innerHTML = '<div class="empty-state">Selecciona servicios, trabajador y fecha.</div>';
      return;
    }
    timeGrid.innerHTML = '<div class="empty-state">Calculando disponibilidad...</div>';
    try {
      const query = new URLSearchParams({ date: dateInput.value, staff_id: staffSelect.value, duration: String(total.duration) });
      const { data } = await fetchJSON(`${API}availability?${query}`);
      const allSlots = [...data.available.map((hour) => ({ hour, ok: true })), ...data.blocked.map((hour) => ({ hour, ok: false }))].sort((a, b) => a.hour.localeCompare(b.hour));
      timeGrid.innerHTML = allSlots.map((slot) => `<button class="time-btn" type="button" data-hour="${slot.hour}" ${slot.ok ? '' : 'disabled'}>${slot.hour}<small>${slot.ok ? 'disponible' : 'ocupado'}</small></button>`).join('');
      $all('.time-btn:not(:disabled)', timeGrid).forEach((button) => button.addEventListener('click', () => {
        $all('.time-btn', timeGrid).forEach((item) => item.classList.remove('active'));
        button.classList.add('active');
        hourInput.value = button.dataset.hour;
        updateRecommendation();
      }));
    } catch (error) {
      timeGrid.innerHTML = `<div class="empty-state">${escapeHTML(error.message)}</div>`;
    }
  }

  function validateStep(step) {
    if (step === 1 && !state.selectedServices.size) return 'Selecciona al menos un servicio.';
    if (step === 2 && !staffSelect.value) return 'Selecciona un trabajador.';
    if (step === 3 && (!dateInput.value || !hourInput.value)) return 'Selecciona fecha y hora disponible.';
    return '';
  }

  try {
    const [services, staff] = await Promise.all([fetchJSON(`${API}services`), fetchJSON(`${API}barbers`)]);
    state.services = services.data;
    state.staff = staff.data;
    staffSelect.innerHTML = '<option value="">Selecciona trabajador</option>' + state.staff.map((item) => `<option value="${item.id}">${escapeHTML(item.name)} - ${escapeHTML(item.role)} - ${escapeHTML(item.specialty)}</option>`).join('');
    if (params.get('service')) state.selectedServices.add(params.get('service'));
    if (params.get('staff')) staffSelect.value = params.get('staff');
    renderPicker();
    renderSummary();
    updateRecommendation();
    loadAvailability();
  } catch (error) {
    picker.innerHTML = `<div class="empty-state">${escapeHTML(error.message)}</div>`;
  }

  staffSelect.addEventListener('change', () => { loadAvailability(); updateRecommendation(); });
  dateInput.addEventListener('change', () => { loadAvailability(); updateRecommendation(); });
  $all('[data-step-target]', root).forEach((button) => button.addEventListener('click', () => {
    const target = Number(button.dataset.stepTarget);
    for (let i = 1; i < target; i += 1) {
      const message = validateStep(i);
      if (message) return showToast(message, 'error');
    }
    setStep(target);
  }));
  $('[data-prev-step]', root).addEventListener('click', () => setStep(state.currentStep - 1));
  $('[data-next-step]', root).addEventListener('click', () => {
    const message = validateStep(state.currentStep);
    if (message) return showToast(message, 'error');
    setStep(state.currentStep + 1);
  });
  $('[data-booking-form]', root).addEventListener('submit', async (event) => {
    event.preventDefault();
    const message = validateStep(3);
    if (message) return showToast(message, 'error');
    const input = Object.fromEntries(new FormData(event.currentTarget).entries());
    if (!input.client_name || !input.phone) return showToast('Completa nombre y teléfono.', 'error');
    input.service_ids = [...state.selectedServices];
    try {
      const result = await fetchJSON(`${API}appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      });
      location.href = `confirmacion.html?code=${encodeURIComponent(result.data.code)}`;
    } catch (error) {
      showToast(error.message, 'error');
      loadAvailability();
    }
  });
  setStep(1);
}

function appointmentServicesText(appointment) {
  return (appointment.services || []).map((item) => item.name).join(', ');
}

function appointmentCard(appointment, qr = '') {
  return `<article class="appointment-card ${qr ? 'with-qr' : ''}"><div><div class="badge-row"><span class="badge">${escapeHTML(appointment.code)}</span><span class="badge ${appointment.status === 'cancelled' ? 'cancelada' : 'confirmada'}">${escapeHTML(appointment.status)}</span></div><h3>${escapeHTML(appointment.client_name)}</h3><p><strong>Servicios:</strong> ${escapeHTML(appointmentServicesText(appointment))}</p><p><strong>Total:</strong> ${money(appointment.total_price)} · <strong>Duración:</strong> ${appointment.total_duration} min</p><p><strong>Trabajador:</strong> ${escapeHTML(appointment.staff_name)}</p><p>${escapeHTML(appointment.appointment_date)} · ${escapeHTML(appointment.start_time)} - ${escapeHTML(appointment.end_time)}</p><button class="btn danger" type="button" data-cancel="${escapeHTML(appointment.code)}" ${appointment.status === 'cancelled' ? 'disabled' : ''}>Cancelar cita</button></div>${qr}</article>`;
}

async function qrBox(code) {
  try {
    const { data } = await fetchJSON(`${API}qr?code=${encodeURIComponent(code)}`);
    return `<div class="qr-box"><img src="${escapeHTML(data.qr_url)}" alt="QR ${escapeHTML(code)}"></div>`;
  } catch {
    return '';
  }
}

async function initConfirmation() {
  const root = $('[data-confirmation-card]');
  if (!root) return;
  const code = new URLSearchParams(location.search).get('code');
  if (!code) {
    root.innerHTML = '<div class="empty-state">No se indicó código.</div>';
    return;
  }
  try {
    const [appointments, qr] = await Promise.all([fetchJSON(`${API}appointments?code=${encodeURIComponent(code)}`), fetchJSON(`${API}qr?code=${encodeURIComponent(code)}`)]);
    const appointment = appointments.data[0];
    if (!appointment) throw new Error('Cita no encontrada.');
    root.classList.add('receipt');
    const whatsapp = encodeURIComponent(`Cita BarberFlow\nCódigo: ${appointment.code}\nServicios: ${appointmentServicesText(appointment)}\nFecha: ${appointment.appointment_date}\nHora: ${appointment.start_time} - ${appointment.end_time}`);
    root.innerHTML = `<div><span class="badge confirmada">${escapeHTML(appointment.status)}</span><h2>Cita confirmada</h2><div class="receipt-lines"><div><span>Código</span><strong>${escapeHTML(appointment.code)}</strong></div><div><span>Cliente</span><strong>${escapeHTML(appointment.client_name)}</strong></div><div><span>Servicios</span><strong>${escapeHTML(appointmentServicesText(appointment))}</strong></div><div><span>Total</span><strong>${money(appointment.total_price)}</strong></div><div><span>Duración</span><strong>${appointment.total_duration} min</strong></div><div><span>Trabajador</span><strong>${escapeHTML(appointment.staff_name)}</strong></div><div><span>Fecha</span><strong>${escapeHTML(appointment.appointment_date)}</strong></div><div><span>Hora</span><strong>${escapeHTML(appointment.start_time)} - ${escapeHTML(appointment.end_time)}</strong></div></div><div class="hero-actions"><button class="btn secondary" type="button" data-print>Imprimir</button><a class="btn primary" target="_blank" rel="noopener" href="https://wa.me/?text=${whatsapp}">Compartir por WhatsApp</a><a class="btn secondary" href="mis-citas.html">Ver mis citas</a><a class="btn secondary" href="index.html">Inicio</a></div></div><div class="qr-box"><img src="${escapeHTML(qr.data.qr_url)}" alt="QR"></div>`;
    $('[data-print]', root).addEventListener('click', () => window.print());
  } catch (error) {
    root.innerHTML = `<div class="empty-state">${escapeHTML(error.message)}</div>`;
  }
}

async function cancelAppointment(code, admin = false) {
  const url = admin ? `${API}admin-appointments?code=${encodeURIComponent(code)}` : `${API}appointments?code=${encodeURIComponent(code)}`;
  await fetchJSON(url, { method: 'PATCH', headers: admin ? { 'x-owner-token': sessionStorage.getItem('ownerToken') || '' } : {} });
}

async function initMyAppointments() {
  const root = $('[data-my-appointments]');
  if (!root) return;
  const results = $('[data-my-results]', root);
  $('[data-search-form]', root).addEventListener('submit', async (event) => {
    event.preventDefault();
    const input = Object.fromEntries(new FormData(event.currentTarget).entries());
    const query = new URLSearchParams();
    if (input.phone) query.set('phone', input.phone);
    if (input.code) query.set('code', input.code);
    if (!query.toString()) return showToast('Ingresa teléfono o código.', 'error');
    results.innerHTML = '<div class="empty-state">Buscando citas...</div>';
    try {
      const { data } = await fetchJSON(`${API}appointments?${query}`);
      if (!data.length) {
        results.innerHTML = '<div class="empty-state">No encontramos citas.</div>';
        return;
      }
      const cards = await Promise.all(data.map(async (item) => appointmentCard(item, item.status === 'confirmed' ? await qrBox(item.code) : '')));
      results.innerHTML = cards.join('');
      $all('[data-cancel]', results).forEach((button) => button.addEventListener('click', async () => {
        await cancelAppointment(button.dataset.cancel);
        showToast('Cita cancelada.');
        event.currentTarget.requestSubmit();
      }));
    } catch (error) {
      results.innerHTML = `<div class="empty-state">${escapeHTML(error.message)}</div>`;
    }
  });
}

async function initAdminLogin() {
  const form = $('[data-admin-login-form]');
  if (!form) return;
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const input = Object.fromEntries(new FormData(form).entries());
    try {
      const { token } = await fetchJSON(`${API}admin-login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
      sessionStorage.setItem('ownerToken', token);
      location.href = 'admin.html';
    } catch (error) {
      showToast(error.message, 'error');
    }
  });
}

async function initAdmin() {
  const root = $('[data-admin]');
  if (!root) return;
  const token = sessionStorage.getItem('ownerToken');
  if (token !== 'owner-ok') {
    location.href = 'admin-login.html';
    return;
  }
  $('[data-admin-logout]')?.addEventListener('click', () => {
    sessionStorage.removeItem('ownerToken');
    location.href = 'index.html';
  });
  const staffSelect = $('[data-admin-staff]', root);
  const rows = $('[data-admin-rows]', root);
  const stats = $('[data-admin-stats]', root);
  try {
    const { data: staff } = await fetchJSON(`${API}barbers`);
    staffSelect.innerHTML = '<option value="">Todos</option>' + staff.map((item) => `<option value="${item.id}">${escapeHTML(item.name)}</option>`).join('');
  } catch {}

  async function load() {
    const query = new URLSearchParams();
    const date = $('[data-admin-date]', root).value;
    const status = $('[data-admin-status]', root).value;
    const staffId = staffSelect.value;
    if (date) query.set('date', date);
    if (status) query.set('status', status);
    if (staffId) query.set('staff_id', staffId);
    try {
      const { data } = await fetchJSON(`${API}admin-appointments?${query}`, { headers: { 'x-owner-token': token } });
      const today = new Date().toISOString().slice(0, 10);
      const todayItems = data.filter((item) => item.appointment_date === today);
      const confirmed = data.filter((item) => item.status === 'confirmed');
      const cancelled = data.filter((item) => item.status === 'cancelled');
      const income = confirmed.reduce((sum, item) => sum + Number(item.total_price), 0);
      stats.innerHTML = `<article class="stat-card"><span>Total</span><strong>${data.length}</strong><p>Citas listadas</p></article><article class="stat-card"><span>Hoy</span><strong>${todayItems.length}</strong><p>Agenda del día</p></article><article class="stat-card"><span>Confirmadas</span><strong>${confirmed.length}</strong><p>Reservas activas</p></article><article class="stat-card"><span>Canceladas</span><strong>${cancelled.length}</strong><p>Reservas anuladas</p></article><article class="stat-card"><span>Ingresos</span><strong>${money(income)}</strong><p>Estimado filtrado</p></article>`;
      rows.innerHTML = data.length ? data.map((item) => `<tr><td>${escapeHTML(item.code)}</td><td>${escapeHTML(item.client_name)}</td><td>${escapeHTML(appointmentServicesText(item))}</td><td>${money(item.total_price)}</td><td>${escapeHTML(item.staff_name)}</td><td>${escapeHTML(item.appointment_date)}</td><td>${escapeHTML(item.start_time)}</td><td>${escapeHTML(item.end_time)}</td><td><span class="badge ${item.status === 'cancelled' ? 'cancelada' : 'confirmada'}">${escapeHTML(item.status)}</span></td><td><button class="btn danger" type="button" data-admin-cancel="${escapeHTML(item.code)}" ${item.status === 'cancelled' ? 'disabled' : ''}>Cancelar</button></td></tr>`).join('') : '<tr><td colspan="10">Sin citas.</td></tr>';
      $all('[data-admin-cancel]', rows).forEach((button) => button.addEventListener('click', async () => {
        await cancelAppointment(button.dataset.adminCancel, true);
        showToast('Cita cancelada.');
        load();
      }));
    } catch (error) {
      rows.innerHTML = `<tr><td colspan="10">${escapeHTML(error.message)}</td></tr>`;
    }
  }
  $('[data-admin-refresh]', root).addEventListener('click', load);
  $all('input, select', root).forEach((field) => field.addEventListener('change', load));
  load();
}

function initContactDemo() {
  $('[data-contact-demo]')?.addEventListener('click', () => showToast('Mensaje visual registrado. Usa WhatsApp para atención directa.'));
}

document.addEventListener('DOMContentLoaded', () => {
  renderShell();
  initWeather();
  initHome();
  initServices();
  initBarbers();
  initBooking();
  initConfirmation();
  initMyAppointments();
  initAdminLogin();
  initAdmin();
  initContactDemo();
});
