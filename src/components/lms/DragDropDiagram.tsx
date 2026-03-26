'use client';

/**
 * #16 Drag-and-Drop Diagrams
 * Interactive concept labeling exercises in lessons.
 * Students drag labels to their correct positions on a diagram.
 */

import { useState, useCallback, useRef } from 'react';
import { useTranslations } from '@/hooks/useTranslations';

export interface DiagramLabel {
  id: string;
  text: string;
  correctZoneId: string;
}

export interface DropZone {
  id: string;
  x: number; // percentage
  y: number; // percentage
  width: number; // percentage
  height: number; // percentage
  label?: string;
}

export interface DragDropDiagramProps {
  imageUrl: string;
  imageAlt: string;
  labels: DiagramLabel[];
  dropZones: DropZone[];
  onComplete: (score: number, total: number) => void;
}

export default function DragDropDiagram({
  imageUrl,
  imageAlt,
  labels,
  dropZones,
  onComplete,
}: DragDropDiagramProps) {
  const { t } = useTranslations();
  const [placements, setPlacements] = useState<Record<string, string>>({}); // zoneId -> labelId
  const [draggedLabel, setDraggedLabel] = useState<string | null>(null);
  const [isChecked, setIsChecked] = useState(false);
  const [results, setResults] = useState<Record<string, boolean>>({});
  const containerRef = useRef<HTMLDivElement>(null);

  const unplacedLabels = labels.filter(
    l => !Object.values(placements).includes(l.id)
  );

  const handleDragStart = useCallback((labelId: string) => {
    setDraggedLabel(labelId);
  }, []);

  const handleDrop = useCallback((zoneId: string) => {
    if (!draggedLabel) return;

    setPlacements(prev => {
      const next = { ...prev };
      // Remove label from any previous zone
      for (const [key, val] of Object.entries(next)) {
        if (val === draggedLabel) delete next[key];
      }
      // Place in new zone
      next[zoneId] = draggedLabel;
      return next;
    });
    setDraggedLabel(null);
  }, [draggedLabel]);

  const handleCheck = useCallback(() => {
    const newResults: Record<string, boolean> = {};
    let correct = 0;

    for (const zone of dropZones) {
      const placedLabelId = placements[zone.id];
      const label = labels.find(l => l.id === placedLabelId);
      const isCorrect = label?.correctZoneId === zone.id;
      newResults[zone.id] = isCorrect;
      if (isCorrect) correct++;
    }

    setResults(newResults);
    setIsChecked(true);
    onComplete(correct, dropZones.length);
  }, [placements, dropZones, labels, onComplete]);

  const handleReset = useCallback(() => {
    setPlacements({});
    setResults({});
    setIsChecked(false);
  }, []);

  const getLabelForZone = (zoneId: string): DiagramLabel | undefined => {
    const labelId = placements[zoneId];
    return labels.find(l => l.id === labelId);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">
        {t('lms.dragDropTitle') || 'Label the Diagram'}
      </h3>
      <p className="text-sm text-gray-600">
        {t('lms.dragDropInstructions') || 'Drag each label to its correct position on the diagram.'}
      </p>

      {/* Diagram Area */}
      <div
        ref={containerRef}
        className="relative border-2 border-dashed border-gray-300 rounded-xl overflow-hidden bg-gray-50"
        style={{ aspectRatio: '16/9' }}
      >
        {/* Background Image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={imageAlt}
          className="w-full h-full object-contain"
          draggable={false}
        />

        {/* Drop Zones */}
        {dropZones.map((zone) => {
          const placedLabel = getLabelForZone(zone.id);
          const isCorrect = results[zone.id];
          const isWrong = isChecked && !isCorrect && placedLabel;

          return (
            <div
              key={zone.id}
              className={`absolute border-2 rounded-lg flex items-center justify-center transition-all ${
                isChecked
                  ? isCorrect
                    ? 'border-green-500 bg-green-100/80'
                    : isWrong
                    ? 'border-red-500 bg-red-100/80'
                    : 'border-gray-400 bg-gray-100/80'
                  : draggedLabel
                  ? 'border-blue-400 bg-blue-50/60 cursor-pointer'
                  : 'border-gray-300 bg-white/60'
              }`}
              style={{
                left: `${zone.x}%`,
                top: `${zone.y}%`,
                width: `${zone.width}%`,
                height: `${zone.height}%`,
              }}
              onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
              onDrop={(e) => { e.preventDefault(); handleDrop(zone.id); }}
              onClick={() => { if (draggedLabel && !isChecked) handleDrop(zone.id); }}
              role="region"
              aria-label={zone.label || `Drop zone ${zone.id}`}
            >
              {placedLabel ? (
                <span className={`text-xs font-medium px-2 py-1 rounded ${
                  isChecked
                    ? isCorrect ? 'text-green-800' : 'text-red-800'
                    : 'text-gray-800'
                }`}>
                  {placedLabel.text}
                  {isChecked && (isCorrect ? ' ✓' : ' ✕')}
                </span>
              ) : (
                <span className="text-xs text-gray-400">
                  {zone.label || '?'}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Labels to drag */}
      <div className="flex flex-wrap gap-2" role="list" aria-label={t('lms.availableLabels') || 'Available labels'}>
        {unplacedLabels.map((label) => (
          <button
            key={label.id}
            draggable={!isChecked}
            onDragStart={() => handleDragStart(label.id)}
            onClick={() => {
              if (!isChecked) {
                setDraggedLabel(draggedLabel === label.id ? null : label.id);
              }
            }}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-grab active:cursor-grabbing ${
              draggedLabel === label.id
                ? 'bg-blue-500 text-white ring-2 ring-blue-300'
                : 'bg-white border border-gray-300 text-gray-800 hover:border-blue-400 hover:bg-blue-50'
            } ${isChecked ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={isChecked}
            role="listitem"
          >
            {label.text}
          </button>
        ))}
        {unplacedLabels.length === 0 && !isChecked && (
          <p className="text-sm text-gray-500 italic">
            {t('lms.allLabelsPlaced') || 'All labels placed! Click Check to verify.'}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        {!isChecked ? (
          <button
            onClick={handleCheck}
            disabled={Object.keys(placements).length === 0}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {t('lms.checkAnswers') || 'Check Answers'}
          </button>
        ) : (
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            {t('lms.tryAgain') || 'Try Again'}
          </button>
        )}
      </div>

      {/* Score */}
      {isChecked && (
        <div className={`p-3 rounded-lg text-sm font-medium ${
          Object.values(results).every(Boolean)
            ? 'bg-green-50 text-green-800'
            : 'bg-amber-50 text-amber-800'
        }`}>
          {Object.values(results).filter(Boolean).length} / {dropZones.length}{' '}
          {t('lms.correct') || 'correct'}
          {Object.values(results).every(Boolean) && (' 🎉')}
        </div>
      )}
    </div>
  );
}
