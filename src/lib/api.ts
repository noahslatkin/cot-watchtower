export const EDGE_BASE = `https://lqhlmlnwixkummobkoiy.supabase.co/functions/v1/refresh_cot`;

export const defaultHeaders = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxaGxtbG53aXhrdW1tb2Jrb2l5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyMDMzNjEsImV4cCI6MjA2ODc3OTM2MX0.gps27-E_4Zak2LSWUtZucdxu4_skhlJd8XlDPLHzrxs`,
};

export async function fetchJSON(url: string, init: RequestInit = {}) {
  const res = await fetch(url, { ...init, headers: { ...defaultHeaders, ...(init.headers || {}) } });
  const text = await res.text();
  try { return JSON.parse(text); }
  catch {
    throw new Error(`Non-JSON from ${url}: ${res.status} ${text.slice(0,150)}`);
  }
}