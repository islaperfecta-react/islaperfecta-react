import React from 'react';
import $ from "jquery";
const getUserMedia = require('getusermedia')
const Peer = require('simple-peer')
var toggleStream = false
var globStream

class VideoChat extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      myId: null,
      peersId: [],
      thisPeer: null,
      isStreaming: false,
      socket: props.socket
    }
    this.startStream = this.startStream.bind(this)
    this.scrollToBottom = this.scrollToBottom.bind(this)
    this.streamInit = this.streamInit.bind(this)
    this.connectToStream = this.connectToStream.bind(this)
    this.connectToStream_initd = this.connectToPeer_initd.bind(this)
    this.connectToPeer = this.connectToPeer.bind(this)
    this.connectToPeer_initd = this.connectToPeer_initd.bind(this)
    //this.state.socket.on('newStreamingPeer', (data, socketId) => this.cloneLaunchNewStream(data, socketId))
  }
  scrollToBottom = () => {
    let root = document.getElementById('root')
    let scrollBottom = root.scrollHeight - root.clientHeight
    root.scrollTop = scrollBottom
  }
  streamInit = (err, stream) => {
    this.setState({isStreaming: true})
    globStream = stream
    this.state.socket.emit('AnnounceStream')

    let littleCamera = document.getElementById('littleCamera')
    let newVideo = document.createElement('video')
    newVideo.setAttribute('autoplay', true)
    newVideo.setAttribute('playsinline', true)
    newVideo.setAttribute('muted', true)
    newVideo.muted = true
    littleCamera.appendChild(newVideo)
    try{
      newVideo.srcObject = stream
    } catch (error){
      newVideo.src = window.URL.createObjectURL(stream)
    }
    newVideo.play()
  }
  startStream = () => {
    let littleCamera = document.getElementById('littleCamera')
    if(!toggleStream){
      toggleStream = true
      this.scrollToBottom()
      getUserMedia({ video: true, audio: true}, (err, stream) => this.streamInit(err, stream))
    }
    else{
      littleCamera.innerHTML = '🎥'
      toggleStream = false
      this.state.socket.emit('closeStream')
      this.scrollToBottom()
    }
  }
  connectToStream = (data) => {
    console.log(data)
  if(data.private === true){
    let peer = new Peer({
      initiator: true,
      trickle: false,
      offerConstraints: {
        mandatory: {
          OfferToReceiveAudio: true,
          OfferToReceiveVideo: true
        }
      }
    })
    peer.on('signal', (dataRTC) => this.state.socket.emit('peerSignal_initd', {dataRTC: dataRTC, to: data.from }) )
    this.state.socket.on('handshakeToPeer', (dataHandshake) => peer.signal(dataHandshake.dataRTC) )
    let littleCamera = document.getElementById('littleCamera')
    let newVideo = document.createElement('video')
    newVideo.setAttribute('autoplay', true)
    newVideo.setAttribute('playsinline', true)
    newVideo.setAttribute('muted', true)
    newVideo.muted = true
    littleCamera.appendChild(newVideo)
    peer.on('stream', (stream) => {
      try{
        newVideo.srcObject = stream
      } catch (error){
        newVideo.src = window.URL.createObjectURL(stream)
      }
      newVideo.play()
    })
  }
  else{
    this.state.socket.emit('streamToMe', {to: data.to})
    this.state.socket.on('handshakeToPeer_initd', (data) => this.connectToStream_initd(data) )
  }
  }
  connectToStream_initd = (data) => {
    let peer = new Peer({
      initiator: false,
      trickle: false
    })
    peer.signal(data.dataRTC)
    peer.on('signal', (dataRTC) => this.state.socket.emit('handshakeToStream', {dataRTC: (dataRTC), to: data.from}) )
    this.state.socket.on('')
    let littleCamera = document.getElementById('littleCamera')
    let newVideo = document.createElement('video')
    newVideo.setAttribute('autoplay', true)
    newVideo.setAttribute('playsinline', true)
    newVideo.setAttribute('muted', true)
    newVideo.muted = true
    littleCamera.appendChild(newVideo)
    peer.on('stream', (stream) => {
      try{
        newVideo.srcObject = stream
      } catch (error){
        newVideo.src = window.URL.createObjectURL(stream)
      }
      newVideo.play()
    })
  }
  connectToPeer = (data) => {
  console.log('connectToPeer')
  console.log(data)
    if(this.state.isStreaming === true){
      let peer = new Peer({
        initiator: false,
        trickle: false,
        stream: globStream,
        answerConstraints: {
          OfferToReceiveAudio: false,
          OfferToReceiveVideo: false
        }
      })
      peer.signal(data.dataRTC)
      peer.on('signal', (dataRTC) => this.state.socket.emit('handshakeToPeer', {dataRTC: dataRTC, to: data.from}))
      //this.state.socket.on('handshakeToStream', (dataHandshake) => peer.signal(dataHandshake.dataRTC))
    }
  }
  connectToPeer_initd = (data) => {
    if(this.state.isStreaming === true){
      let peer = new Peer({
        initiator: true,
        trickle: false,
        stream: globStream
      })
      peer.on('signal', (dataRTC) => this.state.socket.emit('handshakeToPeer_initd', {dataRTC: dataRTC, to: data.from}) )

    }
  }
  componentDidMount(){
    this.state.socket.emit('newReceiver')
    this.state.socket.on('newReceiver', (socketId) => {if(this.state.isStreaming) this.state.socket.emit('AnnounceStream', {to: socketId}) })
    this.state.socket.on('peerSignal_initd', (data) => this.connectToPeer(data))
    this.state.socket.on('connectToMe', (data) => this.connectToStream(data))
  }
  render(){
    return(
      <label id='littleCamera' data-toggle='popover' onClick={this.startStream}>🎥</label>
    )
  }
}
export default VideoChat
