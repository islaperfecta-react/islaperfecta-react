import React from 'react';
import io from "socket.io-client";
import $ from "jquery";
import logo from './logo.svg';
import './App.css';
const colors = [ 'red', 'green', 'blue', 'magenta', 'purple', 'plum', 'orange' ];
const reactStringReplace = require('react-string-replace');

function Button(props){
    return(<label id="enviar" onClick={props.onClick}>⏩</label>);
}
function ReplaceUrls(props) {
      let rawMessage = props.message;
      let replacedMessage = reactStringReplace(rawMessage, /(https?:\/\/[^\s]*\.(?:jpg|jpeg|gif|png|svg))/g, (match, i) => (
        <img src={match}/>));
      replacedMessage = reactStringReplace(replacedMessage, /http(?:s?):\/\/(?:www\.)?youtu(?:be\.com\/watch\?v=|\.be\/)([\w\-\_]*)/g, (match, i) => (
        <iframe width="260" height="161" src={"https://www.youtube.com/embed/" + match + "?loop=1&modestbranding=0&playlist="+ match} frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
      ));
      replacedMessage = reactStringReplace(replacedMessage, /(https?:\/\/[^\s]*)+/g, (match, i) => (
        <a href={match}>{match}</a>
      ));
      return(replacedMessage);
}
class App extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      username: null,
      color: colors[ Math.floor( Math.random() * colors.length )],
      uid: null,
      messages: [],
      historyLoaded: false
    }

    this.socket = io('localhost:8080');

    this.socket.on('RECEIVE_MESSAGE', function(data, type){
        addMessage(data, type);
    });

    const addMessage = (data, type) => {
      let result = data;
      if (type == 'message') {
        this.setState(state => {
          const messages = [...state.messages, {
            username: result.username,
            message: result.message,
            color: result.color,
            timestamp: result.timestamp,
          }]
          return {
            messages,
          }
        })
      }
      if (type == 'history') {
        if (this.state.historyLoaded === false) {
          result.map(msg => {
            this.setState(state => {
              const messages = [...state.messages, {
                username: msg.username,
                message: msg.message,
                color: msg.color,
              }]
              return {
                messages,
              }
            })
          })
          this.setState({historyLoaded:true});
        }
      }
      // Comprobar si el usuario se desplaza hasta la parte abajo de la página y desplazarse para revelar el siguiente mensaje si está
      var root = document.getElementById('root');
      var scrollBottom = root.scrollHeight - root.clientHeight
      if ((root.clientHeight + root.scrollTop) >= root.scrollHeight - 100 || type === 'history') {
        root.scrollTop = scrollBottom;
      }
    }

    this.sendMessage = (message) => {
      if(this.state.username === null){
        this.setState({username: message});
      }
      else {
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
            {this.state.messages.map(msg =>
                <p key="message"><font color={msg.color}>{msg.username}</font>
              : <ReplaceUrls message={msg.message}/></p>
            )}
        </div>
        <input id="msg_input" type="text" onKeyDown={this.handleKeyDown} placeholder="Enter your username..." />
        <Button onClick={() => this.sendMessage(document.getElementById('msg_input').value)}/>
      </React.Fragment>
)}

}

export default App;
