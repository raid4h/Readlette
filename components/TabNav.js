'use client';

// ============================================================================
// Readlette
// ----------------------------------------------------------------------------
// Simple tab navigation - a row of pill buttons, one active at a time.
// Deliberately dumb: no routing, no URL syncing, just local state in
// page.js deciding what to render. The whole app already lives on one
// page, so there's no need for anything heavier than this.
// ============================================================================

export default function TabNav({ tabs, activeTab, onChange }) {
  return (
    <div className="tab-nav">
      {tabs.map(tab => (
        <button
          key={tab.id}
          type="button"
          className="tab-nav-btn"
          aria-pressed={activeTab === tab.id}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}