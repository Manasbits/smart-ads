const META_API_VERSION = "v21.0";
const META_BASE = `https://graph.facebook.com/${META_API_VERSION}`;

export class MetaApiClient {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  async get<T>(path: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`${META_BASE}${path}`);
    url.searchParams.set("access_token", this.accessToken);
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }

    const res = await fetch(url.toString());
    const data = await res.json();

    if (!res.ok || data.error) {
      const msg = data.error?.message ?? `Meta API error on ${path}`;
      throw new Error(msg);
    }

    return data as T;
  }
}
