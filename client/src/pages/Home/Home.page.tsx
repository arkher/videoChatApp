import React, { useRef, useState, useEffect } from 'react';
import socket from '../../socket';
import { Error, Input, JoinButton, Label, MainContainer, Row } from './styles';
import { History, LocationState } from "history";

interface HomeProps {
  history: History<LocationState>
}

const Home = (props: HomeProps): React.ReactElement => {
  const roomRef = useRef<any>();
  const userRef = useRef<any>();
  const [err, setErr] = useState(false);
  const [errMsg, setErrMsg] = useState('');

  useEffect(() => {
    console.log('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
    
    socket.on('FE-error-user-exist', ({ error }) => {
      if (!error) {
        const roomName = roomRef.current.value;
        const userName = userRef.current.value;

        sessionStorage.setItem('user', userName);
        props.history.push(`/room/${roomName}`);
      } else {
        setErr(error);
        setErrMsg('User name already exist');
      }
    });
  }, [props.history]);

  function clickJoin() {
    const roomName = roomRef.current.value;
    const userName = userRef.current.value;

    if (!roomName || !userName) {
      setErr(true);
      setErrMsg('Enter Room Name or User Name');
    } else {
      socket.emit('BE-check-user', { roomId: roomName, userName });
    }
  }

  return (
    <MainContainer>
      <Row>
        <Label htmlFor="roomName">Room Name</Label>
        <Input type="text" id="roomName" ref={roomRef} />
      </Row>
      <Row>
        <Label htmlFor="userName">User Name</Label>
        <Input type="text" id="userName" ref={userRef} />
      </Row>
      <JoinButton onClick={clickJoin}> Join </JoinButton>
      {err ? <Error>{errMsg}</Error> : null}
    </MainContainer>
  );
};

export {Home};
