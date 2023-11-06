class WebSocketManager {
	constructor(route) {
		this.socket = new WebSocket(route);
		this.uuid = this.generate();
		this.template = undefined;
		this.connected = false;
		this.path = window.location.pathname;
	}

	init() {
		this.socket.addEventListener("open", event => {
			this.socket.send("CONNECTION_INIT#" + this.uuid);
			this.locate();
			console.log("Connection established, ready for transmission.");
			this.connected = true;
		});

		this.socket.addEventListener("message", event => {
			if (event.data.includes("ACCEPT_HANDSHAKE")) {
				this.template.injectMessage("Assolomu alaykum. Sizga qanday yordam bera olamiz");
				return;
			}
			if (!event.data.includes("SYSTEM_CALL"))
				this.template.injectMessage(event.data);
		});
	}

	locate() {
		if (this.pathname.includes("products") && window.location.pathname != this.pathname) {
			this.socket.send(document.querySelector(".yv-product-detail-title").innerText);
			this.socket.send(document.querySelector(".yv-product-zoom").href);
		}
	}

	send(message) {
		if (this.socket.readyState === 1) {
			this.socket.send(this.uuid + "%^%" + message);
			return true;
		} else {
			console.log("Connection is not ready yet");
			return false;
		}
	}

	generate() {
		return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
			(c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
		);
	}
}

class TemplateManager{
	body = undefined;
	socket = undefined;

	injectHTML(template) {
		let chatContainer = document.createElement("div");
		chatContainer.id = "chat";
		chatContainer.innerHTML = template;
		this.body.appendChild(chatContainer);
		this.panel = document.querySelector("#chat .chat-panel");
		this.window = document.querySelector("#chat .chat-window");
		this.frame = document.querySelector("#chat .chat-window-frame");
		this.date = document.querySelector("#chat .chat-window-frame-date");
		this.input = document.querySelector("#chat .chat-window-footer input");
		this.input.addEventListener("keypress", event => {
			if (event.key == "Enter") {
				event.preventDefault();
				if (this.socket.send(this.input.value)) this.injectMessage(this.input.value, true);
			}
		});
		this.date.innerHTML = "<span>" + new Date().toLocaleString("ru-RU", {year: "numeric", month: "numeric", day: "numeric"}) + "</span>"
	}

	injectCSS(rule) {
		let styletag = document.createElement("style");
		styletag.type = "text/css";
		styletag.appendChild(document.createTextNode(rule));
		document.querySelector("head").appendChild(styletag);
	}

	injectMessage(message, user = false) {
		let container = document.createElement("div");
		container.classList.add("chat-window-message");
		let text = document.createElement("span");
		let date = document.createElement("small");
		text.innerText = message;
		date.innerText = new Date().toLocaleString("ru-RU", {year: "numeric", month: "numeric", day: "numeric"});
		if (user) {
			text.classList.add("user-owner");
			this.input.value = new String();
		}
		text.appendChild(date);
		container.appendChild(text);
		this.frame.appendChild(container);
		this.frame.scrollTop = this.frame.scrollHeight;
	}
}

let templateManager = new TemplateManager();

function sendChatBotUserMessage() {
	if (window.socketManager.send(templateManager.input.value)) templateManager.injectMessage(templateManager.input.value, true);
}

function viewChatBotWindow() {
	templateManager.panel.classList.add("fade");
	templateManager.window.classList.remove("fade");

	if (templateManager.socket === undefined) {
		window.socketManager = new WebSocketManager("wss://tutchat.ddns.net:8000/websocketio");
		window.socketManager.init();

		templateManager.socket = window.socketManager;
		window.socketManager.template = templateManager;
	}
}

function hideChatBotWindow() {
	templateManager.panel.classList.remove("fade");
	templateManager.window.classList.add("fade");
}

