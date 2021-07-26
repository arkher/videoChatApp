import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import Peer from 'simple-peer';
import socket from '../../socket';
import { MyVideo, RoomContainer, UserName, VideoAndBarContainer, VideoBox, VideoContainer } from './styles';
import { FaIcon } from '../../components/BottomBar/styles';
import { BottomBar } from '../../components/BottomBar/BottomBar';
import { Chat } from '../../components/Chat/Chat';
import { VideoCard } from '../../components/Video/Video';

const Room = (props: RoomProps) => {
  const currentUser = sessionStorage.getItem('user');
  const [peers, setPeers] = useState<PeerUser[]>([]);
  const [userVideoAudio, setUserVideoAudio] = useState<VideoAudio>({
    localUser: { video: true, audio: true },
  });
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [displayChat, setDisplayChat] = useState(false);
  const [screenShare, setScreenShare] = useState(false);
  const [showVideoDevices, setShowVideoDevices] = useState(false);
  const peersRef = useRef<any>([]);
  const userVideoRef = useRef<any>();
  const screenTrackRef = useRef<any>();
  const userStream = useRef<any>();
  const roomId = props.match.params.roomId;

  useEffect(() => {
    // Get Video Devices
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      const filtered = devices.filter((device) => device.kind === 'videoinput');
      setVideoDevices(filtered);
    });

    // Set Back Button Event
    window.addEventListener('popstate', goToBack);

    // Connect Camera & Mic
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        userVideoRef.current.srcObject = stream;
        userStream.current = stream;

        socket.emit('BE-join-room', { roomId, userName: currentUser });
        socket.on('FE-user-join', (users) => {
          // all users
          const peers: PeerUser[] = [];
          users.forEach(({ userId, info }: User) => {
            let { userName, video, audio } = info;

            if (userName !== currentUser) {
              const peer: any = createPeer(userId, socket.id, stream);

              peer.userName = userName;
              peer.peerID = userId;

              peersRef.current.push({
                peerID: userId,
                peer,
                userName,
              });
              peers.push(peer);

              setUserVideoAudio((preList) => {
                return {
                  ...preList,
                  [peer.userName]: { video, audio },
                };
              });
            }
          });

          setPeers(peers);
        });

        socket.on('FE-receive-call', ({ signal, from, info }) => {
          let { userName, video, audio } = info;
          const peerIdx = findPeer(from);

          if (!peerIdx) {
            const peer: any = addPeer(signal, from, stream);

            peer.userName = userName;

            peersRef.current.push({
              peerID: from,
              peer,
              userName: userName,
            });
            setPeers((users) => {
              return [...users, peer];
            });
            setUserVideoAudio((preList) => {
              return {
                ...preList,
                [peer.userName]: { video, audio },
              };
            });
          }
        });

        socket.on('FE-call-accepted', ({ signal, answerId }) => {
          const peerIdx = findPeer(answerId);
          peerIdx.peer.signal(signal);
        });

        socket.on('FE-user-leave', ({ userId, userName }) => {
          const peerIdx = findPeer(userId);
          peerIdx.peer.destroy();
          setPeers((users) => {
            users = users.filter((user) => user.peerID !== peerIdx.peer.peerID);
            return [...users];
          });
        });
      });

    socket.on('FE-toggle-camera', ({ userId, switchTarget }) => {
      const peerIdx = findPeer(userId);

      setUserVideoAudio((preList: any) => {
        let video = preList[peerIdx.userName].video;
        let audio = preList[peerIdx.userName].audio;

        if (switchTarget === 'video') video = !video;
        else audio = !audio;

        return {
          ...preList,
          [peerIdx.userName]: { video, audio },
        };
      });
    });

    return () => {
      socket.disconnect();
    };
    // eslint-disable-next-line
  }, []);

  function createPeer(userId: number, caller: string, stream: MediaStream) {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
    });

    peer.on('signal', (signal) => {
      socket.emit('BE-call-user', {
        userToCall: userId,
        from: caller,
        signal,
      });
    });
    peer.on('disconnect', () => {
      peer.destroy();
    });

    return peer;
  }

  function addPeer(incomingSignal: string, callerId: number, stream: MediaStream) {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
    });

    peer.on('signal', (signal) => {
      socket.emit('BE-accept-call', { signal, to: callerId });
    });

    peer.on('disconnect', () => {
      peer.destroy();
    });

    peer.signal(incomingSignal);

    return peer;
  }

  function findPeer(id: number) {
    return peersRef.current.find((p: any) => p.peerID === id);
  }

  function createUserVideo(peer: any, index: number, arr: any) {
    return (
      <VideoBox
        className={`width-peer${peers.length > 8 ? '' : peers.length}`}
        onClick={expandScreen}
        key={index}
      >
        {writeUserName(peer.userName, index)}
        <FaIcon className='fas fa-expand' />
        <VideoCard key={index} peer={peer} number={arr.length} />
      </VideoBox>
    );
  }

  function writeUserName(userName: string, index: number) {
    if (userVideoAudio.hasOwnProperty(userName)) {
      if (!userVideoAudio[userName].video) {
        return <UserName key={userName}>{userName}</UserName>;
      }
    }
  }

  // Open Chat
  const clickChat = (e: MouseEvent) => {
    e.stopPropagation();
    setDisplayChat(!displayChat);
  };

  // BackButton
  const goToBack = (e: Event) => {
    e.preventDefault();
    socket.emit('BE-leave-room', { roomId, leaver: currentUser });
    sessionStorage.removeItem('user');
    window.location.href = '/';
  };

  const toggleCameraAudio = (e: ChangeEvent) => {
    const target = e.target.getAttribute('data-switch');

    setUserVideoAudio((preList) => {
      let videoSwitch = preList['localUser'].video;
      let audioSwitch = preList['localUser'].audio;

      if (target === 'video') {
        const userVideoTrack = userVideoRef.current.srcObject.getVideoTracks()[0];
        videoSwitch = !videoSwitch;
        userVideoTrack.enabled = videoSwitch;
      } else {
        const userAudioTrack = userVideoRef.current.srcObject.getAudioTracks()[0];
        audioSwitch = !audioSwitch;

        if (userAudioTrack) {
          userAudioTrack.enabled = audioSwitch;
        } else {
          userStream.current.getAudioTracks()[0].enabled = audioSwitch;
        }
      }

      return {
        ...preList,
        localUser: { video: videoSwitch, audio: audioSwitch },
      };
    });

    socket.emit('BE-toggle-camera-audio', { roomId, switchTarget: target });
  };

  const clickScreenSharing = () => {
    if (!screenShare) {
      navigator.mediaDevices
        // .getDisplayMedia({ cursor: true })
        .getDisplayMedia()
        .then((stream) => {
          const screenTrack = stream.getTracks()[0];

          peersRef.current.forEach(({ peer }: IPeer) => {
            // replaceTrack (oldTrack, newTrack, oldStream);
            peer.replaceTrack(
              peer.streams[0]
                .getTracks()
                .find((track: any) => track.kind === 'video'),
              screenTrack,
              userStream.current
            );
          });

          // Listen click end
          screenTrack.onended = () => {
            peersRef.current.forEach(({ peer }: IPeer) => {
              peer.replaceTrack(
                screenTrack,
                peer.streams[0]
                  .getTracks()
                  .find((track: any) => track.kind === 'video'),
                userStream.current
              );
            });
            userVideoRef.current.srcObject = userStream.current;
            setScreenShare(false);
          };

          userVideoRef.current.srcObject = stream;
          screenTrackRef.current = screenTrack;
          setScreenShare(true);
        });
    } else {
      screenTrackRef.current.onended();
    }
  };

  const expandScreen = (e: any) => {
    const elem = e.target;

    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.mozRequestFullScreen) {
      /* Firefox */
      elem.mozRequestFullScreen();
    } else if (elem.webkitRequestFullscreen) {
      /* Chrome, Safari & Opera */
      elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
      /* IE/Edge */
      elem.msRequestFullscreen();
    }
  };

  const clickBackground = () => {
    if(!showVideoDevices) return;

    setShowVideoDevices(false);
  }

  return (
    <RoomContainer onClick={clickBackground}>
      <VideoAndBarContainer>
        <VideoContainer>
          {/* Current User Video */}
          <VideoBox
            className={`width-peer${peers.length > 8 ? '' : peers.length}`}
          >
            {userVideoAudio['localUser'].video ? null : (
              <UserName>{currentUser}</UserName>
            )}
            <FaIcon className='fas fa-expand' />
            <MyVideo
              onClick={expandScreen}
              ref={userVideoRef}
              muted
              autoPlay
              playsInline
            ></MyVideo>
          </VideoBox>
          {/* Joined User Vidoe */}
          {peers &&
            peers.map((peer, index, arr) => createUserVideo(peer, index, arr))}
        </VideoContainer>
        <BottomBar
          clickScreenSharing={clickScreenSharing}
          clickChat={clickChat}
          goToBack={goToBack}
          toggleCameraAudio={toggleCameraAudio}
          userVideoAudio={userVideoAudio['localUser']}
          screenShare={screenShare}
          videoDevices={videoDevices}
          showVideoDevices={showVideoDevices}
          setShowVideoDevices={setShowVideoDevices}
        />
      </VideoAndBarContainer>
      <Chat display={displayChat} roomId={roomId} />
    </RoomContainer>
  );
};

export {Room};