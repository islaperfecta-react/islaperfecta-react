import React from 'react';
import $ from "jquery";
import reactStringReplace from 'react-string-replace';

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

export default Ats;
