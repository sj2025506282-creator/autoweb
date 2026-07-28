export interface Env {
  DB: D1Database;
  IMAGES: R2Bucket;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // POST /generate — generate demo site from restaurant data
    if (url.pathname === "/generate" && request.method === "POST") {
      const data = (await request.json()) as Record<string, unknown>;
      const { generateDemoSite } = await import("./site-generator");
      const result = await generateDemoSite(env, {
        name: data.name as string,
        phone: (data.phone as string) || "",
        email: (data.email as string) || "",
        address: (data.address as string) || "",
        lat: (data.lat as number) || 0,
        lng: (data.lng as number) || 0,
        menuItems: (data.menuItems as Array<{ name: string; price?: number }>) || [],
        imageUrls: (data.imageUrls as string[]) || [],
        description: (data.description as string) || "",
      });
      return Response.json(result, { status: 201 });
    }

    // POST /search — search Google Maps (placeholder: manual input)
    if (url.pathname === "/search" && request.method === "POST") {
      return Response.json({ results: [] });
    }

    return Response.json({ error: "Not found" }, { status: 404 });
  },
};
