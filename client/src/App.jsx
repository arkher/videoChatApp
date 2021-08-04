import React from 'react';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import { Container } from './components/Container/Container';
import Home from './pages/Home/Home';
import Room from './pages/Room/Room'

function App() {
  return (
    <BrowserRouter>
      <Container>
        <Switch>
          <Route exact path="/" component={Home} />
          <Route exact path="/room/:roomId" component={Room} />
        </Switch>
      </Container>
    </BrowserRouter>
  );
}

export default App;
