import { queryAll } from "@/lib/db";

interface Template {
  id: string;
  name: string;
  config: string;
}

export default async function TemplatesPage() {
  const templates = await queryAll<Template>("SELECT * FROM templates");

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">Templates</h2>
      {templates.length === 0 ? (
        <p className="text-gray-500">No templates found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {templates.map((t) => {
            let config: { primaryColor?: string; secondaryColor?: string } = {};
            try {
              config = JSON.parse(t.config);
            } catch {
              // use empty config on parse failure
            }
            const primaryColor = config.primaryColor || "#3B82F6";
            const secondaryColor = config.secondaryColor || "#F59E0B";

            return (
              <div
                key={t.id}
                className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition bg-white"
              >
                <div
                  style={{ backgroundColor: primaryColor, height: 120 }}
                  className="flex items-center justify-center"
                >
                  <span
                    style={{ color: secondaryColor }}
                    className="text-3xl font-bold"
                  >
                    {t.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold">{t.name}</h3>
                  <div className="flex gap-2 mt-2">
                    <span
                      className="w-4 h-4 rounded-full border border-gray-300"
                      style={{ backgroundColor: primaryColor }}
                    />
                    <span
                      className="w-4 h-4 rounded-full border border-gray-300"
                      style={{ backgroundColor: secondaryColor }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
