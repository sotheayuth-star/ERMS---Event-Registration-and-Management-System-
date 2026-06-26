// ─────────────────────────────────────────────────────────────────────────────
// src/services/api.js — Service layer
// Real path : fetch() → /api/* → Vite proxy → Express :4000
// Mock path : localStorage + inline mock data (USE_MOCK = true)
// ─────────────────────────────────────────────────────────────────────────────

const USE_MOCK = false;
const API_BASE = '/api'; // Vite dev proxy strips the port — no CORS needed

// ── Tiny delay so mock responses feel async ──────────────────────────────────
const delay = (ms = 150) => new Promise(r => setTimeout(r, ms));

// ─────────────────────────────────────────────────────────────────────────────
// HTTP HELPER
// ─────────────────────────────────────────────────────────────────────────────
async function _http(method, path, body) {
  const token = localStorage.getItem('erms_token');
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Accept':       'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || `HTTP ${res.status}`);
  return data;
}

// ── Write session to localStorage after login / verify ───────────────────────
function _saveSession({ token, user }) {
  localStorage.setItem('erms_token', token);
  localStorage.setItem('erms_role',  user.role);
  localStorage.setItem('erms_user',  JSON.stringify(user));
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────────────────────────────
export async function apiLogin(email, password) {
  if (!USE_MOCK) {
    const data = await _http('POST', '/auth/login', { email, password });
    _saveSession(data);
    return data;
  }
  // ── mock ──
  await delay(300);
  const { mockUsers } = await import('./mockData.js');
  const stored = JSON.parse(localStorage.getItem('erms_attendees') || '[]');
  const all    = [...mockUsers, ...stored];
  const user   = all.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user || user.password !== password) throw new Error('Invalid email or password.');
  const token = 'mock_token_' + Date.now();
  const session = { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role };
  _saveSession({ token, user: session });
  return { token, user: session };
}

export async function apiRegister({ firstName, lastName, email, password, phone = '' }) {
  if (!USE_MOCK) return _http('POST', '/auth/register', { firstName, lastName, email, password, phone });
  // ── mock ──
  await delay(300);
  const stored = JSON.parse(localStorage.getItem('erms_attendees') || '[]');
  if (stored.some(u => u.email.toLowerCase() === email.toLowerCase()))
    throw new Error('An account with this email already exists.');
  const newUser = { id: Date.now(), firstName, lastName, email, password, phone, role: 'Attendee', status: 'active' };
  stored.push(newUser);
  localStorage.setItem('erms_attendees', JSON.stringify(stored));
  return { user_id: newUser.id, email: newUser.email };
}

export async function apiVerifyEmail(userId, code) {
  if (!USE_MOCK) {
    const data = await _http('POST', '/auth/verify-email', { userId, code });
    _saveSession(data);
    return data;
  }
  // ── mock ── (accepts any 6-digit code)
  await delay(200);
  const user  = JSON.parse(localStorage.getItem('erms_user') || 'null');
  if (!user) throw new Error('User not found.');
  const token = 'mock_token_' + Date.now();
  _saveSession({ token, user });
  return { token, user };
}

export async function apiResendOtp(userId) {
  if (!USE_MOCK) return _http('POST', '/auth/resend-otp', { userId });
  await delay(200);
  return { message: 'Code resent.' };
}

export async function apiLogout() {
  if (!USE_MOCK) await _http('POST', '/auth/logout').catch(() => {});
  ['erms_user', 'erms_role', 'erms_token'].forEach(k => localStorage.removeItem(k));
}

// ─────────────────────────────────────────────────────────────────────────────
// EVENTS
// ─────────────────────────────────────────────────────────────────────────────
export async function apiGetEvents() {
  if (!USE_MOCK) return _http('GET', '/events');
  await delay(100);
  const { mockEvents } = await import('./mockData.js');
  const stored = JSON.parse(localStorage.getItem('erms_events') || '[]');
  return stored.length ? stored : mockEvents;
}

export async function apiGetEventById(id) {
  if (!USE_MOCK) return _http('GET', `/events/${id}`);
  await delay(100);
  const { mockEvents } = await import('./mockData.js');
  const stored = JSON.parse(localStorage.getItem('erms_events') || '[]');
  const all    = stored.length ? stored : mockEvents;
  const ev     = all.find(e => String(e.id) === String(id));
  if (!ev) throw new Error('Event not found.');
  return ev;
}

