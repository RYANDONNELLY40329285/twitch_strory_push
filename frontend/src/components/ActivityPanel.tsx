import { useEffect, useState, useRef } from "react";

type TweetHistoryItem = {
  id: number;
  platform: string;
  text: string;
  status: string;
  attemptCount: number;
  createdAt: number;
};

const PAGE_SIZE = 20;
const REFRESH_INTERVAL = 15000; // 15 seconds

export default function ActivityPanel({ refreshKey }: { refreshKey: number }) {
  const [items, setItems] = useState<TweetHistoryItem[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const refreshTimer = useRef<number | null>(null);

  const fetchPage = async (pageIndex: number, replace = false) => {
    setLoading(true);

    try {
      const res = await fetch(
        `http://localhost:8080/api/tweets/history?limit=${PAGE_SIZE}&offset=${pageIndex * PAGE_SIZE}`
      );

      const data: TweetHistoryItem[] = await res.json();

      setHasMore(data.length === PAGE_SIZE);

      setItems((prev) =>
        replace ? data : [...prev, ...data]
      );
    } catch (err) {
      console.error("Failed to load activity", err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
useEffect(() => {
  setPage(0);
  fetchPage(0, true);
}, [refreshKey]);

  // Auto-refresh newest page every 15s
  useEffect(() => {
    refreshTimer.current = window.setInterval(() => {
      fetchPage(0, true);
    }, REFRESH_INTERVAL);

    return () => {
      if (refreshTimer.current) {
        clearInterval(refreshTimer.current);
      }
    };
  }, []);

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto pr-2">
        <table className="w-full text-sm border-separate border-spacing-y-2">
          <thead className="sticky top-0 bg-transparent text-gray-400">
            <tr>
              <th className="text-left px-3 py-2">Time</th>
              <th className="text-left px-3 py-2">Message</th>
              <th className="text-left px-3 py-2">Status</th>
              <th className="text-center px-3 py-2">Attempts</th>
            </tr>
          </thead>

          <tbody>
            {items.map((item) => (
              <tr
                key={item.id}
                className="bg-[#2b2d31] hover:bg-[#313338] transition rounded-lg"
              >
                <td className="px-3 py-3 text-gray-400 whitespace-nowrap">
                  {new Date(item.createdAt).toLocaleTimeString()}
                </td>

                <td className="px-3 py-3 max-w-[360px] truncate">
                  {item.text}
                </td>

                <td
                  className={`px-3 py-3 font-semibold ${
                    item.status === "SUCCESS"
                      ? "text-green-400"
                      : item.status === "RATE_LIMITED"
                      ? "text-yellow-400"
                      : "text-red-400"
                  }`}
                >
                  {item.status}
                </td>

                <td className="px-3 py-3 text-center">
                  {item.attemptCount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!loading && items.length === 0 && (
          <p className="text-gray-400 text-center mt-6">
            No activity yet
          </p>
        )}
      </div>

      {/* Load more */}
      {hasMore && (
        <button
          onClick={() => {
            const next = page + 1;
            setPage(next);
            fetchPage(next);
          }}
          disabled={loading}
          className="mt-3 py-2 bg-[#2b2d31] hover:bg-[#313338] rounded text-sm"
        >
          {loading ? "Loading…" : "Load more"}
        </button>
      )}
    </div>
  );
}
