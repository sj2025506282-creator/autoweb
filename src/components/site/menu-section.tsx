import type { MenuItem } from "@/types";

interface GroupedItems {
  [category: string]: (MenuItem & { category_name: string })[];
}

function groupByCategory(items: (MenuItem & { category_name: string })[]): GroupedItems {
  const groups: GroupedItems = {};
  for (const item of items) {
    const cat = item.category_name || "Other";
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(item);
  }
  return groups;
}

export function MenuSection({
  items,
}: {
  items: (MenuItem & { category_name: string })[];
}) {
  if (!items || items.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg">Menu items coming soon.</p>
      </div>
    );
  }

  const grouped = groupByCategory(items);

  return (
    <div className="space-y-12">
      {Object.entries(grouped).map(([category, categoryItems]) => (
        <div key={category}>
          <h3 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b border-gray-200">
            {category}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {categoryItems.map((item) => (
              <div
                key={item.id}
                className="flex gap-4 p-4 rounded-lg border border-gray-100 hover:shadow-md transition-shadow bg-white"
              >
                {/* Image thumbnail */}
                {item.image_url && (
                  <div className="flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Item details */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="font-semibold text-gray-900 truncate">{item.name}</h4>
                    {item.price > 0 && (
                      <span className="text-sm font-bold text-gray-900 whitespace-nowrap">
                        ${item.price.toFixed(2)}
                      </span>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
