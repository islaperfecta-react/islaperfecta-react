import React from 'react';
import io from "socket.io-client";
import $ from "jquery";
import logo from './logo.svg';
import './App.css';
const colors = [ 'red', 'green', 'blue', 'magenta', 'purple', 'plum', 'orange' ];
const reactStringReplace = require('react-string-replace');
const axios = require('axios').default;

function Button(props) {
    return(<label id="enviar" onClick={props.onClick}>⏩</label>);
}
function ReplaceUrls(props) {
      let message = props.message,
          mat,
          replace = (type, regex, element) => {
            while (mat = regex.exec(message)) {
              message = reactStringReplace(message, regex, (match, i) => (
                props.counter(props.id, type, mat.index),
                element(match, i)
              ));
            }
          };
      replace('img', /(https?:\/\/[^\s]*\.(?:jpg|jpeg|gif|png|svg))/g, (match, index, offset) =>
          <img className={index} onLoad={props.onLoad(props.id, mat.index)} src={match}/>
      );
      replace('iframe', /http(?:s?):\/\/(?:www\.)?youtu(?:be\.com\/watch\?v=|\.be\/)([\w\-\_]*)/g, (match, index, offset) =>
          <iframe onLoad={props.onLoad(props.id, mat.index)} width="260" height="161" src={"https://www.youtube.com/embed/" + match + "?loop=1&playlist="+ match} frameBorder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowFullScreen="1"></iframe>
      );
      replace('link', /(https?:\/\/[^\s]*)+/g, (match, index, offset) =>
          <a href={match}>{match}</a>
      );
      return(message);
}

