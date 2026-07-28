export function Footer({
  restaurantName,
  address,
}: {
  restaurantName: string;
  address?: string;
}) {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-400">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <h3 className="text-white text-lg font-semibold mb-2">{restaurantName}</h3>
            <p className="text-sm">&copy; {year} {restaurantName}. All rights reserved.</p>
          </div>

          {/* Address */}
          {address && (
            <div>
              <h4 className="text-white text-sm font-semibold mb-2">Location</h4>
              <p className="text-sm leading-relaxed">{address}</p>
            </div>
          )}

          {/* Powered by */}
          <div className="md:text-right">
            <p className="text-xs">
              Powered by{" "}
              <span className="text-gray-300 font-medium">AutoWeb</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
