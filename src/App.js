import React from 'react';
import io from "socket.io-client";
import $ from "jquery";
import reactStringReplace from 'react-string-replace';
import logo from './logo.svg';
import './App.css';
// Componentes a medida
import Button from "./components/Button.js";
import ReplaceUrls from "./components/ReplaceUrls.js";
import ImageUpload from "./components/ImageUpload.js";
import Favs from "./components/Favs.js";
import Ats from "./components/Ats.js";
import UserList from "./components/UserList.js";
import colors from "./components/colors.js";
import VideoChat from "./components/VideoChat.js"

class App extends React.Component {

  constructor(props){
    let getCookieUsername = decodeURIComponent(document.cookie.replace(/(?:(?:^|.*;\s*)username\s*\=\s*([^;]*).*$)|^.*$/, "$1"))
    getCookieUsername = getCookieUsername.length > 0 ? getCookieUsername : null
    super(props);
    this.state = {
      username: getCookieUsername,
      color: colors[ Math.floor( Math.random() * colors.length )],
      uid: null,
      messages: [],
      images: [],
      historyLoaded: false,
    }

    this.socket = io('wss://islaperfecta-server.herokuapp.com');
    this.objCounter = this.objCounter.bind(this);
    this.onLoad = this.onLoad.bind(this);
    this.scrollCheck = this.scrollCheck.bind(this);
    this.handleScroll = this.handleScroll.bind(this);
    this.addMessage = this.addMessage.bind(this);
    this.sendMessage = this.sendMessage.bind(this);
    this.favMessage = this.favMessage.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
  }

  objCounter = (msg_id, type, index) => {
    if (type != 'link') {
      const images = this.state.images;
      const image = {
        msg_id: msg_id,
        index: index,
        loaded: false
      }
      var match = this.state.images.find((img) => img.msg_id === image.msg_id && img.index === image.index);
      if (!match) {
        images.push(image);
        this.setState({images: images});
      }
    }
  }

  onLoad = (msg_id, index) => {
    const images = this.state.images;
    images.map((img) => {
      if (img.msg_id === msg_id && img.index === index && img.loaded === false) {
        img.loaded = true;
        this.setState({images: images});
        var loadCheck = images.filter((i) => i.loaded === true);
        if (images.length === loadCheck.length) {
            var i = 0;
            var ctx = this;
            var intvl = setInterval(function() {
              i += 1;
              if (ctx.state.historyLoaded === false) ctx.scrollCheck(ctx.state, 'history');
              if (ctx.state.historyLoaded === true) ctx.scrollCheck(ctx.state, 'more_history');
              if (i > 5) {
                clearInterval(intvl);
                ctx.setState({historyLoaded:true});
                $('#loader').hide(0);
                $('#loadCover').fadeOut(500);
              }
            }, 100)
        }
      }
    })
  }

  handleScroll = (e) => {
    var scrollY = e.currentTarget.scrollTop;
    var root = document.getElementById('root');
    if (scrollY === 0) {
      $('#loader').show(0);
      var firstMsg = this.state.messages[0];
      this.socket.emit('GET_MORE_HISTORY', {username: this.state.username, firstMsgID: firstMsg._id});
    }
  }

  scrollCheck = (result, type, topEl) => {
    var root = document.getElementById('root');
    var scrollBottom = root.scrollHeight - root.clientHeight;
    if (type === 'more_history' && topEl) {
      var topElNewPos = topEl.getBoundingClientRect().y;
      root.scrollTop = topElNewPos - 20;
      $('#loader').hide(0);
    }
    if (type === 'message' || type === 'history' ) {
      if ((root.clientHeight + root.scrollTop) >= root.scrollHeight - 100 || type === 'history' || result.username === this.state.username ) {
        root.scrollTop = scrollBottom;
      }
    }
  }

  addMessage = (data, type, user) => {
    let result = data;
    const messages = this.state.messages;
    if (type === 'message') {
      messages.push(result);
      this.setState({messages: messages});
      this.scrollCheck(result, type)
    }
    if (type === 'history') {
      if (this.state.historyLoaded === false) {
        result.map(msg => {
          messages.unshift(msg);
          this.setState({messages: messages});
        })
        this.scrollCheck(result, type)
      }
    }
    if (type === 'more_history') {
      if (this.state.username === user) {
        var firstEl = document.getElementById('messageBox').firstChild;
        //console.log(firstEl)
        result.map(msg => {
          messages.unshift(msg);
          this.setState({messages: messages});
        })
        this.scrollCheck(result, type, firstEl)
      }
    }
    if (type === 'get_new_messages') { //añadido esto para cuando un mobile vuelve de idle, cojer los nuevos mensajes
      result.map(msg => {
        messages.push(msg);
      })
      this.setState({messages: messages})
      this.scrollCheck(result, 'message')
    }
  }

