import React from 'react';
import $ from "jquery";

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

export default ImageUpload;
