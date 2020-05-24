const socket = io();

//elements
const $messageForm = document.querySelector("#message-form");
const $messageFormInput = $messageForm.querySelector("input");
const $messageFormButton = $messageForm.querySelector("button");
const $sendLocationButton = document.querySelector("#send-location");
const $messages = document.querySelector("#messages");
const $sidebar = document.querySelector("#sidebar");

//templates
const messageTemplate = document.querySelector("#message-template").innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;
const locationMessageTemplate = document.querySelector(
  "#location-message-template"
).innerHTML;
//
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

const _id = Date.now() + username.replace(/\s/g, "") + Math.random();
console.log(_id);

socket.on("message", (message_info) => {
  //{message,create_at}

  console.log(message_info);
  const { message, created_at, username: _username } = message_info;
  const isMyMessage = username === _username;

  const html = Mustache.render(messageTemplate, {
    message, //string
    created_at: moment(created_at).format("hh:mm A"),
    username: _username,
    right: isMyMessage ? "right" : "",
  });

  $messages.innerHTML = $messages.innerHTML + html;
  // $messages.insertAdjacentElement("beforeend", html);
  autoscroll();
});

socket.on("locationMessage", (locationMessage) => {
  //{url,created_at}
  console.log(locationMessage);
  const { url, created_at, username: _username} = locationMessage;
  const isMyMessage = username === _username;
  
  const html = Mustache.render(locationMessageTemplate, {
    url,
    created_at: moment(created_at).format("hh:mm A"),
    username: _username,
    right: isMyMessage ? "right" : "",
  });
  $messages.innerHTML = $messages.innerHTML + html;
  autoscroll();
});

// client (emit) => server (receive/on) ==acknowledgement=> client
// server (emit) => client (receive/on) ==acknowledgement=> server

$messageForm.addEventListener("submit", (event) => {
  event.preventDefault();
  //disable

  $messageFormButton.setAttribute("disabled", "disabled");

  const message = event.target.elements.message.value;
  if (message.trim() === "") {
    $messageFormButton.removeAttribute("disabled");
    return;
  }
  socket.emit("sendMessage", { message, _id }, (error) => {
    //enable
    $messageFormButton.removeAttribute("disabled");
    $messageFormInput.value = "";
    $messageFormInput.focus();

    if (error) {
      return console.log(error);
    }
    console.log("Message was delivered!");
  });
});

$sendLocationButton.addEventListener("click", () => {
  if (!navigator.geolocation) {
    return alert("Geolocation is not supported by your browser");
  }

  $sendLocationButton.setAttribute("disabled", "disabled");
  navigator.geolocation.getCurrentPosition((position) => {
    socket.emit(
      "sendLocation",
      {
        lat: position.coords.latitude,
        long: position.coords.longitude,
      },
      () => {
        $sendLocationButton.removeAttribute("disabled");

        console.log("Location Shared!");
      }
    );
  });
});

//
socket.emit("joinRoom", {
  _id,
  username,
  room,
});
socket.on("roomData", ({ room, users }) => {
  console.log(room, users);

  const html = Mustache.render(sidebarTemplate, {
    room,
    users,
  });

  $sidebar.innerHTML = html;
});

const autoscroll = () => {
  // New message element
  const $newMessage = $messages.lastElementChild;

  // Height of the new message
  const newMessageStyles = getComputedStyle($newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

  // Visible height
  const visibleHeight = $messages.offsetHeight;

  // Height of messages container
  const containerHeight = $messages.scrollHeight;

  // How far have I scrolled?
  const scrollOffset = $messages.scrollTop + visibleHeight;

  if (containerHeight - newMessageHeight <= scrollOffset) {
    $messages.scrollTop = $messages.scrollHeight;
  }
};
