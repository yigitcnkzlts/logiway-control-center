import { useState } from "react";

export default function Tabs({ tabs = [], defaultTab = 0, onChange }) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  const handleTabChange = (index) => {
    setActiveTab(index);
    onChange?.(index);
  };

  if (tabs.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Tab Buttons */}
      <div className="flex gap-1 border-b border-slate-200">
        {tabs.map((tab, index) => (
          <button
            key={index}
            onClick={() => handleTabChange(index)}
            className={`
              px-4 py-2 text-sm font-medium border-b-2 transition-colors
              ${
                activeTab === index
                  ? "border-slate-900 text-slate-900"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {tabs[activeTab]?.content}
      </div>
    </div>
  );
}