export async function apiCreateEvent(eventData) {
  if (!USE_MOCK) return _http('POST', '/events', eventData);
  await delay(200);
  const { mockEvents } = await import('./mockData.js');
  const stored = JSON.parse(localStorage.getItem('erms_events') || '[]');
  const events = stored.length ? stored : [...mockEvents];
  const newEvent = { id: Date.now(), published: false, ...eventData };
  events.push(newEvent);
  localStorage.setItem('erms_events', JSON.stringify(events));
  return newEvent;
}

export async function apiUpdateEvent(id, eventData) {
  if (!USE_MOCK) return _http('PUT', `/events/${id}`, eventData);
  await delay(200);
  const { mockEvents } = await import('./mockData.js');
  const stored = JSON.parse(localStorage.getItem('erms_events') || '[]');
  const events = stored.length ? stored : [...mockEvents];
  const idx    = events.findIndex(e => String(e.id) === String(id));
  if (idx === -1) throw new Error('Event not found.');
  events[idx] = { ...events[idx], ...eventData };
  localStorage.setItem('erms_events', JSON.stringify(events));
  return events[idx];
}

export async function apiDeleteEvent(id) {
  if (!USE_MOCK) return _http('DELETE', `/events/${id}`);
  await delay(200);
  const { mockEvents } = await import('./mockData.js');
  const stored = JSON.parse(localStorage.getItem('erms_events') || '[]');
  const events = (stored.length ? stored : [...mockEvents]).filter(e => String(e.id) !== String(id));
  localStorage.setItem('erms_events', JSON.stringify(events));
}

export async function apiTogglePublish(id) {
  if (!USE_MOCK) return _http('PATCH', `/events/${id}/publish`);
  await delay(200);
  const { mockEvents } = await import('./mockData.js');
  const stored = JSON.parse(localStorage.getItem('erms_events') || '[]');
  const events = stored.length ? stored : [...mockEvents];
  const idx    = events.findIndex(e => String(e.id) === String(id));
  if (idx === -1) throw new Error('Event not found.');
  events[idx].published = !events[idx].published;
  localStorage.setItem('erms_events', JSON.stringify(events));
  return events[idx];
}

// ─────────────────────────────────────────────────────────────────────────────
// REGISTRATIONS & TICKETS
// ─────────────────────────────────────────────────────────────────────────────
export async function apiGetMyRegistrations() {
  if (!USE_MOCK) return _http('GET', '/registrations/mine');
  await delay(150);
  const user    = JSON.parse(localStorage.getItem('erms_user') || 'null');
  const tickets = JSON.parse(localStorage.getItem('erms_tickets') || '[]');
  return user ? tickets.filter(t => t.userId === user.id) : [];
}

export async function apiRegisterForEvent(eventId, { ticketType = 'standard', quantity = 1, price = '0.00' } = {}) {
  if (!USE_MOCK) return _http('POST', '/registrations', { eventId, ticketType, quantity, price });
  await delay(250);
  const user = JSON.parse(localStorage.getItem('erms_user') || 'null');
  if (!user) throw new Error('Not authenticated.');
  const tickets   = JSON.parse(localStorage.getItem('erms_tickets') || '[]');
  const duplicate = tickets.find(t => String(t.eventId) === String(eventId) && t.userId === user.id && t.status !== 'cancelled');
  if (duplicate) throw new Error('Already registered for this event.');
  const { mockEvents } = await import('./mockData.js');
  const stored  = JSON.parse(localStorage.getItem('erms_events') || '[]');
  const events  = stored.length ? stored : mockEvents;
  const event   = events.find(e => String(e.id) === String(eventId));
  const ticket  = {
    id: Date.now(), userId: user.id, eventId: Number(eventId),
    event_title: event?.title || '', ticketCode: 'TKT-' + Date.now(),
    ticketType, quantity, price, status: 'confirmed', registered_at: new Date().toISOString(),
  };
  tickets.push(ticket);
  localStorage.setItem('erms_tickets', JSON.stringify(tickets));
  return ticket;
}

export async function apiGetTicket(ticketCode) {
  if (!USE_MOCK) return _http('GET', `/tickets/${ticketCode}`);
  await delay(100);
  const tickets = JSON.parse(localStorage.getItem('erms_tickets') || '[]');
  const ticket  = tickets.find(t => t.ticketCode === ticketCode);
  if (!ticket) throw new Error('Ticket not found.');
  return ticket;
}

