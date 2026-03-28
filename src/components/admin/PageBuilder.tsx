'use client';

/**
 * PageBuilder — Visual drag-drop section editor for page content.
 *
 * Uses HTML5 Drag & Drop API (no external library).
 * Sections are stored as a JSON array in the Page model's `sections` field.
 *
 * Phase 1.1 — Mega Mandat Point 8
 */

import { useState, useCallback, useRef } from 'react';
import {
  Plus,
  GripVertical,
  Trash2,
  ChevronUp,
  ChevronDown,
  Eye,
  Pencil,
  X,
  Image,
  Film,
  Users,
  DollarSign,
  HelpCircle,
  Mail,
  MapPin,
  Clock,
  Sparkles,
  Type,
  Layout,
  BarChart3,
  Megaphone,
  Code,
  Star,
  BookOpen,
  ShoppingBag,
  Newspaper,
  LucideIcon,
} from 'lucide-react';

// ── Section type metadata ────────────────────────────────────────────

interface SectionTypeInfo {
  type: string;
  label: string;
  icon: LucideIcon;
  category: 'content' | 'media' | 'interactive' | 'commerce' | 'data';
  description: string;
  defaultData: Record<string, unknown>;
}

const SECTION_TYPES: SectionTypeInfo[] = [
  // ── Existing types ──
  {
    type: 'hero',
    label: 'Hero',
    icon: Layout,
    category: 'content',
    description: 'Banner with title, subtitle and CTA',
    defaultData: { type: 'hero', title: 'Hero Title', subtitle: 'Subtitle text', ctaLabel: 'Learn More', ctaHref: '/' },
  },
  {
    type: 'featured_products',
    label: 'Featured Products',
    icon: ShoppingBag,
    category: 'commerce',
    description: 'Product grid from catalog',
    defaultData: { type: 'featured_products', title: 'Our Products', limit: 6 },
  },
  {
    type: 'featured_courses',
    label: 'Featured Courses',
    icon: BookOpen,
    category: 'commerce',
    description: 'Course grid from LMS',
    defaultData: { type: 'featured_courses', title: 'Our Courses', limit: 6 },
  },
  {
    type: 'testimonials',
    label: 'Testimonials',
    icon: Star,
    category: 'data',
    description: 'Customer testimonials',
    defaultData: { type: 'testimonials', title: 'What Our Customers Say' },
  },
  {
    type: 'features',
    label: 'Features',
    icon: Sparkles,
    category: 'content',
    description: 'Feature grid with icons',
    defaultData: { type: 'features', title: 'Features', items: [{ icon: '🚀', title: 'Fast', description: 'Lightning speed' }] },
  },
  {
    type: 'cta',
    label: 'Call to Action',
    icon: Megaphone,
    category: 'content',
    description: 'Highlighted CTA block',
    defaultData: { type: 'cta', title: 'Ready to Start?', subtitle: 'Join us today', ctaLabel: 'Get Started', ctaHref: '/' },
  },
  {
    type: 'stats',
    label: 'Statistics',
    icon: BarChart3,
    category: 'data',
    description: 'Number stats grid',
    defaultData: { type: 'stats', items: [{ value: '100+', label: 'Clients' }, { value: '50K', label: 'Orders' }] },
  },
  {
    type: 'newsletter',
    label: 'Newsletter',
    icon: Newspaper,
    category: 'interactive',
    description: 'Email subscription form',
    defaultData: { type: 'newsletter', title: 'Stay Updated', subtitle: 'Subscribe to our newsletter' },
  },
  {
    type: 'custom_html',
    label: 'Custom HTML',
    icon: Code,
    category: 'content',
    description: 'Raw HTML content',
    defaultData: { type: 'custom_html', content: '<p>Custom content here</p>' },
  },
  // ── New types (Phase 1.1) ──
  {
    type: 'text_image',
    label: 'Text + Image',
    icon: Image,
    category: 'content',
    description: 'Text and image side by side',
    defaultData: { type: 'text_image', title: 'Section Title', content: '<p>Your text here</p>', imageUrl: '', layout: 'image_right' },
  },
  {
    type: 'gallery',
    label: 'Image Gallery',
    icon: Image,
    category: 'media',
    description: 'Image grid (2-4 columns)',
    defaultData: { type: 'gallery', title: 'Gallery', columns: 3, images: [] },
  },
  {
    type: 'video',
    label: 'Video Embed',
    icon: Film,
    category: 'media',
    description: 'YouTube / Vimeo video',
    defaultData: { type: 'video', title: '', videoUrl: '', aspectRatio: '16:9' },
  },
  {
    type: 'team',
    label: 'Team Members',
    icon: Users,
    category: 'data',
    description: 'Team grid with photos',
    defaultData: { type: 'team', title: 'Our Team', members: [] },
  },
  {
    type: 'pricing_table',
    label: 'Pricing Table',
    icon: DollarSign,
    category: 'commerce',
    description: 'Plan comparison table',
    defaultData: { type: 'pricing_table', title: 'Pricing', plans: [] },
  },
  {
    type: 'faq_accordion',
    label: 'FAQ Accordion',
    icon: HelpCircle,
    category: 'interactive',
    description: 'Expandable FAQ list',
    defaultData: { type: 'faq_accordion', title: 'FAQ', items: [{ question: 'Question?', answer: 'Answer here.' }] },
  },
  {
    type: 'contact_form',
    label: 'Contact Form',
    icon: Mail,
    category: 'interactive',
    description: 'Configurable contact form',
    defaultData: {
      type: 'contact_form', title: 'Contact Us', submitLabel: 'Send',
      fields: [
        { name: 'name', label: 'Name', type: 'text', required: true },
        { name: 'email', label: 'Email', type: 'email', required: true },
        { name: 'message', label: 'Message', type: 'textarea', required: true },
      ],
    },
  },
  {
    type: 'map',
    label: 'Map',
    icon: MapPin,
    category: 'interactive',
    description: 'Google Maps embed',
    defaultData: { type: 'map', title: 'Our Location', embedUrl: '', height: 400 },
  },
  {
    type: 'countdown',
    label: 'Countdown',
    icon: Clock,
    category: 'interactive',
    description: 'Countdown timer to a date',
    defaultData: { type: 'countdown', title: 'Coming Soon', targetDate: new Date(Date.now() + 7 * 86400000).toISOString() },
  },
  {
    type: 'logo_carousel',
    label: 'Logo Carousel',
    icon: Type,
    category: 'data',
    description: 'Partner / client logos',
    defaultData: { type: 'logo_carousel', title: 'Our Partners', logos: [], speed: 'normal' },
  },
];

