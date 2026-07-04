import { useState } from 'react'

// Pages
import HeroPage from './HeroPage';
import ChatRoomPage from './ChatRoom';

function App() {
  const [roomConfig, setRoomConfig] = useState(null);

  const handleStartRoom = (config) => {
    setRoomConfig(config);
  };

  const handleLeaveRoom = () => {
    setRoomConfig(null);
  };

  return (
    <>
      {roomConfig ? (
        <ChatRoomPage
          roomCode="A8F3D2"
          roomName={roomConfig.roomName}
          durationSeconds={roomConfig.durationSeconds}
          userAlias={roomConfig.alias}
          maxParticipants={roomConfig.maxParticipants}
          onLeave={handleLeaveRoom}
        />
      ) : (
        <HeroPage onStartRoom={handleStartRoom} />
      )}
    </>
  )
}

export default App