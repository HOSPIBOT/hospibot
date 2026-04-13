import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppNavigator from './src/navigation/AppNavigator';
import { setTokens } from './src/services/api';

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Restore tokens on launch
    AsyncStorage.multiGet(['hospibot_access_token', 'hospibot_refresh_token'])
      .then(([access, refresh]) => {
        if (access[1] && refresh[1]) setTokens(access[1], refresh[1]);
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  if (!ready) return null;
  return <AppNavigator />;
}