function rocket() {
	console.log("ROCKET");
	templateManager.body = document.querySelector("body");
	templateManager.injectHTML(`<div class="chat-panel" onclick="viewChatBotWindow()">
	<span>Открыть чат</span>
</div>
<div class="chat-window fade">
	<div class="chat-window-header">
		 <span>Оператор</span>
		 <button onclick="hideChatBotWindow()">&#10006;</button>
	</div>
	<div class="chat-window-frame">
		<div class="chat-window-frame-date"></div>
	</div>
	<div class="chat-window-footer">
		<input type="text" placeholder="Введите сообщение">
		<button onclick="sendChatBotUserMessage()">
			<img width="64" height="64" src="https://img.icons8.com/sf-black-filled/64/paper-plane.png" alt="paper-plane"/>
		</button>
	</div>
</div>`);
	templateManager.injectCSS(`body{
	padding: 0;
	margin: 0;
}
#chat .chat-panel{
	position: fixed;
	display: flex;
	justify-content: center;
	align-items: center;
	bottom: 0;
	right: 2vw;
	width: 20vw;
	background: #303791;
	padding: 1vh 0;
	border-top-left-radius: 2vh;
	border-top-right-radius: 2vh;
	cursor: pointer;
	transition: .3s;
	visibility: visible;
	opacity: 1;
	z-index: 99999;
}
#chat .chat-panel span{
	font-family: inherit;
	color: white;
}
#chat .chat-window{
	position: fixed;
	display: flex;
	bottom: 2vh;
	right: 2vw;
	width: 20vw;
	height: 60vh;
	border-radius: 2vh;
	flex-direction: column;
	overflow: hidden;
	visibility: visible;
	opacity: 1;
	transition: .3s;
	box-shadow: 0px 1px 1px rgba(3, 7, 18, 0.02),
	  0px 5px 4px rgba(3, 7, 18, 0.03),
	  0px 12px 9px rgba(3, 7, 18, 0.05),
	  0px 20px 15px rgba(3, 7, 18, 0.06),
	  0px 32px 24px rgba(3, 7, 18, 0.08);
	z-index: 99999;
}
#chat .chat-window-header{
	width: 100%;
	height: 10vh;
	background: #303791;
	display: flex;
	align-items: center;
	padding: 0 1vw;
	color: white !important;
	font-weight: bold;
}
#chat .chat-window-header span{
	color: white !important;
}
#chat .chat-window-header button{
	margin-left: auto;
	background: none;
	border: none;
	cursor: pointer;
	color: white;
	font-size: 2.6vh;
}
#chat .chat-window-frame{
	width: 100%;
	height: 100%;
	background: white;
	display: flex;
	flex-direction: column;
	overflow-y: scroll;
	padding: 2vh 0;
}
#chat .chat-window-frame-date{
	padding: 1vh;
	display: flex;
	justify-content: center;
	align-items: center;
}
#chat .chat-window-frame-date span{
	opacity: .6;
	font-size: 2vh;
}
#chat .chat-window-message{
	font-size: 2vh;
	padding: 1vh 1.5vw 0 1.5vw;
	display: flex;
	flex-direction: column;
}
#chat .chat-window-message span{
	display: flex;
	flex-direction: column;
	width: 60%;
	background: #DDD;
	padding: 2vh;
	border-radius: 3vh;
	border-bottom-left-radius: 0;
}
#chat .chat-window-message small{
	margin-top: .5vh;
	opacity: .7;
	text-align: right;
	font-size: 1.5vh;
}
#chat .chat-window-message .user-owner{
	background: #c4ff91;
	border-bottom-left-radius: 3vh;
	border-bottom-right-radius: 0;
	margin-left: auto;
}
#chat .chat-window-footer{
	width: 100%;
	height: 10vh;
	background: blue;
	display: flex;
	border-top: 2px solid lightgrey;
}
#chat .chat-window-footer input{
	width: 100%;
	height: 100%;
	border-radius: 0;
	border: none;
	padding: 0 1vw;
}
#chat .chat-window-footer button{
	width: 8%;
	height: 100%;
	border: none;
	background: white;
	cursor: pointer;
}
#chat .chat-window-footer button img{
	height: 4vh;
	width: 100%;
	object-fit: cover;
}
#chat .chat-window-footer input:focus{
	outline: none;
}
#chat .fade{
	visibility: hidden !important;
	opacity: 0 !important;
}
@media only screen and (max-width: 480px) {
	#chat .chat-panel{
		width: 50vw;
	}
	#chat .chat-window{
		width: 70vw;
	}
	#chat .chat-window-header{
		padding: 0 3vw;
	}
	#chat .chat-window-footer input{
		padding: 0 3vw;
	}
}`);
}

window.onbeforeunload = event => {
	if (window.socketManager)
		if (window.socketManager.socket.readyState === 1) {
			window.socketManager.socket.close();
			window.socketManager.connected = false;
		}
}

rocket()
// FIRE IN HALL