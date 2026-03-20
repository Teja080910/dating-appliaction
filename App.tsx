import React, { useContext } from 'react';
import AppContext from './src/context/CreateGlobalStateContext';
import SubscriptionModal from './src/components/SubscriptionModal';
import Routes from './src/screens/Navigations/Routes';
import GlobalStateProvider from './src/context/GlobalStateProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import Toast from 'react-native-toast-message';

const App = () => {
  const queryClient = new QueryClient();
  return (
    <QueryClientProvider client={queryClient}>
     <GlobalStateProvider>
      <Routes />
      <Toast />
      <AppSubscriptionWrapper />
     </GlobalStateProvider>
    </QueryClientProvider>
     
  ) ;
};

const AppSubscriptionWrapper = () => {
    const { paywallVisible, setPaywallVisible } = useContext(AppContext);
    return <SubscriptionModal visible={paywallVisible} onClose={() => setPaywallVisible(false)} />;
};

export default App;
