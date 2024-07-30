// var id=sessionStorage.getItem('userId');
var friendId;
const dateTime = new Date();
const socket = new WebSocket('wss://cozytalks.onrender.com?userId='+id);

socket.onopen = function(event) {
  console.log('Connected to server');
};


socket.onmessage = function(event) {
    let data = JSON.parse(event.data);
    console.log('Received message:', data);
    if(data.type == "connection"){
        getUsers();
        getNotifications();
        getFriends();
    }
    if(data.type == "userList"){
        addUsers(data.users)
    }
    if(data.type=="load_notifications"){
        addNotifications(data.data)
    }
    if(data.type=="load_friends"){
        addFriends(data.users)
    }
    if(data.type=="message"){
        add_message_to_chat(data)
    }
}

function getUsers(){
    socket.send(JSON.stringify({type:"userList","userId":id,search_query:""}));
}

function getFriends(){
    socket.send(JSON.stringify({type:"load_friends","userId":id}));
}

function getNotifications(){
    socket.send(JSON.stringify({type:"load_notifications","userId":id}));
}

function sendMessage(friendId, message){
    socket.send(JSON.stringify({type:"sendMessage","userId":id,"friendId":friendId,"message":message}));
}

function sendFriendRequest(friendId){
    alert(friendId);
    socket.send(JSON.stringify({type:"send_request","fromUserId":id,"toUserId":friendId}));
}

function processFriendRequest(requestId,senderId,ReceiverId,action){
    socket.send(JSON.stringify({type:"process_friend_request",request_id:requestId,"fromUserId":senderId,"toUserId":ReceiverId,action:action}));
}


function send_message(){
    console.log("Sending message from",id," to ",friendId)
    let message = document.getElementById('message_area');
    var mess = document.getElementById('message_area').value;
    if(mess.length>0){
    var data={
        type:'message',
        name:user.name,
        chat_message:mess,
        fromUserId:id,
        toUserId:friendId,
        // user_image:"{{Auth::user()->user_image}}",
        created_at: dateTime.toISOString(),
    }
    // Send the message to the server
    socket.send(JSON.stringify(data));
    message.innerHTML='';
}
else{
    console.log(mess)
}
}




function addUsers(users){
    let userList = document.getElementById('userList');
    userList.innerHTML = '';
    users.forEach(user => {
        userList.innerHTML+=`${user.name} <button class="btn btn-primary" onclick="sendFriendRequest('${user.id}')"><i class="fa fa-paper-plane" aria-hidden="true"></i></button><br>`
    });
}

function addNotifications(data){
    let notificationList = document.getElementById('requests');
    notificationList.innerHTML = '';
    data.forEach(user => {
        const listItem = document.createElement("li");
        listItem.className = "list-group-item d-flex justify-content-between align-items-center";
        const nameDiv = document.createElement("div");
        nameDiv.className = "d-flex align-items-center";
        const userName = document.createElement("span");
        userName.textContent = user.name;

        nameDiv.appendChild(userName);

        // Determine which buttons to add based on notification_type
        let tail='';
        if (user.notification_type === 'Receive Request') {
            tail += `<button class="btn btn-primary" onclick="processFriendRequest('${user.id}','${user.from_user_id}','${user.to_user_id}','approved')"><i class="fa fa-check"></i></button>`;
            tail += `<button class="btn btn-danger" onclick="processFriendRequest('${user.id}','${user.from_user_id}','${user.to_user_id}', 'rejected')"><i class="fa fa-times"></i></button>`;
        } else {
            tail = `<button class="btn btn-info">Request sent</button>`;
        }

        listItem.appendChild(nameDiv);
        listItem.innerHTML += tail+'<br>';

        notificationList.appendChild(listItem);
    });
}

function addFriends(users){
    let friendList = document.getElementById('connectedUsers');
    friendList.innerHTML = '';
    users.forEach(user => {
        friendList.innerHTML+=`<button class="user-btn" onclick="openChat('${user._id}','${user.name}')">${user.name}-${user.user_status}</button><br>`
    });
}

function openChat(userId,userName){
    friendId=userId;
    make_chat_area(userId,userName);
    load_old_messages(id,friendId);
}

function make_chat_area(user_id, to_user_name)
        {
            var html = `
            <ul id="msgs"></ul>
            <div id="chat_history"></div>
            <div class="input-group mb-3">
                <div id="send-container" class="d-flex align-items-center">

                <input id="message_area" style="width:200px;">

                    <button class="btn btn-primary" style="margin-left: 10px;" id="send-btn" onclick="send_message()">Send Message</button>
                </div>
            </div>
            `;

            document.getElementById('chat_area').innerHTML= html;

            document.getElementById('chat_header').innerHTML = 'Chat with <b>'+to_user_name+'</b>';

            document.getElementById('close_chat_area').innerHTML = '<button type="button" id="close_chat"  class="btn btn-danger btn-sm float-end " onclick="close_chat();"><i class="fas fa-times"></i></button>';

            friendId = user_id;
    }

        function close_chat()
        {
            document.getElementById('chat_header').innerHTML = 'Chat Area';

            document.getElementById('close_chat_area').innerHTML = '';

            document.getElementById('chat_area').innerHTML = '';

            friendId = '';
        }

        function add_message_to_chat(data){
            const msgsDiv = document.getElementById('msgs');
            if(innerdata.fromUserId==id){
            const element = `
                <li class='message-right'>
                    <p class="message">
                    ${data.chat_message}
                    <span>${data.name} ● ${moment(data.created_at).fromNow()}</span>
                    </p>
                </li>
                `;
            msgsDiv.innerHTML += `<div class='current-user-message flex flex-row-reverse'>&nbsp;&nbsp;&nbsp;${element}&nbsp;&nbsp; </div>`;
            }
            else{
                const element = `
        <li class='message-left'>
            <p class="message">
            ${data.chat_message}
            <span>${data.name} ● ${moment(data.created_at).fromNow()}</span>
            </p>
        </li>
        `;
        msgsDiv.innerHTML += `<div class='user-message flex flex-row'>&nbsp;&nbsp;&nbsp; ${element} </div>`;
            }
            scrollContainerToBottom();
        }

        function scrollContainerToBottom() {
            const msgsContainer = document.getElementById('msgs');
            msgsContainer.scrollTop = msgsContainer.scrollHeight;
        }

        function load_old_messages(from_user_id,to_user_id){
            var data={
                type : 'chat_history',
                fromUserId:from_user_id,
                toUserId:to_user_id,
            }
            socket.send(JSON.stringify(data));
        }
