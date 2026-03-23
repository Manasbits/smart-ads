import { tool } from "ai";
import { z } from "zod";
import { getShopifyToken } from "@/lib/firestore/tokens";
import { ShopifyApiClient } from "@/lib/api/shopify-client";

/**
 * Builds Shopify tools for a given user.
 * Returns an empty object if the user has no Shopify token (graceful degradation).
 */
export async function buildShopifyTools(userId: string) {
  const tokenData = await getShopifyToken(userId).catch(() => null);
  if (!tokenData) return {};

  const client = new ShopifyApiClient(tokenData.shopDomain, tokenData.accessToken);

  return {
    get_shopify_shop_info: tool({
      description:
        "Get basic information about the connected Shopify store: name, domain, currency, country, and plan.",
      inputSchema: z.object({}),
      execute: async () => {
        const data = await client.get<{ shop: Record<string, unknown> }>("/shop.json");
        const { id, name, email, domain, myshopify_domain, currency, country_name, plan_name, created_at } =
          data.shop as Record<string, unknown>;
        return { id, name, email, domain, myshopify_domain, currency, country_name, plan_name, created_at };
      },
    }),

    get_shopify_orders: tool({
      description:
        "Get recent orders from the Shopify store. Returns order number, status, total price, line items, and customer info. Use this to analyze sales, fulfillment, and revenue.",
      inputSchema: z.object({
        limit: z
          .number()
          .int()
          .min(1)
          .max(250)
          .optional()
          .default(50)
          .describe("Number of orders to return (max 250)"),
        status: z
          .enum(["open", "closed", "cancelled", "any"])
          .optional()
          .default("any")
          .describe("Filter by order status"),
        financialStatus: z
          .enum(["paid", "pending", "refunded", "partially_refunded", "any"])
          .optional()
          .default("any")
          .describe("Filter by payment status"),
        createdAtMin: z
          .string()
          .optional()
          .describe("ISO 8601 date — return orders created after this date (e.g. 2024-01-01T00:00:00Z)"),
      }),
      execute: async ({ limit, status, financialStatus, createdAtMin }) => {
        const params = new URLSearchParams({
          limit: String(limit),
          status,
          financial_status: financialStatus,
          fields:
            "id,order_number,created_at,financial_status,fulfillment_status,total_price,subtotal_price,total_tax,currency,line_items,customer,source_name,referring_site,landing_site,note_attributes",
        });
        if (createdAtMin) params.set("created_at_min", createdAtMin);

        const data = await client.get<{ orders: unknown[] }>(`/orders.json?${params}`);
        return data.orders;
      },
    }),

    get_shopify_products: tool({
      description:
        "Get products from the Shopify store. Returns title, status, price, inventory, and variants. Use this to analyze the product catalog.",
      inputSchema: z.object({
        limit: z
          .number()
          .int()
          .min(1)
          .max(250)
          .optional()
          .default(50)
          .describe("Number of products to return (max 250)"),
        status: z
          .enum(["active", "draft", "archived"])
          .optional()
          .describe("Filter by product status (omit to get all)"),
      }),
      execute: async ({ limit, status }) => {
        const params = new URLSearchParams({
          limit: String(limit),
          fields: "id,title,status,product_type,vendor,tags,created_at,updated_at,variants,options",
        });
        if (status) params.set("status", status);

        const data = await client.get<{ products: unknown[] }>(`/products.json?${params}`);
        return data.products;
      },
    }),

    get_shopify_analytics: tool({
      description:
        "Get aggregated sales analytics for the Shopify store: total orders, revenue, average order value, and top products over a date range.",
      inputSchema: z.object({
        createdAtMin: z
          .string()
          .describe("ISO 8601 start date (e.g. 2024-01-01T00:00:00Z)"),
        createdAtMax: z
          .string()
          .optional()
          .describe("ISO 8601 end date (defaults to now)"),
      }),
      execute: async ({ createdAtMin, createdAtMax }) => {
        const params = new URLSearchParams({
          status: "any",
          financial_status: "paid",
          limit: "250",
          fields: "id,total_price,line_items,created_at",
          created_at_min: createdAtMin,
        });
        if (createdAtMax) params.set("created_at_max", createdAtMax);

        const data = await client.get<{ orders: Array<{ id: string; total_price: string; line_items: Array<{ title: string; quantity: number; price: string }> }> }>(`/orders.json?${params}`);
        const orders = data.orders;

        const totalRevenue = orders.reduce((sum, o) => sum + parseFloat(o.total_price), 0);
        const totalOrders = orders.length;
        const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        // Aggregate product sales
        const productMap = new Map<string, { title: string; quantity: number; revenue: number }>();
        for (const order of orders) {
          for (const item of order.line_items) {
            const existing = productMap.get(item.title) ?? { title: item.title, quantity: 0, revenue: 0 };
            existing.quantity += item.quantity;
            existing.revenue += item.quantity * parseFloat(item.price);
            productMap.set(item.title, existing);
          }
        }

        const topProducts = Array.from(productMap.values())
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 10);

        return {
          totalOrders,
          totalRevenue: totalRevenue.toFixed(2),
          averageOrderValue: aov.toFixed(2),
          topProducts,
        };
      },
    }),

    get_shopify_customers: tool({
      description:
        "Get customers from the Shopify store. Returns customer name, email, order count, and total spent. Useful for understanding customer LTV and segmentation.",
      inputSchema: z.object({
        limit: z
          .number()
          .int()
          .min(1)
          .max(250)
          .optional()
          .default(50)
          .describe("Number of customers to return (max 250)"),
        orderBy: z
          .enum(["total_spent", "orders_count", "created_at", "last_order_date"])
          .optional()
          .default("total_spent")
          .describe("Sort customers by this field (descending)"),
      }),
      execute: async ({ limit, orderBy }) => {
        const params = new URLSearchParams({
          limit: String(limit),
          order: `${orderBy} desc`,
          fields:
            "id,first_name,last_name,email,orders_count,total_spent,created_at,last_order_date,tags",
        });

        const data = await client.get<{ customers: unknown[] }>(`/customers.json?${params}`);
        return data.customers;
      },
    }),
  };
}
