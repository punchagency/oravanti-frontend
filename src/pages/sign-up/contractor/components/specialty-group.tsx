import { Folder, Tag } from "lucide-react";
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
  const [expandedSubcategoryIds, setExpandedSubcategoryIds] = useState<
    string[]
  >([]);

  function subcategoryHasSelection(subcategoryId: string) {
    const subcategory = practiceArea.subcategories.find(
      (item) => item.id === subcategoryId,
    );

    return (
      subcategory?.caseTypes.some((caseType) =>
        selectedIds.includes(caseType.id),
      ) ?? false
    );
  }

  function toggleSubcategory(id: string) {
    setExpandedSubcategoryIds((current) =>
      current.includes(id)
        ? current.filter((subcategoryId) => subcategoryId !== id)
        : [...current, id],
    );
  }

  return (
    <div className="specialty-group">
      <div className="specialty-group__header">
        <Folder size={15} />
        <span>{practiceArea.name}</span>
      </div>
      <div className="specialty-tree">
        {practiceArea.subcategories.length > 0 ? (
          practiceArea.subcategories.map((subcategory) => {
            const isExpanded = expandedSubcategoryIds.includes(subcategory.id);
            const isActive = isExpanded || subcategoryHasSelection(subcategory.id);

            return (
              <div className="specialty-tree__section" key={subcategory.id}>
                <button
                  className={
                    isActive
                      ? "specialty-tree__title is-active"
                      : "specialty-tree__title"
                  }
                  type="button"
                  aria-expanded={isExpanded}
                  onClick={() => toggleSubcategory(subcategory.id)}
                >
                  <Tag size={13} />
                  <strong>{subcategory.name}</strong>
                </button>
                {isExpanded && subcategory.caseTypes.length > 0 ? (
                  <div className="specialty-case-list">
                    {subcategory.caseTypes.map((caseType) => (
                      <label className="signup-checkbox" key={caseType.id}>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(caseType.id)}
                          onChange={() => onToggleSpecialty(caseType.id)}
                        />
                        <span>{caseType.name}</span>
                      </label>
                    ))}
                  </div>
                ) : null}
                {isExpanded && subcategory.caseTypes.length === 0 ? (
                  <p className="signup-helper">No public specialties yet.</p>
                ) : null}
              </div>
            );
          })
        ) : (
          <p className="signup-helper">No public specialties yet.</p>
        )}
      </div>
    </div>
  );
}
