interface RoomProps {
  match: {params: {roomId: number}}
}

interface PeerUser {
  userName: string;
  peerID: number;
}

interface UserInfo {
  userName: string;
  audio: boolean;
  video: boolean;
}

interface User {
  userId: number;
  info: UserInfo;
}

interface VideoAudio {
  [user: string]: {
    video: boolean;
    audio: boolean;
  }
}

interface IPeer {
  peer: any;
}
