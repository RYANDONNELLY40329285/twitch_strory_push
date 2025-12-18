type Theme = "default" | "green" | "purple" | "custom";

export default function SettingsPanel({
  theme,
  onThemeChange,
  customColor,
  onCustomColorChange,
}: {
  theme: Theme;
  onThemeChange: (t: Theme) => void;
  customColor: string;
  onCustomColorChange: (c: string) => void;
}) {
  return (
    <div className="max-w-md space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Appearance</h3>
        <p className="text-sm text-gray-300">
          Choose how your account modal looks
        </p>
      </div>

      {/* Preset themes */}
      <div className="flex gap-3">
        <button
          onClick={() => onThemeChange("default")}
          className={`px-4 py-2 rounded ${
            theme === "default"
              ? "bg-red-600"
              : "bg-gray-700 hover:bg-gray-600"
          }`}
        >
          Default
        </button>

        <button
          onClick={() => onThemeChange("green")}
          className={`px-4 py-2 rounded ${
            theme === "green"
              ? "bg-green-600"
              : "bg-gray-700 hover:bg-gray-600"
          }`}
        >
          Green
        </button>

        <button
          onClick={() => onThemeChange("purple")}
          className={`px-4 py-2 rounded ${
            theme === "purple"
              ? "bg-purple-600"
              : "bg-gray-700 hover:bg-gray-600"
          }`}
        >
          Purple
        </button>
      </div>

      {/* Custom color */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">
          Custom color
        </label>

        <div className="flex items-center gap-4">
          <input
            type="color"
            value={customColor}
            onChange={(e) => {
              onCustomColorChange(e.target.value);
              onThemeChange("custom");
            }}
            className="w-12 h-12 rounded cursor-pointer bg-transparent"
          />

          <input
            type="text"
            value={customColor}
            onChange={(e) => {
              onCustomColorChange(e.target.value);
              onThemeChange("custom");
            }}
            className="px-3 py-2 bg-gray-800 rounded text-sm w-28"
          />

          <div
            className="w-10 h-10 rounded border border-white/20"
            style={{ backgroundColor: customColor }}
          />
        </div>

        <p className="text-xs text-gray-400">
          Theme is saved automatically
        </p>
      </div>
    </div>
  );
}
