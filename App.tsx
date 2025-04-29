import React from 'react';
import Routes from './src/screens/Navigations/Routes';
import GlobalStateProvider from './src/context/GlobalStateProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const App = () => {
  const queryClient = new QueryClient();
  return (
    <QueryClientProvider client={queryClient}>
     <GlobalStateProvider>
      <Routes />
     </GlobalStateProvider>
    </QueryClientProvider>
     
  ) ;
};

export default App;