const CATEGORIES = [
  { key: 'content', label: 'Content' },
  { key: 'media', label: 'Media' },
  { key: 'interactive', label: 'Interactive' },
  { key: 'commerce', label: 'Commerce' },
  { key: 'data', label: 'Data' },
] as const;

// ── PageBuilder interfaces ───────────────────────────────────────────

interface BuilderSection {
  id: string;
  type: string;
  data: Record<string, unknown>;
}

interface PageBuilderProps {
  sections: BuilderSection[];
  onChange: (sections: BuilderSection[]) => void;
}

// ── Helpers ──────────────────────────────────────────────────────────

function generateId() {
  return `sec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ── PageBuilder component ────────────────────────────────────────────

export function PageBuilder({ sections, onChange }: PageBuilderProps) {
  const [showSidebar, setShowSidebar] = useState(false);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editJson, setEditJson] = useState('');
  const [previewMode, setPreviewMode] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const dragCounter = useRef(0);

  // ── Add section ──
  const addSection = useCallback((typeInfo: SectionTypeInfo) => {
    const newSection: BuilderSection = {
      id: generateId(),
      type: typeInfo.type,
      data: { ...typeInfo.defaultData },
    };
    onChange([...sections, newSection]);
    setShowSidebar(false);
  }, [sections, onChange]);

  // ── Remove section ──
  const removeSection = useCallback((idx: number) => {
    const next = [...sections];
    next.splice(idx, 1);
    onChange(next);
    if (editingIdx === idx) setEditingIdx(null);
  }, [sections, onChange, editingIdx]);

  // ── Move section ──
  const moveSection = useCallback((from: number, to: number) => {
    if (from === to) return;
    const next = [...sections];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  }, [sections, onChange]);

  // ── Open JSON editor ──
  const openEditor = useCallback((idx: number) => {
    setEditingIdx(idx);
    setEditJson(JSON.stringify(sections[idx].data, null, 2));
  }, [sections]);

  // ── Save JSON edit ──
  const saveEditor = useCallback(() => {
    if (editingIdx === null) return;
    try {
      const parsed = JSON.parse(editJson);
      const next = [...sections];
      next[editingIdx] = { ...next[editingIdx], data: parsed };
      onChange(next);
      setEditingIdx(null);
    } catch {
      // Invalid JSON — do not close
    }
  }, [editingIdx, editJson, sections, onChange]);

  // ── Drag handlers ──
  const handleDragStart = (e: React.DragEvent, idx: number) => {
    setDragIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(idx));
  };

  const handleDragEnter = (idx: number) => {
    dragCounter.current++;
    setDragOverIdx(idx);
  };

  const handleDragLeave = () => {
    dragCounter.current--;
    if (dragCounter.current === 0) setDragOverIdx(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, toIdx: number) => {
    e.preventDefault();
    dragCounter.current = 0;
    setDragOverIdx(null);
    if (dragIdx !== null && dragIdx !== toIdx) {
      moveSection(dragIdx, toIdx);
    }
    setDragIdx(null);
  };

  const handleDragEnd = () => {
    setDragIdx(null);
    setDragOverIdx(null);
    dragCounter.current = 0;
  };

  // ── Get type info for a section ──
  const getTypeInfo = (type: string) => SECTION_TYPES.find(t => t.type === type);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 bg-slate-50 rounded-lg p-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Section
          </button>
          <span className="text-xs text-slate-500">
            {sections.length} section{sections.length !== 1 ? 's' : ''}
          </span>
        </div>
        <button
          onClick={() => setPreviewMode(!previewMode)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            previewMode ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
          }`}
        >
          <Eye className="w-4 h-4" />
          {previewMode ? 'Editing' : 'Preview'}
        </button>
      </div>

      {/* Section type picker sidebar */}
      {showSidebar && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-800">Choose Section Type</h3>
            <button
              onClick={() => setShowSidebar(false)}
              className="p-1 hover:bg-slate-100 rounded"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>
          {CATEGORIES.map(cat => {
            const types = SECTION_TYPES.filter(t => t.category === cat.key);
            if (types.length === 0) return null;
            return (
              <div key={cat.key} className="mb-3">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">{cat.label}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {types.map(typeInfo => {
                    const Icon = typeInfo.icon;
                    return (
                      <button
                        key={typeInfo.type}
                        onClick={() => addSection(typeInfo)}
                        className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors text-left"
                      >
                        <Icon className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-slate-700 truncate">{typeInfo.label}</p>
                          <p className="text-[10px] text-slate-400 truncate">{typeInfo.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Section list */}
      {sections.length === 0 ? (
        <div className="border-2 border-dashed border-slate-200 rounded-xl p-12 text-center">
          <Layout className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500 mb-2">No sections yet</p>
          <button
            onClick={() => setShowSidebar(true)}
            className="text-sm text-indigo-600 font-medium hover:underline"
          >
            Add your first section
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {sections.map((section, idx) => {
            const info = getTypeInfo(section.type);
            const Icon = info?.icon || Code;
            const isDragging = dragIdx === idx;
            const isDragOver = dragOverIdx === idx;

            return (
              <div
                key={section.id}
                draggable={!previewMode}
                onDragStart={(e) => handleDragStart(e, idx)}
                onDragEnter={() => handleDragEnter(idx)}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, idx)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                  isDragging
                    ? 'opacity-40 border-slate-300 bg-slate-50'
                    : isDragOver
                    ? 'border-indigo-400 bg-indigo-50 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                {/* Drag handle */}
                {!previewMode && (
                  <div className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500">
                    <GripVertical className="w-5 h-5" />
                  </div>
                )}

                {/* Icon & label */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Icon className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">
                      {(section.data.title as string) || info?.label || section.type}
                    </p>
                    <p className="text-[10px] text-slate-400">{info?.label || section.type}</p>
                  </div>
                </div>

                {/* Actions */}
                {!previewMode && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {idx > 0 && (
                      <button
                        onClick={() => moveSection(idx, idx - 1)}
                        className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded"
                        title="Move up"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                    )}
                    {idx < sections.length - 1 && (
                      <button
                        onClick={() => moveSection(idx, idx + 1)}
                        className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded"
                        title="Move down"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => openEditor(idx)}
                      className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                      title="Edit section"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeSection(idx)}
                      className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded"
                      title="Remove section"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* JSON Editor modal (inline) */}
      {editingIdx !== null && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-800">
              Edit: {getTypeInfo(sections[editingIdx]?.type)?.label || sections[editingIdx]?.type}
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditingIdx(null)}
                className="px-3 py-1 text-xs text-slate-500 hover:bg-slate-100 rounded"
              >
                Cancel
              </button>
              <button
                onClick={saveEditor}
                className="px-3 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                Save
              </button>
            </div>
          </div>
          <textarea
            value={editJson}
            onChange={(e) => setEditJson(e.target.value)}
            className="w-full h-64 p-3 font-mono text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-y"
            spellCheck={false}
          />
          <p className="text-[10px] text-slate-400 mt-1">
            Edit the JSON data for this section. Make sure it remains valid JSON.
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Converts PageBuilder sections to the flat JSON array format stored in the DB.
 * Each section's `data` (which includes `type`) becomes a direct array element.
 */
export function builderSectionsToJson(sections: BuilderSection[]): Record<string, unknown>[] {
  return sections.map(s => ({ id: s.id, ...s.data }));
}

/**
 * Parses a raw JSON sections array (from DB) back into BuilderSection format.
 */
export function jsonToBuilderSections(raw: unknown): BuilderSection[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item, idx) => {
    const data = typeof item === 'object' && item !== null ? { ...item } : {};
    const id = (data as Record<string, unknown>).id as string || `sec_imported_${idx}`;
    const type = (data as Record<string, unknown>).type as string || 'custom_html';
    return { id, type, data: data as Record<string, unknown> };
  });
}
