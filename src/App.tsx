import { useEffect } from 'react';
import { Button } from './components/ui/button';
import { SpotifyWidget } from './features/SpotifyWidget';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Capacitor } from '@capacitor/core';

function App() {
  const [searchParams, setSearchParams] = useSearchParams();

  const handleSpotifyLogin = () => {
    const loginUrl = new URL(
      `${import.meta.env.VITE_API_BASE_URL}/spotify/login`
    );

    if (Capacitor.isNativePlatform()) {
      loginUrl.searchParams.set('mobile', '1');
    }

    window.location.href = loginUrl.toString();
  };

  useEffect(() => {
    const syncSpotifyData = async () => {
      const spotify = searchParams.get('spotify');
      if (spotify !== 'success') {
        return;
      }

      const nextSearchParams = new URLSearchParams(searchParams);
      nextSearchParams.delete('spotify');
      setSearchParams(nextSearchParams, { replace: true });
      console.log('Spotify login successful');

      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/spotify/sync-web`
        );
        console.log('Dados do Spotify:', response.data);
      } catch (error) {
        console.error('Spotify sync failed:', error);
      }
    };

    void syncSpotifyData();
  }, [searchParams, setSearchParams]);

  return (
    <>
      <Button onClick={handleSpotifyLogin}>Login Spotify</Button>
      <SpotifyWidget />
    </>
  );
}

export default App;
