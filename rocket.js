const timeNow = new Date();
const textTemplates = {
	"ru": {
		"name": "Пожалуйста, отправьте ваше имя",
		"message": "Пожалуйста, отправьте ваш вопрос, операторы скоро вам ответят",
		"greet": "Здравствуйте, как мы вам помочь",
		"file": "Файл отправлен"
	},
	"uz": {
		"name": "Iltimos ismingizni jo'nating",
		"message": "Iltimos, savolingizni yuboring, operatorlar sizga tez orada javob berishadi",
		"greet": "Assolomu alaykum. Sizga qanday yordam bera olamiz",
		"file": "File jo'natildi"
	}
};

if (window.localStorage.getItem("settings") !== null) {
	window.settings = JSON.parse(window.localStorage.getItem("settings"));
} else {
	window.settings = {
		"waitingName": false,
		"initializing": true,
		"uuid": undefined
	};
}

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
			this.socket.send(JSON.stringify(window.settings) + "#CONNECTION_INIT#" + this.uuid);
			this.locate();
			console.log("Connection established, ready for transmission.");
			this.connected = true;
		});

		this.socket.addEventListener("message", event => {
			if (event.data.includes("ACCEPT_HANDSHAKE")) {
				return;
			}
			if (!event.data.includes("SYSTEM_CALL"))
				this.template.injectMessage(event.data);
		});

		this.socket.addEventListener("close", event => {
			console.log("Connection dropped by server");
		})

		window.settings.uuid = this.uuid;
		window.localStorage.setItem("settings", JSON.stringify(window.settings));
	}

	locate() {
		if (window.location.pathname.includes("products")) {
			this.socket.send(this.uuid + "%^%" + document.querySelector(".yv-product-detail-title").innerText);
			this.socket.send(this.uuid + "%^%" + document.querySelector(".yv-product-zoom").href);
		}
	}

	send(message, file = false) {
		if (!message) return;
		if (this.socket.readyState === 1) {
			if (file) {
				this.socket.send(this.uuid + "&%&" + message);
				return true;
			}
			this.socket.send(this.uuid + "%^%" + message);
			return true;
		} else {
			console.log("Connection is not ready yet");
			return false;
		}
	}

	generate() {
		if (window.settings.uuid != undefined) return window.settings.uuid;
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
		this.status = document.querySelector("#chat #online-status");
		this.input = document.querySelector("#chat .chat-window-footer #message-field");
		this.input.addEventListener("keypress", event => {
			if (event.key == "Enter") {
				event.preventDefault();
				if (window.settings.waitingName) {
					window.settings.name = this.input.value;
					this.injectMessage(this.input.value, true);
					window.settings.waitingName = false;
					window.settings.initializing = false;
					this.injectMessage(textTemplates[window.settings.language].message);
					this.injectMessage(textTemplates[window.settings.language].greet);
					window.writeHistory({
						content: textTemplates[window.settings.language].greet,
						date: new Date().toLocaleTimeString("ru-RU", {hour: "2-digit", minute: "2-digit"}),
						user: false
					});
					window.initConnection();
					return;
				}
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

	injectMessage(message, user = false, time = undefined) {
		let container = document.createElement("div");
		container.classList.add("chat-window-message");
		let text = document.createElement("span");
		let date = document.createElement("small");
		text.innerText = message;
		date.innerText = (time) ? time : new Date().toLocaleTimeString("ru-RU", {hour: "2-digit", minute: "2-digit"});
		if (user) {
			text.classList.add("user-owner");
			this.input.value = new String();
		}
		text.appendChild(date);
		container.appendChild(text);
		this.frame.appendChild(container);
		this.frame.scrollTop = this.frame.scrollHeight;

		if (time == undefined)
			window.writeHistory({
				content: message,
				date: date.innerText,
				user: user
			});
	}

	injectImage(base) {
		let container = document.createElement("div");
		container.classList.add("chat-window-image");
		let image = document.createElement("img");
		let date = document.createElement("small");
		image.src = base;
		date.innerText = new Date().toLocaleTimeString("ru-RU", {hour: "2-digit", minute: "2-digit"});
		container.appendChild(image);
		container.appendChild(date);
		this.frame.appendChild(container);
		this.frame.scrollTop = this.frame.scrollHeight;
	}

	injectSuggestions(options) {
		window.suggestions = document.createElement("div");
		window.suggestions.classList.add("chat-window-frame-suggestions");
		let section = undefined;
		options.forEach(suggestion => {
			section = document.createElement("section");
			section.appendChild(document.createTextNode(suggestion.split("%&%")[0]));
			section.setAttribute("data-value", suggestion.split("%&%")[1]);
			section.addEventListener("click", event => {
				window.settings.language = event.target.getAttribute("data-value");
				this.injectMessage(event.target.innerText, true);
				this.injectMessage(textTemplates[window.settings.language].name);
				window.settings.waitingName = true;
				window.suggestions.remove();
			});
			window.suggestions.appendChild(section);
		});
		this.frame.appendChild(window.suggestions);
	}
}

let templateManager = new TemplateManager();

function sendChatBotUserMessage() {
	if (window.socketManager.send(templateManager.input.value)) templateManager.injectMessage(templateManager.input.value, true);
}

window.initConnection = function() {
	if (templateManager.socket === undefined) {
		window.socketManager = new WebSocketManager("wss://tutchat.ddns.net:8000/websocketio");
		window.socketManager.init();

		templateManager.socket = window.socketManager;
		window.socketManager.template = templateManager;
		templateManager.status.color = "#00FF00";
	}
}

window.restoreHistory = function() {
	let history = window.localStorage.getItem("chatHistory")
	if (history == null) {
		window.localStorage.setItem("chatHistory", JSON.stringify(new Array()));
	}
	return JSON.parse(window.localStorage.getItem("chatHistory"));
}
window.writeHistory = function(message) {
	let history = window.restoreHistory();
	history.push(message)
	window.localStorage.setItem("chatHistory", JSON.stringify(history));
}

function viewChatBotWindow() {
	if (timeNow.getHours() > 19) {
		alert("Все операторы ушли домой (. В данный момент нет доспуных операторов.\n\nBarcha operatorlar uylariga ketishdi (. Hozirda mavjud operatorlar yo'q.");
		return;
	}
	templateManager.panel.classList.add("fade");
	templateManager.window.classList.remove("fade");

	if (window.settings.initializing) {
		templateManager.injectMessage("Assolomu alaykum. iltimos tilni tanlang.\nЗдравствуйте, пожалуйста выберете язык.");
		templateManager.injectSuggestions(["O'zbekcha%&%uz", "Русский%&%ru"]);
	}
	if (templateManager.socket == undefined && window.settings.initializing == false) {
		window.restoreHistory().forEach(message => {
			templateManager.injectMessage(message.content, message.user, message.date);
		});
		window.initConnection();
	}
}

function hideChatBotWindow() {
	templateManager.panel.classList.remove("fade");
	templateManager.window.classList.add("fade");
}

function openFile() {
	document.getElementById("file-upload").click();
}

function sendFile() {
	let file = document.getElementById("file-upload").files[0];
	if (file.size > 5000000) {
		templateManager.injectMessage("5MB limit");
		return;
	}
	const reader = new FileReader();
	reader.onload = function(event) {
		if (window.socketManager.send(reader.result, true)) {
			templateManager.injectImage(reader.result);
			templateManager.injectMessage(textTemplates[window.settings.language].file, true);
		}
	};
	reader.readAsDataURL(file);
}

function rocket() {
	console.log("ROCKET");
	templateManager.body = document.querySelector("body");
	templateManager.injectHTML(`<div class="chat-panel" onclick="viewChatBotWindow()">
		<span>Открыть чат</span>
	</div>
	<div class="chat-window fade">
		<div class="chat-window-header">
			 <span><font id="online-status" color="grey">•</font>&ensp;Чат с оператором</span>
			 <button onclick="hideChatBotWindow()">&#10006;</button>
		</div>
		<div class="chat-window-frame">
			<div class="chat-window-frame-date"></div>
		</div>
		<div class="chat-window-footer">
			<button onclick="openFile()" class="send-file">
				<input type="file" id="file-upload" onchange="sendFile()" accept="image/png, image/jpeg">
				<img width="50" height="50" src="https://img.icons8.com/ios-filled/50/attach.png" alt="attach"/>
			</button>
			<input id="message-field" type="text" placeholder="Введите сообщение">
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
#chat .chat-window-frame-suggestions{
	margin-top: 2vh;
	display: flex;
	padding: 0 1.5vw;
	font-size: 2vh;
	justify-content: right;
}
#chat .chat-window-frame-suggestions section{
	padding: .5vh .5vw;
	border: 1px solid #329ea8;
	margin-left: .5vw;
	border-radius: 1vh;
	color: #329ea8;
	cursor: pointer;
}
#chat .chat-window-frame-suggestions section:hover{
	background: #329ea8;
	color: black;
}
#chat .chat-window-message{
	margin-top: 1vh;
	font-size: 1.8vh;
	padding: 1vh 1.5vw 0 1.5vw;
	display: flex;
	flex-direction: column;
}
#chat .chat-window-message span{
	display: flex;
	flex-direction: column;
	width: 60%;
	background: #303791;
	color: white;
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
	background: #DDD;
	color: black;
	border-bottom-left-radius: 3vh;
	border-bottom-right-radius: 0;
	margin-left: auto;
}
#chat .chat-window-image{
	margin-top: 1vh;
	font-size: 1.8vh;
	padding: 1vh 1.5vw 0 1.5vw;
	display: flex;
	flex-direction: column;
	margin-left: auto;
}
#chat .chat-window-image img{
	margin-left: auto;
	width: 60%;
	padding: 2vh;
	background: #DDD;
	border-radius: 3vh;
	border-bottom-right-radius: 0;
}
#chat .chat-window-image small{
	margin-top: .5vh;
	opacity: .7;
	text-align: right;
	font-size: 1.5vh;
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
	width: 15%;
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
#chat .chat-window-footer .send-file{
	width: 20%;
}
#chat .chat-window-footer .send-file img{
	height: 60%;
	width: 60%;
	object-fit: contain;
}
#chat .chat-window-footer .send-file input{
	display: none;
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