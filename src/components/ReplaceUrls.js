import React from 'react';
import reactStringReplace from 'react-string-replace';

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

export default ReplaceUrls;
