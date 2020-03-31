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
    }
  componentDidMount(){
  }
  render(){
    return(
      <div id="favs">
        <a className="disney" href="#" onClick={this.showFavs}>
          FAVS
        </a>
        <div id="favOpen">{this.state.images!==null? this.state.images.map( (favImage) =>
          <p>
            <img src={favImage} width="120px" height="76px" />
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
    this.showFavs = () =>{
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
    }
  render(){
    return(
      <div id="ats">
        <a className="disney" href="#" onClick={this.showFavs}>
          @s
        </a>
        <div id="atsOpen">{this.state.ats!==null? this.state.ats.map( (at) =>
          <p>
            {at.from}: {at.message}
        </p>
      ) : 'nofavs '}</div>
    </div>
    )
  }
}
class App extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      username: null,
      color: colors[ Math.floor( Math.random() * colors.length )],
      uid: null,
      messages: [],
      images: [],
      historyLoaded: false,
    }

    this.socket = io('localhost:8080');

    this.socket.on('RECEIVE_MESSAGE', function(data, type){
        addMessage(data, type);
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
            console.log('todos son cargados')
            var i = 0;
            var intvl = setInterval(function() {
              i += 1;
              scrollCheck(this.state, 'history');
              if (i > 10) clearInterval(intvl);
            }, 100)
          }
        }
      })
    }

    this.sendMessage = (message) => {
      if(this.state.username === null){
        this.setState({username: message});
        $('#msg_input').removeAttr('placeholder');
      }
      else {
        this.socket.emit('SEND_MESSAGE', {
            username: this.state.username,
            color: this.state.color,
            message: message,
            timestamp: Date.now(),
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
        $('#msg_input').val('');
      }
    }

    const scrollCheck = (result, type) => {
      // Comprobar si el usuario se desplaza hasta la parte abajo de la página y desplazarse para revelar el siguiente mensaje si está
      var root = document.getElementById('root');
      var scrollBottom = root.scrollHeight - root.clientHeight;
      if ((root.clientHeight + root.scrollTop) >= root.scrollHeight - 100 || type === 'history' || result.username === this.state.username ) {
        root.scrollTop = scrollBottom;
      }
    }

    const addMessage = (data, type) => {
      let result = data;
      if (type == 'message') {
        this.setState(state => {
          const messages = [...state.messages,{
            username: result.username,
            message: result.message,
            color: result.color,
            timestamp: result.timestamp,
            faved_by: result.faved_by,
            _id: result._id
          } ]
          return {
            messages,
          }
        })
      }
      if (type == 'history') {
        if (this.state.historyLoaded === false) {
          result.map(msg => {
            this.setState(state => {
              const messages = [{
                username: msg.username,
                message: msg.message,
                color: msg.color,
                timestamp: msg.timestamp,
                faved_by: msg.faved_by,
                _id: msg._id
              },...state.messages ]
              return {
                messages,
              }
            })
          })
          this.setState({historyLoaded:true});
        }
      }
      scrollCheck(result, type);
    }
}

render (){
    return(
      <React.Fragment>
        {this.state.username? <Favs socket={this.socket} username={this.state.username} /> : null}
        {this.state.username? <Ats socket={this.socket} username={this.state.username} /> : null}
        <div className="content" id="messageBox">
            {this.state.messages.map( (msg, i) =>
                  <p key={msg._id} id={msg._id} className={msg.faved_by.indexOf(this.state.username) !== -1? 'faved' : 'unfaved'} onClick={() => this.favMessage(msg)}>
                    <font color={msg.color}>{msg.username}</font>
                : <ReplaceUrls onLoad={this.onLoad} counter={this.objCounter} message={msg.message} id={msg._id}/></p>
            )}
        </div>
      <div className="input-wrapper">
        <input id="msg_input" type="text" onKeyDown={this.handleKeyDown} placeholder="Enter your username..." autoComplete="off"/>
        <Button onClick={() => this.sendMessage(document.getElementById('msg_input').value)}/>
        <ImageUpload />
      </div>
      </React.Fragment>
)}

}

export default App;
