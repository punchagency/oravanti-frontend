import type { FieldPath } from "react-hook-form";
import type { ContractorSignupFormValues } from "./schema";

export type ContractorSignupStep = 1 | 2 | 3 | 4 | 5;

export type ContractorSignupFieldPath = FieldPath<ContractorSignupFormValues>;

export type PublicCaseType = {
  id: string;
  code: string;
  name: string;
  caseNumberPrefix: string;
  jurisdiction: string;
  createdAt: string;
  updatedAt: string;
};

export type PublicPracticeAreaSubcategory = {
  id: string;
  code: string;
  name: string;
  caseTypes: PublicCaseType[];
};

export type PublicPracticeArea = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  subcategories: PublicPracticeAreaSubcategory[];
};
