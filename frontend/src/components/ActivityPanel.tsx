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
const REFRESH_INTERVAL = 15000;

export default function ActivityPanel({ refreshKey }: { refreshKey: number }) {
  const [items, setItems] = useState<TweetHistoryItem[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // EXPORT STATE (INSIDE COMPONENT)
  const [exporting, setExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [exportStatus, setExportStatus] =
    useState<"success" | "error" | null>(null);

  const refreshTimer = useRef<number | null>(null);

  const fetchPage = async (pageIndex: number, replace = false) => {
    setLoading(true);

    try {
      const res = await fetch(
        `http://localhost:8080/api/tweets/history?limit=${PAGE_SIZE}&offset=${
          pageIndex * PAGE_SIZE
        }`
      );

      const data: TweetHistoryItem[] = await res.json();
      setHasMore(data.length === PAGE_SIZE);

      setItems((prev) => (replace ? data : [...prev, ...data]));
    } catch (err) {
      console.error("Failed to load activity", err);
    } finally {
      setLoading(false);
    }
  };

  //  EXPORT HANDLER
  const runExport = async () => {
    setExporting(true);

  try {
    const result = await (window as any).api.exportTweetHistory();

    if (!result.success) {
      throw new Error(result.message);
    }

    setExportStatus("success");
    setExportMessage("Export completed successfully");

  } catch (err: any) {
    setExportStatus("error");
    setExportMessage(err.message || "Export failed");
  } finally {
    setExporting(false);
  }
  };

  // Initial load
  useEffect(() => {
    setPage(0);
    fetchPage(0, true);
  }, [refreshKey]);

  // Auto-refresh
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

  useEffect(() => {
  if (!exportMessage) return;

  const timer = setTimeout(() => {
    setExportMessage(null);
    setExportStatus(null);
  }, 4000); // ⏱ 4 seconds

  return () => clearTimeout(timer);
}, [exportMessage]);

  return (
    <div className="h-full flex flex-col">
      {/* Export button */}
      <div className="flex items-center gap-3 mb-3">
        <button
          onClick={runExport}
          disabled={exporting}
          className="px-4 py-2 rounded text-sm font-medium
                     bg-[#5865f2] hover:bg-[#4752c4]
                     disabled:opacity-50"
        >
          {exporting ? "Exporting…" : "Export to Excel"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-2">
        <table className="w-full text-sm border-separate border-spacing-y-2">
          <thead className="sticky top-0 text-gray-400">
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
                <td className="px-3 py-3 text-gray-400">
                  {new Date(item.createdAt).toLocaleTimeString()}
                </td>

                <td className="px-3 py-3 truncate max-w-[360px]">
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

      {/* XPORT STATUS POPUP */}
      {exportMessage && (
        <div
          className={`fixed bottom-6 right-6 px-4 py-3 rounded shadow-lg text-sm ${
            exportStatus === "success"
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {exportMessage}
        </div>
      )}
    </div>
  );
}