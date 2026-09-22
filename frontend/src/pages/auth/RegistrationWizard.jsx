import React, { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useOnboardingWizard } from '../../context/OnboardingWizardContext';
import { RegisterStep } from './RegisterStep';
import { PreferencesStep } from './PreferencesStep';

export const RegistrationWizard = () => {
  const { isAuthenticated } = useAuth();
  const { wizard, goToStep } = useOnboardingWizard();

  // Users who are already authenticated (e.g. past login) with incomplete
  // preferences should land directly on the preferences step.
  useEffect(() => {
    if (isAuthenticated && !wizard.registered && wizard.step === 1) {
      goToStep(2);
    }
  }, [isAuthenticated, wizard.registered, wizard.step, goToStep]);

  return wizard.step === 1 ? <RegisterStep /> : <PreferencesStep />;
};