import React from 'react';

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

export default UserList;
