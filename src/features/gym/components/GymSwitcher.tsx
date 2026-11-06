import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { BottomSheet } from '@/shared/components/BottomSheet';
import { haptics } from '@/shared/utils/haptics';
import type { OwnedGym } from '../services/gymOwnerService';

interface GymSwitcherProps {
  gyms: OwnedGym[];
  selectedGymId: string | null;
  onSelect: (gymId: string) => void;
}

/**
 * Multi-gym selector for the owner dashboard header. Renders nothing for
 * single-gym owners — the gym name is already the page title, so a switch
 * affordance would be redundant.
 *
 * Selection is delegated upward; URL persistence is the dashboard's job
 * (?gym=<id>). This component only owns open/close state for the sheet.
 */
export function GymSwitcher({ gyms, selectedGymId, onSelect }: GymSwitcherProps) {
  const [open, setOpen] = useState(false);
  const selected = gyms.find((g) => g.id === selectedGymId) ?? gyms[0] ?? null;

  if (!selected || gyms.length <= 1) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          haptics.tap();
          setOpen(true);
        }}
        className="gym-switch-btn"
        aria-label={`Switch gym. Currently ${selected.name}`}
      >
        <ChevronDown size={16} strokeWidth={2.5} />
      </button>

      <BottomSheet isOpen={open} onClose={() => setOpen(false)} maxHeight="auto">
        <div className="px-5 pt-4 pb-6">
          <h2 className="gym-card-title mb-1">Switch gym</h2>
          <p className="gym-caption mb-4">
            {gyms.length} gyms you own. Selection is per-tab.
          </p>
          <ul className="flex flex-col gap-1">
            {gyms.map((gym) => {
              const active = gym.id === selected.id;
              return (
                <li key={gym.id}>
                  <button
                    type="button"
                    onClick={() => {
                      haptics.tap();
                      onSelect(gym.id);
                      setOpen(false);
                    }}
                    className="gym-row"
                    aria-pressed={active}
                  >
                    <div className="gym-row-main">
                      <div className="gym-row-title">{gym.name}</div>
                    </div>
                    {active && (
                      <span className="gym-pill gym-pill-active">Current</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </BottomSheet>
    </>
  );
}