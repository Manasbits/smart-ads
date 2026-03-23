const SHOPIFY_API_VERSION = "2024-10";

export class ShopifyApiClient {
  private shopDomain: string;
  private accessToken: string;

  constructor(shopDomain: string, accessToken: string) {
    this.shopDomain = shopDomain;
    this.accessToken = accessToken;
  }

  async get<T>(path: string): Promise<T> {
    const url = `https://${this.shopDomain}/admin/api/${SHOPIFY_API_VERSION}${path}`;
    const res = await fetch(url, {
      headers: { "X-Shopify-Access-Token": this.accessToken },
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(
        data.errors ?? `Shopify API error on ${path}: ${res.status}`
      );
    }

    return data as T;
  }
}