  sendMessage = (message) => {
    document.getElementById('msg_input').value = '';
    /* /name comand y detectar si solo son espacios (causaba bug) */
    let nameCommand = message.indexOf('/name ') === 0
    if(nameCommand === true) message = message.substr(6)
    if(/^\s*$/g.test(message) === true) message = null //que no sean solo espacios
    /* */
    if((this.state.username === null || nameCommand === true) && message.length > 0){
      document.cookie = "username="+encodeURIComponent(message)+";max-age="+31536000+";expires="+(Date.UTC(Date.now()+31536000))
      this.setState({username: message})
      this.socket.emit('NEW_USERNAME', {username: message})
      $('#msg_input').removeAttr('placeholder')
    }
    else {
      this.socket.emit('SEND_MESSAGE', {
          username: this.state.username,
          color: this.state.color,
          message: message,
          type: 'message',
      }, function(answer){});
      if(message.indexOf('@') !== -1){
        var sendTos = message.match(/[\@][^\s]*/g)
        sendTos.map((sendTo,i) => {sendTos[i] = sendTo.substr(1)})
        this.socket.emit('SEND_AT', {from: this.state.username, message: message, to: sendTos})
      }
    }
  }

  favMessage = (msg) => {
    this.socket.emit('FAV_MESSAGE', {
      _id: msg._id,
      username: this.state.username
    })
  }

  handleKeyDown = (e) => {
    if(e.keyCode === 13){
      this.sendMessage(e.target.value);
    }
  }

  componentDidMount() {
    var ctx = this;

    /* reconnect copiado directamente de los docs de sockets.io */
    this.socket.on('disconnect', (reason) => {
      if (reason === 'io server disconnect') {
        // the disconnection was initiated by the server, you need to reconnect manually
        this.socket.connect();
      }
      // else the socket will automatically try to reconnect
    });
    this.socket.on('connect', () => {
      this.socket.emit('NEW_USER', {username: this.state.username})
      if(this.state.messages.length > 0){ //comes back from idle (mobile)
        this.socket.emit('GET_NEW_MESSAGES', {lastMsgID: this.state.messages[this.state.messages.length -1]._id})
      }
    })
    this.socket.on('RECEIVE_MESSAGE', function(data, type, user){
        ctx.addMessage(data, type, user);
    })

    // Añadir escuchador para desplazamiento
    var root = document.getElementById('root');
    root.addEventListener('scroll', this.handleScroll);
    /* Codigo feo de jquery a reemplazar para que añada espacios al dropear images */
    $('#msg_input').on('drop', function (ev) {
      //ev.preventDefault();
      var data=ev.originalEvent.dataTransfer.getData("Text");
      $('#msg_input').on('input', function(ev){
          $('#msg_input').val($('#msg_input').val().replace(data, data+' '));
          $('#msg_input').off('input');
      })
    })
  }

  render (){
      return(
        <React.Fragment>
          <UserList socket={this.socket} username={this.state.username} onChangeUsername={this.userListCallback}/>
          {this.state.username? <Favs socket={this.socket} username={this.state.username} /> : null}
          {this.state.username? <Ats socket={this.socket} username={this.state.username} /> : null}
          <div id="loadCover"></div>
          <div id="loader">
            <img src="https://i.ibb.co/HDkTMS4/Impolite-Snappy-Bumblebee-small-2b.gif" />
            <span>Cargando historial...</span>
          </div>
          <div className="content" id="messageBox">
              {this.state.messages.map( (msg, i) =>
                    <p key={msg._id} id={msg._id} className={msg.faved_by.indexOf(this.state.username) !== -1 && msg.faved_by.length > 0? 'faved' : 'unfaved'} onClick={() => this.favMessage(msg)}>
                      <font color={msg.color}>{msg.username}</font>
                  : <ReplaceUrls onLoad={this.onLoad} counter={this.objCounter} message={msg.message} id={msg._id}/></p>
              )}
          </div>
          <div className="input-wrapper">
            <input id="msg_input" type="text" onKeyDown={this.handleKeyDown} placeholder={this.state.username === null? "Enter your username..." : "Tu username es " + this.state.username} autoComplete="off"/>
            <Button onClick={() => this.sendMessage(document.getElementById('msg_input').value)}/>
            <ImageUpload />
            {/*<VideoChat socket={this.socket} />*/}
          </div>
        </React.Fragment>
  )}

}

export default App;
