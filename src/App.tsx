import { useState, useEffect, useRef } from 'react';
import { User } from 'firebase/auth';
import { ensureAnonymousAuth, subscribeToAuthState, getPlayerProfile } from './firebase/auth';
import { subscribeToRoom, joinRoom, leaveRoom } from './firebase/roomService';
import { RoomData } from './types/room';
import { LobbyPage } from './pages/LobbyPage';
import { WaitingRoomPage } from './pages/WaitingRoomPage';
import { GamePage } from './pages/GamePage';
import { GalleryPage } from './pages/GalleryPage';

type AppView = 'lobby' | 'waiting' | 'game' | 'gallery';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [view, setView] = useState<AppView>('lobby');
  const joiningRoomIdRef = useRef<string | null>(null);

  // 1. Inicialización y autenticación anónima
  useEffect(() => {
    ensureAnonymousAuth().then((user) => {
      if (user) setCurrentUser(user);
    });

    const unsubscribeAuth = subscribeToAuthState((user) => {
      setCurrentUser(user);
    });

    // Leer código de sala de la URL al cargar
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setActiveRoomId(roomParam.toUpperCase());
    }

    return () => {
      unsubscribeAuth();
    };
  }, []);

  // 2. Suscripción al estado de la sala activa
  useEffect(() => {
    if (!activeRoomId) {
      setRoomData(null);
      joiningRoomIdRef.current = null;
      if (view !== 'gallery') {
        setView('lobby');
      }
      return;
    }

    const unsubscribeRoom = subscribeToRoom(activeRoomId, (data) => {
      setRoomData(data);
      if (!data) {
        // Sala eliminada o no encontrada
        setActiveRoomId(null);
        joiningRoomIdRef.current = null;
        setView('lobby');
        return;
      }

      if (data.status === 'waiting') {
        setView('waiting');
      } else if (data.status === 'playing' || data.status === 'finished') {
        setView('game');
      }
    });

    return () => {
      unsubscribeRoom();
    };
  }, [activeRoomId, view]);

  // 3. Auto-registro del jugador en los miembros de la sala al entrar por enlace
  useEffect(() => {
    if (!activeRoomId || !currentUser || !roomData) return;

    const isMember = roomData.members.some((m) => m.uid === currentUser.uid);
    if (!isMember && joiningRoomIdRef.current !== activeRoomId) {
      joiningRoomIdRef.current = activeRoomId;
      const profile = getPlayerProfile();
      joinRoom(activeRoomId, profile).catch((err) => {
        console.warn('Aviso al auto-unirse a la sala:', err);
        joiningRoomIdRef.current = null;
      });
    }
  }, [activeRoomId, currentUser, roomData]);

  const handleJoinOrCreateRoom = (roomId: string) => {
    setActiveRoomId(roomId);
    const url = new URL(window.location.href);
    url.searchParams.set('room', roomId);
    window.history.pushState({}, '', url.toString());
  };

  const handleLeaveRoom = async () => {
    if (activeRoomId && currentUser) {
      await leaveRoom(activeRoomId, currentUser.uid).catch(() => {});
      setActiveRoomId(null);
      const url = new URL(window.location.href);
      url.searchParams.delete('room');
      window.history.pushState({}, '', url.toString());
    }
    setView('lobby');
  };

  // Render según la vista actual
  if (view === 'gallery') {
    return <GalleryPage onBack={() => setView('lobby')} />;
  }

  if (view === 'game' && activeRoomId && currentUser) {
    return (
      <GamePage
        roomId={activeRoomId}
        currentUserUid={currentUser.uid}
        onExitRoom={handleLeaveRoom}
      />
    );
  }

  if (view === 'waiting' && roomData && currentUser) {
    return (
      <WaitingRoomPage
        room={roomData}
        currentUserUid={currentUser.uid}
        onExit={handleLeaveRoom}
      />
    );
  }

  return (
    <LobbyPage
      onJoinRoom={handleJoinOrCreateRoom}
      onOpenGallery={() => setView('gallery')}
    />
  );
}
