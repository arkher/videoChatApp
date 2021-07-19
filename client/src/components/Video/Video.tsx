import React, { useEffect, useRef } from 'react';
import { Video } from './styles';

const VideoCard = (props: any) => {
  const ref = useRef<any>();
  const peer = props.peer;

  useEffect(() => {
    peer.on('stream', (stream: MediaStream) => {
      ref.current.srcObject = stream;
    });
    peer.on('track', (track: MediaStream , stream: MediaStream ) => {
    });
  }, [peer]);

  return (
    <Video
      playsInline
      autoPlay
      ref={ref}
    />
  );
};


export {VideoCard};
