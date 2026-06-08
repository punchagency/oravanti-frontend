import { ChevronDown, Folder } from "lucide-react";
import type { PublicPracticeArea } from "../types";

type SpecialtyGroupProps = {
  practiceArea: PublicPracticeArea;
  selectedIds: string[];
  onToggleSpecialty: (id: string) => void;
};

export function SpecialtyGroup({
  practiceArea,
  selectedIds,
  onToggleSpecialty,
}: SpecialtyGroupProps) {
  return (
    <div className="specialty-group">
      <button className="specialty-group__header" type="button">
        <Folder size={15} />
        <span>{practiceArea.name}</span>
        <ChevronDown size={14} />
      </button>
      <div className="specialty-tree">
        <div className="specialty-tree__section">
          <div className="specialty-tree__title">
            <Folder size={14} />
            <strong>Case types</strong>
            <ChevronDown size={13} />
          </div>
          {practiceArea.caseTypes.length > 0 ? (
            practiceArea.caseTypes.map((caseType) => (
              <label className="signup-checkbox" key={caseType.id}>
                <input
                  type="checkbox"
                  checked={selectedIds.includes(caseType.id)}
                  onChange={() => onToggleSpecialty(caseType.id)}
                />
                <span>{caseType.name}</span>
              </label>
            ))
          ) : (
            <p className="signup-helper">No public specialties yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
