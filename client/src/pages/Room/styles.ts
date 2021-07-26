import styled from 'styled-components';

export const RoomContainer = styled.div`
  display: flex;
  width: 100%;
  max-height: 100vh;
  flex-direction: row;
`;

export const VideoContainer = styled.div`
  max-width: 100%;
  height: 92%;
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  flex-wrap: wrap;
  align-items: center;
  padding: 15px;
  box-sizing: border-box;
  gap: 10px;
`;

export const VideoAndBarContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100vh;
`;

export const MyVideo = styled.video``;

export const VideoBox = styled.div`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  > video {
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }

  :hover {
    > i {
      display: block;
    }
  }
`;

export const UserName = styled.div`
  position: absolute;
  font-size: calc(20px + 5vmin);
  z-index: 1;
`;

export const FaIcon = styled.i`
  display: none;
  position: absolute;
  right: 15px;
  top: 15px;
`;
