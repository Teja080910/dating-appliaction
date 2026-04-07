import { useContext } from 'react';
import AppContext from '../context/CreateGlobalStateContext';

const useSubscriptionGate = () => {
  const { isSubscribed, setPaywallVisible } = useContext(AppContext);

  const requireSubscription = (onAllowed?: () => void) => {
    if (!isSubscribed) {
      setPaywallVisible(true);
      return false;
    }

    onAllowed?.();
    return true;
  };

  return {
    isSubscribed,
    openPaywall: () => setPaywallVisible(true),
    requireSubscription,
  };
};

export default useSubscriptionGate;
