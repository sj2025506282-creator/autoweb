export function Footer({
  restaurantName,
  address,
}: {
  restaurantName: string;
  address?: string;
}) {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-stone-950 text-stone-400">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          {/* Brand */}
          <div>
            <h3 className="font-serif text-2xl text-white">{restaurantName}</h3>
            <p className="mt-3 max-w-xs text-sm leading-6">{address}</p>
          </div>

          {/* Address */}
          {address && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">Find us</h4>
              <p className="mt-3 text-sm leading-6">{address}</p>
            </div>
          )}

          {/* Powered by */}
          <div className="md:text-right">
            <p className="text-xs text-stone-500">
              Powered by{" "}
              <span className="font-medium text-stone-300">AutoWeb</span>
            </p>
          </div>
        </div>
        <div className="mt-12 border-t border-white/10 pt-6 text-xs text-stone-600">
          &copy; {year} {restaurantName}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
