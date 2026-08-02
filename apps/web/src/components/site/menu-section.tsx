import Image from "next/image";
import type { CSSProperties } from "react";
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

function spriteStyle(imageUrl: string): CSSProperties | null {
  const match = imageUrl.match(/^(.*)#tile-(\d+)$/);
  if (!match) return null;
  const tile = Number(match[2]);
  const column = tile % 4;
  const row = Math.floor(tile / 4);
  return {
    backgroundImage: `url("${match[1]}")`,
    backgroundPosition: `${column * 100 / 3}% ${row * 100 / 3}%`,
    backgroundSize: "400% 400%",
  };
}

function formatPrice(price: number): string {
  return price.toLocaleString("en-IE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function MenuSection({
  items,
  currency = "$",
}: {
  items: (MenuItem & { category_name: string })[];
  currency?: string;
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
    <div className="space-y-16">
      {Object.entries(grouped).map(([category, categoryItems]) => (
        <div key={category}>
          <div className="mb-7 flex items-center gap-4">
            <span className="h-px flex-1 bg-stone-200" />
            <h3 className="font-serif text-2xl italic text-stone-900">
            {category}
            </h3>
            <span className="h-px flex-1 bg-stone-200" />
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {categoryItems.map((item) => (
              <div
                key={item.id}
                className="group relative flex gap-5 overflow-hidden rounded-2xl border border-stone-200/80 bg-[#fffdf9] p-3 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-stone-300/40"
              >
                <span className="absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-amber-400 transition duration-300 group-hover:scale-x-100" />
                {/* Image thumbnail */}
                {item.image_url && spriteStyle(item.image_url) && (
                  <div role="img" aria-label={item.name} style={spriteStyle(item.image_url) || undefined}
                    className="h-28 w-28 flex-shrink-0 rounded-xl bg-stone-100 bg-no-repeat transition duration-500 group-hover:scale-105" />
                )}
                {item.image_url && !spriteStyle(item.image_url) && (
                  <div className="h-28 w-28 flex-shrink-0 overflow-hidden rounded-xl bg-stone-100">
                    <Image
                      src={item.image_url}
                      alt={item.name}
                      width={96}
                      height={96}
                      unoptimized
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  </div>
                )}

                {/* Item details */}
                <div className="min-w-0 flex-1 py-2 pr-2">
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="font-serif text-lg font-semibold text-stone-900">{item.name}</h4>
                    {item.price > 0 && (
                      <span className="whitespace-nowrap text-sm font-semibold text-amber-700">
                        {currency}{formatPrice(item.price)}
                      </span>
                    )}
                  </div>
                  {item.description && (
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-stone-500">
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