// ─────────────────────────────────────────────────────────────────────────────
// REFUNDS
// ─────────────────────────────────────────────────────────────────────────────
export async function apiRequestRefund(ticketCode, eventName, reason, details = '') {
  if (!USE_MOCK) return _http('POST', '/refunds', { ticketCode, eventName, reason, details });
  await delay(200);
  const user    = JSON.parse(localStorage.getItem('erms_user') || 'null');
  const refunds = JSON.parse(localStorage.getItem('erms_refunds') || '[]');
  const tickets = JSON.parse(localStorage.getItem('erms_tickets') || '[]');
  if (refunds.some(r => r.ticketCode === ticketCode)) throw new Error('Refund already requested.');
  const refund = { id: Date.now(), ticketCode, eventName, reason, details, status: 'pending', userId: user?.id, requestedAt: new Date().toISOString() };
  refunds.push(refund);
  localStorage.setItem('erms_refunds', JSON.stringify(refunds));
  const t = tickets.find(t => t.ticketCode === ticketCode);
  if (t) { t.status = 'cancelled'; localStorage.setItem('erms_tickets', JSON.stringify(tickets)); }
  return refund;
}

export async function apiGetRefunds() {
  if (!USE_MOCK) return _http('GET', '/refunds');
  await delay(150);
  return JSON.parse(localStorage.getItem('erms_refunds') || '[]');
}

export async function apiUpdateRefundStatus(ticketCode, status) {
  if (!USE_MOCK) return _http('PATCH', `/refunds/${ticketCode}`, { status });
  await delay(200);
  const refunds = JSON.parse(localStorage.getItem('erms_refunds') || '[]');
  const r = refunds.find(r => r.ticketCode === ticketCode);
  if (!r) throw new Error('Refund not found.');
  r.status = status;
  localStorage.setItem('erms_refunds', JSON.stringify(refunds));
  return r;
}

// ─────────────────────────────────────────────────────────────────────────────
// TESTIMONIALS
// ─────────────────────────────────────────────────────────────────────────────
export async function apiGetTestimonials() {
  if (!USE_MOCK) return _http('GET', '/testimonials');
  await delay(100);
  const { mockTestimonials } = await import('./mockData.js');
  return mockTestimonials;
}

export async function apiSubmitTestimonial({ content, rating, eventId = null }) {
  if (!USE_MOCK) return _http('POST', '/testimonials', { content, rating, eventId });
  await delay(200);
  const user = JSON.parse(localStorage.getItem('erms_user') || 'null');
  return { id: Date.now(), content, rating, eventId, userId: user?.id, createdAt: new Date().toISOString() };
}

// ─────────────────────────────────────────────────────────────────────────────
// USERS (staff management)
// ─────────────────────────────────────────────────────────────────────────────
export async function apiGetAllUsers() {
  if (!USE_MOCK) return _http('GET', '/users');
  await delay(150);
  const { mockUsers } = await import('./mockData.js');
  const stored = JSON.parse(localStorage.getItem('erms_attendees') || '[]');
  return [...mockUsers, ...stored];
}

export async function apiUpdateUser(userId, data) {
  if (!USE_MOCK) return _http('PUT', `/users/${userId}`, data);
  await delay(200);
  const stored = JSON.parse(localStorage.getItem('erms_attendees') || '[]');
  const idx    = stored.findIndex(u => String(u.id) === String(userId));
  if (idx !== -1) { stored[idx] = { ...stored[idx], ...data }; localStorage.setItem('erms_attendees', JSON.stringify(stored)); return stored[idx]; }
  throw new Error('User not found.');
}

export async function apiCreateUser({ firstName, lastName, email, password, role = 'Attendee' }) {
  if (!USE_MOCK) return _http('POST', '/users', { firstName, lastName, email, password, role });
  await delay(200);
  const stored = JSON.parse(localStorage.getItem('erms_attendees') || '[]');
  if (stored.some(u => u.email.toLowerCase() === email.toLowerCase())) throw new Error('Email already in use.');
  const user = { id: Date.now(), firstName, lastName, email, password, role, status: 'active' };
  stored.push(user);
  localStorage.setItem('erms_attendees', JSON.stringify(stored));
  return user;
}

export async function apiDeleteUser(userId) {
  if (!USE_MOCK) return _http('DELETE', `/users/${userId}`);
  await delay(200);
  const stored = JSON.parse(localStorage.getItem('erms_attendees') || '[]').filter(u => String(u.id) !== String(userId));
  localStorage.setItem('erms_attendees', JSON.stringify(stored));
}

// ─────────────────────────────────────────────────────────────────────────────
// SESSION HELPERS
// ─────────────────────────────────────────────────────────────────────────────
export function getSession() {
  try { return JSON.parse(localStorage.getItem('erms_user')); } catch { return null; }
}

export function getCurrentRole() {
  return localStorage.getItem('erms_role') || null;
}
