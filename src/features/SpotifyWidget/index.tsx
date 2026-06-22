import { useEffect, useState } from 'react';

export function SpotifyWidget() {
  const [track, setTrack] = useState<{
    trackName?: string;
    artist?: string;
    isPlaying: boolean;
    progressMs?: number;
    durationMs?: number;
  }>({ isPlaying: false });

  useEffect(() => {
    const eventSource = new EventSource(
      `${import.meta.env.VITE_API_BASE_URL}/spotify/status-stream?userId=meu-usuario-teste`
    );

    eventSource.onmessage = (event) => {
      const musicData = JSON.parse(event.data);
      setTrack(musicData);
    };

    eventSource.onerror = (err) => {
      console.error('SSE streaming connection error', err);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  return (
    <div
      style={{
        padding: '20px',
        border: '1px solid #1DB954',
        borderRadius: '8px',
      }}
    >
      {track.isPlaying ? (
        <div>
          <h3>Ouvindo agora:</h3>
          <p>
            <strong>Música:</strong> {track.trackName}
          </p>
          <p>
            <strong>Artista:</strong> {track.artist}
          </p>
        </div>
      ) : (
        <p>Nenhuma música tocando no momento.</p>
      )}
    </div>
  );
}
