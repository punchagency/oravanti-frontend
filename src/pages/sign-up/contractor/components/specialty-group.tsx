import { ChevronDown, ChevronRight, Folder } from "lucide-react";
import { useState } from "react";
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
  const [isExpanded, setIsExpanded] = useState(true);
  const [caseTypesExpanded, setCaseTypesExpanded] = useState(true);

  return (
    <div className="specialty-group">
      <button
        className="specialty-group__header"
        type="button"
        aria-expanded={isExpanded}
        onClick={() => setIsExpanded((current) => !current)}
      >
        <Folder size={15} />
        <span>{practiceArea.name}</span>
        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>
      {isExpanded ? (
        <div className="specialty-tree">
          <div className="specialty-tree__section">
            <button
              className="specialty-tree__title"
              type="button"
              aria-expanded={caseTypesExpanded}
              onClick={() => setCaseTypesExpanded((current) => !current)}
            >
              <Folder size={14} />
              <strong>Case types</strong>
              {caseTypesExpanded ? (
                <ChevronDown size={13} />
              ) : (
                <ChevronRight size={13} />
              )}
            </button>
            {caseTypesExpanded && practiceArea.caseTypes.length > 0 ? (
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
            ) : null}
            {caseTypesExpanded && practiceArea.caseTypes.length === 0 ? (
              <p className="signup-helper">No public specialties yet.</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