class ImageUpload extends React.Component {
  constructor(props) {
    super(props);
    this.imgBBuploadRef = React.createRef();
  }
  attachURL(url){
    let messageBox = $('#msg_input');
    messageBox.val(messageBox.val() + ' ' + url + ' ');
  }
  upload(file){
    /*
    I tried to get it working with axios but i cant,
      might be because of this: https://stackoverflow.com/questions/60651033/jquery-ajax-working-but-axios-giving-cors-error
      here is the imgbb api info: https://api.imgbb.com/
    */
    // da el error "Network Error"

    /*
    let formPost = new FormData(this.imgBBuploadRef.current);
    axios.post('https://api.imgbb.com/1/upload?key=f78e74601edcdc526eb41972404beeaa', {
      data: formPost
    })
    .then( (response) => this.attachURL(response))
    .catch(function(error) {
      console.log(error);
    })
    */

    //asi que lo hago con jquery
    let formPost = new FormData(this.imgBBuploadRef.current);
    console.log(formPost[0]);
    $.ajax({
      url: 'https://api.imgbb.com/1/upload?key=f78e74601edcdc526eb41972404beeaa',
      method: 'POST',
      data: formPost,
      contentType: false, //not sure why but its needed
      processData: false, //same
      error: function(response){ console.log(response)},
      success: (response) => this.attachURL(response.data.url)}
      )
  }
  render(){
    return(
      <form ref={this.imgBBuploadRef} >
      <label htmlFor="image-upload" id="upload-label" className="disney">
        📁
        <input name="image" type="file" id="image-upload" accept="capture=camera" className="display-none" onChange={(event) => this.upload(event.target.value)}/>
      </label>
      </form>
    )
  }
}
function parseFavs(favs){
  var justImages = []
  favs.map( (fav) =>
    justImages.push(fav.message)
  )
  justImages = justImages.join(' ')
  return justImages.match(/(https?:\/\/[^\s]*\.(?:jpg|jpeg|gif|png|svg))/g)
}
class Favs extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      images: [],
      username: props.username,
      favsOpen: false
    }
    this.socket = props.socket
    this.socket.on('FAVED_MESSAGE', (msg, favedby) => newFav(msg, favedby))
    this.socket.on('UNFAVED_MESSAGE', (msg) => unFavMsg(msg))
    this.socket.on('GOT_FAVS', (results) =>  fillFavs(results))
    const fillFavs = (favs)=>{
      let imageArray = parseFavs(favs)
      this.setState({images: imageArray})
    }
    const unFavMsg = (msg)=>{
      document.getElementById(msg._id).className = 'unfaved'
    }
    const newFav = (favedMessage, whoFaved) =>{
      //TODO this.setState({images: [...favedMessage.message.match(/(https?:\/\/[^\s]*\.(?:jpg|jpeg|gif|png|svg))/g),...this.state.images]})
      var favedMessageDOM = document.getElementById(favedMessage._id)
      if(whoFaved === this.state.username){
          favedMessageDOM.className = 'faved'
        }
      if(favedMessage.username === this.state.username){
        //te hicieron fav
      }

      let newSpan = document.createElement("span")
      newSpan.className = "favIn"
      let spanText = document.createTextNode("💖"+whoFaved);
      newSpan.appendChild(spanText)
      newSpan.style.top = (favedMessageDOM.getBoundingClientRect().bottom -40).toString() + "px";
      newSpan.style.color = colors[ Math.floor( Math.random() * colors.length )];
      favedMessageDOM.insertBefore(newSpan, favedMessageDOM.firstChild)
      setTimeout(() => newSpan.className = "favOut", 50)
    }
    this.showFavs = () =>{
      if(this.state.favsOpen){
        $('#favOpen').hide("slow")
        this.setState({favsOpen: false})
      }
      else{
      this.socket.emit('GET_FAVS', this.state.username)
      $('#favOpen').show("slow")
      this.setState({favsOpen: true})
      }
    }
    this.addImage = (favImg) =>{
      $('#msg_input').val($('#msg_input').val() + ' ' + favImg + ' ')
    }
    }
  componentDidMount(){
  }
  render(){
    return(
      <div id="favs" >
        <a className="disney" href="#" onClick={this.showFavs}>
          FAVS
        </a>
        <div id="favOpen">{this.state.images!==null? this.state.images.map( (favImage) =>
          <p>
            <img src={favImage} onClick={() => this.addImage(favImage)} width="120px" height="76px" />
        </p>
      ) : 'nofavs '}</div>
    </div>
    )
  }
}
class Ats extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      ats: [],
      atsOpen: false
    }
    this.socket = props.socket
    this.socket.on('GOT_ATS', (results) =>  fillAts(results))
    const fillAts = (ats)=>{
      this.setState({ats: ats});
    }
    console.log('called')
    this.showAts = () =>{
      if(this.state.atsOpen){
        $('#atsOpen').hide("slow")
        this.setState({atsOpen: false})
      }
      else{
      this.socket.emit('GET_ATS', {username: props.username})
      $('#atsOpen').show("slow")
      this.setState({atsOpen: true})
      }
    }
    this.replaceUrls = (msgToReplace) => {
      let rawMessage = msgToReplace;
      let replacedMessage = reactStringReplace(rawMessage, /(https?:\/\/[^\s]*\.(?:jpg|jpeg|gif|png|svg))/g, (match, i) => (
        <img src={match} width="160%"/>));
      replacedMessage = reactStringReplace(replacedMessage, /http(?:s?):\/\/(?:www\.)?youtu(?:be\.com\/watch\?v=|\.be\/)([\w\-\_]*)/g, (match, i) => (
        <iframe width="160%" src={"https://www.youtube.com/embed/" + match + "?loop=1&modestbranding=0&playlist="+ match} frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
      ));
      replacedMessage = reactStringReplace(replacedMessage, /(https?:\/\/[^\s]*)+/g, (match, i) => (
        <a href={match}>{match}</a>
      ));
      return(replacedMessage);
}
    }
  render(){
    return(
      <div id="ats">
        <a className="disney" href="#" onClick={this.showAts}>
          show @s
        </a>
        <div id="atsOpen">{this.state.ats.length > 0? (this.state.ats.map( (at) =>
          <p>
            {at.from}: {this.replaceUrls(at.message)}
        </p>
      )) : 'no @ts '}</div>
    </div>
    )
  }
}
class UserList extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      userlist: [],
      username: props.username
    }
    this.socket = props.socket
    this.socket.on('NEW_USERLIST', (newList) => this.setState({userlist: newList}))
    this.socket.on('GONE_USER', (user) => removeUser(user))
    const removeUser = (elquesefue) =>{
      let newList = this.state.userlist
      newList.splice(this.state.userlist.indexOf(elquesefue),1)
      this.setState({userlist: newList})
    }
  }
  componentDidMount(){
    this.socket.emit('NEW_USER', {username: this.state.username})
  }
  render(){
    return(
      <div id="userlist" className="userlist">
        <marquee >
        {this.state.userlist.map( (user) =>
          <>{user + " "}</>
        )}
      </marquee>
      </div>
    )
  }
}
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

    this.socket = io('localhost:8080');

    this.socket.on('RECEIVE_MESSAGE', function(data, type, user){
        addMessage(data, type, user);
    })

    this.objCounter = (msg_id, type, index) => {
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

    this.onLoad = (msg_id, index) => {
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
                if (ctx.state.historyLoaded === false) scrollCheck(ctx.state, 'history');
                if (ctx.state.historyLoaded === true) scrollCheck(ctx.state, 'more_history');
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

    this.sendMessage = (message) => {
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
    this.favMessage = (msg) => {
      this.socket.emit('FAV_MESSAGE', {
        _id: msg._id,
        username: this.state.username
      })
    }

    this.handleKeyDown = (e) => {
      if(e.keyCode === 13){
        this.sendMessage(e.target.value);
      }
    }

    this.handleScroll = (e) => {
      var scrollY = e.currentTarget.scrollTop;
      var root = document.getElementById('root');
      if (scrollY === 0) {
        $('#loader').show(0);
        var firstMsg = this.state.messages[0];
        this.socket.emit('GET_MORE_HISTORY', {username: this.state.username, firstMsgID: firstMsg._id});
      }
    }

    const scrollCheck = (result, type, topEl) => {
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

    const addMessage = (data, type, user) => {
      let result = data;
      const messages = this.state.messages;
      if (type === 'message') {
        messages.push(result);
        this.setState({messages: messages});
        scrollCheck(result, type)
      }
      if (type === 'history') {
        if (this.state.historyLoaded === false) {
          result.map(msg => {
            messages.unshift(msg);
            this.setState({messages: messages});
          })
          scrollCheck(result, type)
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
          scrollCheck(result, type, firstEl)
        }
      }

    }
}
componentDidMount() {
  var root = document.getElementById('root');
  root.addEventListener('scroll', this.handleScroll);
  /* Codigo feo de jquery a reemplazar para que añada espacios al dropear images */
  $('#msg_input').on('drop', function (ev){
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
      </div>
      </React.Fragment>
)}

}

export default App;
