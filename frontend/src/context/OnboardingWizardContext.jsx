import React, { createContext, useContext, useState, useCallback } from 'react';

const initialWizard = {
  step: 1,
  show: false,
  registered: false,
  registration: { fullName: '', email: '', password: '', confirmPassword: '' },
  preferences: { incomeSlab: '', spendingStyle: '', categories: [] },
};

const OnboardingWizardContext = createContext(null);

export const OnboardingWizardProvider = ({ children }) => {
  const [wizard, setWizard] = useState(initialWizard);

  const openWizard = useCallback((registration = null) => {
    setWizard(prev => ({
      ...prev,
      show: true,
      step: 1,
      registration: registration || prev.registration,
    }));
  }, []);

  const openPreferences = useCallback(() => {
    setWizard(prev => ({ ...prev, show: true, step: 2, registered: true }));
  }, []);

  const closeWizard = useCallback(() => {
    setWizard(initialWizard);
  }, []);

  const goToStep = useCallback((step) => {
    setWizard(prev => ({ ...prev, step }));
  }, []);

  const saveRegistration = useCallback((registration) => {
    setWizard(prev => ({
      ...prev,
      registration,
      registered: true,
      step: 2,
    }));
  }, []);

  const savePreferences = useCallback((preferences) => {
    setWizard(prev => ({ ...prev, preferences }));
  }, []);

  return (
    <OnboardingWizardContext.Provider value={{
      wizard,
      setWizard,
      openWizard,
      openPreferences,
      closeWizard,
      goToStep,
      saveRegistration,
      savePreferences,
    }}>
      {children}
    </OnboardingWizardContext.Provider>
  );
};

export const useOnboardingWizard = () => {
  const ctx = useContext(OnboardingWizardContext);
  if (!ctx) throw new Error('useOnboardingWizard must be used within OnboardingWizardProvider');
  return ctx;
};