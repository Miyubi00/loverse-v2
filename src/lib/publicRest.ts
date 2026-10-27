const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

function createRequest(table: string, query: URLSearchParams) {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase belum dikonfigurasi: set VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY.");
  }

  const endpoint = new URL(`/rest/v1/${table}`, supabaseUrl);
  endpoint.search = query.toString();

  return {
    endpoint,
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
    },
  };
}

export async function fetchPublicRows<T>(table: string, query: URLSearchParams): Promise<T> {
  const { endpoint, headers } = createRequest(table, query);
  const response = await fetch(endpoint, { headers });

  if (!response.ok) {
    throw new Error(`Supabase request failed (${response.status}): ${await response.text()}`);
  }

  return response.json() as Promise<T>;
}

export async function fetchPublicCount(table: string): Promise<number | null> {
  const { endpoint, headers } = createRequest(table, new URLSearchParams({ select: "*" }));
  const response = await fetch(endpoint, {
    method: "HEAD",
    headers: {
      ...headers,
      Prefer: "count=exact",
      Range: "0-0",
      "Range-Unit": "items",
    },
  });

  if (!response.ok) {
    throw new Error(`Supabase request failed (${response.status}): ${response.statusText}`);
  }

  const total = response.headers.get("content-range")?.split("/")[1];
  if (!total || total === "*") return null;

  const count = Number(total);
  return Number.isFinite(count) ? count : null;
}
