'use client';

import { Modal } from '@/components/admin/Modal';

interface Props {
  open: boolean;
  onClose: () => void;
}

// #20: Complete keyboard shortcuts cheat sheet
const SECTIONS = [
  {
    title: 'General',
    shortcuts: [
      { keys: ['Ctrl', 'K'], description: 'Focus search / Command palette' },
      { keys: ['?'], description: 'Toggle this dialog' },
      { keys: ['Ctrl', 'B'], description: 'Toggle sidebar' },
      { keys: ['Ctrl', 'J'], description: 'Open AI Copilot' },
      { keys: ['Escape'], description: 'Close current panel / modal' },
    ],
  },
  {
    title: 'Navigation (press g then...)',
    shortcuts: [
      { keys: ['g', 'h'], description: 'Go to Dashboard' },
      { keys: ['g', 'o'], description: 'Go to Orders' },
      { keys: ['g', 'p'], description: 'Go to Products' },
      { keys: ['g', 'c'], description: 'Go to Clients' },
      { keys: ['g', 'i'], description: 'Go to Inventory' },
      { keys: ['g', 'a'], description: 'Go to Accounting' },
      { keys: ['g', 'm'], description: 'Go to Marketing' },
      { keys: ['g', 'f'], description: 'Go to Formation (LMS)' },
    ],
  },
  {
    title: 'Actions',
    shortcuts: [
      { keys: ['n'], description: 'New item (context-dependent)' },
      { keys: ['r'], description: 'Refresh current page' },
      { keys: ['Ctrl', 'Shift', 'E'], description: 'Export current view' },
    ],
  },
];

function Kbd({ children }: { children: string }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 text-xs font-medium text-slate-600 bg-slate-100 border border-slate-300 rounded shadow-sm">
      {children}
    </kbd>
  );
}

export function KeyboardShortcutsDialog({ open, onClose }: Props) {
  return (
    <Modal isOpen={open} onClose={onClose} title="Keyboard Shortcuts" size="sm">
      <div className="space-y-5">
        {SECTIONS.map((section) => (
          <div key={section.title}>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              {section.title}
            </h3>
            <ul className="space-y-2">
              {section.shortcuts.map((s) => (
                <li key={s.description} className="flex items-center justify-between">
                  <span className="text-sm text-slate-700">{s.description}</span>
                  <span className="flex items-center gap-1">
                    {s.keys.map((k, i) => (
                      <span key={i} className="flex items-center gap-1">
                        {i > 0 && <span className="text-slate-400 text-xs">then</span>}
                        <Kbd>{k}</Kbd>
                      </span>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Modal>
  );
}
