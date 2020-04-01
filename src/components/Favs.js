import React from 'react';
import $ from "jquery";
import colors from "./colors.js";

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

export default Favs;
