root.controller("master", ($scope, $location) => {});
root.controller("chats", ($scope, $rootScope, $location, $http) => {
	$scope.panel = document.querySelector("#window .chat-panel");
	$scope.container = undefined;
	$scope.query = new String();

	$scope.selectChat = function(chat) {
		$scope.currentChat = chat;
		$http.get("/messages", {params: {chat_id: chat.id}}).then(messages => {
			$scope.messages = messages.data;
			$scope.panel.scrollTop = $scope.panel.scrollHeight;
		}, exception => {
			$scope.exception = true;
			console.log(exception);
		});
	}

	$scope.sendMessage = () => {
		if (!$scope.sms) return;
		$http.post(
			"/message/new",
			{
				content: $scope.sms,
				socket: $scope.currentChat.socket,
				chat_id: $scope.currentChat.id
			}
		).then(response => {
			$scope.messages.push({
				content: $scope.sms,
				socket: $scope.currentChat.socket,
				chat_id: $scope.currentChat.id,
				read: true,
				operator: true
			});
			$scope.sms = undefined;
			$scope.panel.scrollTop = $scope.panel.scrollHeight;
		}, exception => {
			console.error(exception);
		});
	}

	$scope.search = function() {
		$scope.container = $scope.chats.filter(chat => chat.user.includes($scope.query));
	}

	$scope.downloadFile = function(streamData) {
		let image = new Image();
		image.src = streamData;
		let tab = window.open("");
		tab.document.write(image.outerHTML);
	}

	$scope.interval = setInterval(function() {
		$http.get("/chats").then(chats => {
			$scope.chats = chats.data;
			$scope.container = $scope.chats.filter(chat => chat.user.includes($scope.query));
		}, exception => {
			clearInterval($scope.interval);
		});

		if ($scope.currentChat != undefined) {
			$http.get("/messages", {params: {chat_id: $scope.currentChat.id}}).then(messages => {
				$scope.messages = messages.data;
				$scope.panel.scrollTop = $scope.panel.scrollHeight;
			}, exception => {
				clearInterval($scope.interval);
			});
		}
	}, 2000);

	$http.get("/chats").then(chats => {
		$scope.chats = chats.data;
		$scope.container = angular.copy($scope.chats);
	}, exception => {
		console.log(exception);
	});
});