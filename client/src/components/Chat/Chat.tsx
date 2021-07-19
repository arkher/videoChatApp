import React, { useEffect, useState, useRef, ReactElement } from 'react';
import socket from '../../socket';
import { BottomInput, ChatArea, ChatContainer, Message, MessageList, TopHeader, UserMessage } from './styles';

interface ChatProps {
  display: string;
  roomId: number;
}

interface IMessage {
  sender: string;
  msg: string;
}

const Chat = ({ display, roomId }: ChatProps): ReactElement => {
  const currentUser = sessionStorage.getItem('user');
  const [msgs, setMsgs] = useState<any>([]);
  const messagesEndRef = useRef<any>(null);
  const inputRef = useRef<any>();
  
  useEffect(() => {
    socket.on('FE-receive-message', ({ msg, sender }) => {
      setMsgs([...msgs, { sender, msg }]);
    });
  }, []);

  // Scroll to Bottom of Message List
  useEffect(() => {scrollToBottom()}, [msgs])

  const scrollToBottom = () => {
    messagesEndRef?.current?.scrollIntoView({ behavior: 'smooth'});
  }

  const sendMessage = (e: React.ChangeEvent<HTMLInputElement> & React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter') {
      const msg = e.target.value;

      if (msg) {
        socket.emit('BE-send-message', { roomId, msg, sender: currentUser });
        inputRef.current.value = '';
      }
    }
  };

  return (
    <ChatContainer className={display ? '' : 'width0'}>
      <TopHeader>Group Chat Room</TopHeader>
      <ChatArea>
        <MessageList>
          {msgs &&
            msgs.map(({ sender, msg }: IMessage, idx: number) => {
              if (sender !== currentUser) {
                return (
                  <Message key={idx}>
                    <strong>{sender}</strong>
                    <p>{msg}</p>
                  </Message>
                );
              } else {
                return (
                  <UserMessage key={idx}>
                    <strong>{sender}</strong>
                    <p>{msg}</p>
                  </UserMessage>
                );
              }
            })}
            <div style={{float:'left', clear: 'both'}} ref={messagesEndRef} />
        </MessageList>
      </ChatArea>
      <BottomInput
        ref={inputRef}
        onKeyUp={sendMessage}
        placeholder="Enter your message"
      />
    </ChatContainer>
  );
};

export {Chat};
