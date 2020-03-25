import React from 'react';
import io from "socket.io-client";
import $ from "jquery";
import logo from './logo.svg';
import './App.css';
const colors = [ 'red', 'green', 'blue', 'magenta', 'purple', 'plum', 'orange' ];

function Button(props){
    return(<label id="enviar" onClick={props.onClick}>⏩</label>);
}
class App extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      username: null,
      color: colors[ Math.floor( Math.random() * colors.length )],
      uid: null,
      messages: []
    }

  this.socket = io('localhost:8080');

  this.socket.on('RECEIVE_MESSAGE', function(data){
      addMessage(data);
  });

  const addMessage = data => {
    let result = data;
    if(result.type == 'message'){
    this.setState(state => {
      const messages = [...state.messages, {
        username: result.username,
        message: result.message,
        color: result.color,
        timestamp: result.timestamp,
      }]
      return{
        messages,
      }
    })
  }
    if(result.type == 'history'){
        result.messageArray.map(message =>
          this.setState( state => {
            const messages = [{
              username: message.username,
              color: message.color,
              message: message.message,
              timestamp: message.timestamp,
            }, ...state.messages]
          })
      )}
    }

    this.sendMessage = (message) => {
        if(this.state.username === null){
          this.setState({username: message});
        }
        else{
          this.socket.emit('SEND_MESSAGE', {
              username: this.state.username,
              color: this.state.color,
              message: message,
              timestamp: Date.now(),
              type: 'message',
          }, function(answer){});
      }

    }

    this.handleKeyDown = (e) => {
      if(e.keyCode === 13){
        this.sendMessage(e.target.value);
        $('#msg_input').val('');
      }
    }
}
  render (){
    return(
      <React.Fragment>
    <div class="content">
      {this.state.messages.map(message =>
        <p key="message"><font color={message.color}>{message.username}</font>
      : { message.message }</p>
    )}
</div>
      <input id="msg_input" type="text" onKeyDown={this.handleKeyDown} placeholder="Enter your username..." />
    <Button onClick={() => this.sendMessage(document.getElementById('msg_input').value)}/>
</React.Fragment>

  )}

  }

export default App;
