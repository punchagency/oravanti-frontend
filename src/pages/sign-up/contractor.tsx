import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm, type Resolver } from "react-hook-form";
import { useNavigate } from "react-router";
import { CompleteView } from "./contractor/components/complete-view";
import { ThemeCircle } from "./contractor/components/theme-circle";
import { contractorStepFields } from "./contractor/constants";
import { useContractorSignup } from "./contractor/hooks/use-contractor-signup";
import { usePublicPracticeAreas } from "./contractor/hooks/use-public-practice-areas";
import {
  contractorSignupSchema,
  defaultContractorSignupValues,
  type ContractorSignupFormValues,
  type ContractorSignupPayload,
} from "./contractor/schema";
import { BackgroundCheckStep } from "./contractor/steps/background-check-step";
import { PayoutSetupStep } from "./contractor/steps/payout-setup-step";
import { PersonalDetailsStep } from "./contractor/steps/personal-details-step";
import { ProfileSetupStep } from "./contractor/steps/profile-setup-step";
import { SpecialtiesStep } from "./contractor/steps/specialties-step";
import type {
  ContractorSignupFieldPath,
  ContractorSignupStep,
} from "./contractor/types";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { useState } from "react";

export function ContractorSignupPage() {
  const navigate = useNavigate();
  const [complete, setComplete] = useState(false);
  const [step, setStep] = useState<ContractorSignupStep>(1);
  const [submitError, setSubmitError] = useState<string>();
  const practiceAreasQuery = usePublicPracticeAreas();
  const contractorSignup = useContractorSignup();
  const methods = useForm<
    ContractorSignupFormValues,
    unknown,
    ContractorSignupPayload
  >({
    resolver: zodResolver(contractorSignupSchema) as Resolver<
      ContractorSignupFormValues,
      unknown,
      ContractorSignupPayload
    >,
    defaultValues: defaultContractorSignupValues,
    mode: "onTouched",
  });

  useDocumentTitle("Contractor signup - Oravanti");

  function goBack() {
    if (step === 1) {
      navigate("/signup");
      return;
    }

    setStep((current) => (Math.max(1, current - 1) as ContractorSignupStep));
  }

  async function goNext() {
    const fields = [
      ...contractorStepFields[step],
    ] as ContractorSignupFieldPath[];
    const stepIsValid = await methods.trigger(fields, { shouldFocus: true });

    if (stepIsValid) {
      setStep((current) => (Math.min(5, current + 1) as ContractorSignupStep));
    }
  }

  function submit(data: ContractorSignupPayload) {
    setSubmitError(undefined);
    contractorSignup.mutate(data, {
      onSuccess: () => setComplete(true),
      onError: (error) => {
        setSubmitError(getErrorMessage(error, "Contractor signup failed."));
      },
    });
  }

  if (complete) return <CompleteView />;

  return (
    <main className="signup-page">
      <ThemeCircle />
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(submit)}>
          <section
            className={step === 2 ? "signup-card signup-card--tall" : "signup-card"}
          >
            {step === 1 ? (
              <PersonalDetailsStep onBack={goBack} onNext={goNext} />
            ) : null}
            {step === 2 ? (
              <SpecialtiesStep
                loading={practiceAreasQuery.isLoading}
                practiceAreas={practiceAreasQuery.data ?? []}
                practiceAreasError={
                  practiceAreasQuery.error
                    ? getErrorMessage(
                        practiceAreasQuery.error,
                        "Unable to load specialties.",
                      )
                    : undefined
                }
                onBack={goBack}
                onNext={goNext}
              />
            ) : null}
            {step === 3 ? (
              <BackgroundCheckStep onBack={goBack} onNext={goNext} />
            ) : null}
            {step === 4 ? (
              <ProfileSetupStep onBack={goBack} onNext={goNext} />
            ) : null}
            {step === 5 ? (
              <PayoutSetupStep
                isSubmitting={contractorSignup.isPending}
                submitError={submitError}
                onBack={goBack}
              />
            ) : null}
          </section>
        </form>
      </FormProvider>
    </main>
  );
}
