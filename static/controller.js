root.controller("master", ($scope, $location) => {});
root.controller("chats", ($scope, $rootScope, $location, $http) => {
	$scope.selectChat = function(chat) {
		$scope.currentChat = chat;
		$http.get("/messages", {params: {chat_id: chat.id}}).then(messages => {
			$scope.messages = messages.data;
		}, exception => {
			$scope.exception = true;
			console.log(exception);
		});
	}

	$scope.sendMessage = () => {
		$http.post(
			"/message/new",
			{
				content: $scope.message,
				socket: $scope.currentChat.socket,
				chat_id: $scope.currentChat.id
			}
		).then(response => {
			$scope.messages.push({
				content: $scope.message,
				socket: $scope.currentChat.socket,
				chat_id: $scope.currentChat.id,
				read: true,
				operator: true
			});
			$scope.message = new String();
		}, exception => {
			console.error(exception);
		});
	}

	$scope.interval = setInterval(function() {
		$http.get("/chats").then(chats => {
			$scope.chats = chats.data;
		}, exception => {
			clearInterval($scope.interval);
		});

		if ($scope.currentChat != undefined) {
			$http.get("/messages", {params: {chat_id: $scope.currentChat.id}}).then(messages => {
				$scope.messages = messages.data;
			}, exception => {
				clearInterval($scope.interval);
			});
		}
	}, 2000);

	$http.get("/chats").then(chats => {
		$scope.chats = chats.data;
	}, exception => {
		console.log(exception);
	});
});