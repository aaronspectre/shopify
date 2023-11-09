root.controller("master", ($scope, $location) => {});
root.controller("auth", ($scope, $rootScope, $location, $http) => {
	$scope.operator = JSON.parse(window.localStorage.getItem("operator"));

	if ($scope.operator != null) {
		if ($scope.operator.username == "administrator") {
			$location.url("/cog");
			return;
		}
		$location.url("/chats");
	}

	$scope.authorize = function() {
		if ($scope.username && $scope.password) {
			$http.post(
				"/authorize",
				{
					username: $scope.username,
					password: $scope.password
				}
			).then(operator => {
				window.localStorage.setItem("operator", JSON.stringify(operator.data));
				if (operator.data.username == "administrator") {
					$location.url("/cog");
					return;
				}
				$location.url("/chats");
			}, exception => {
				$scope.error = "* Логин или пароль не верны";
			});
		} else {
			$scope.error = "* Все поля должны быть заполнены";
		}
	};
});
root.controller("chats", ($scope, $rootScope, $location, $http) => {
	if (JSON.parse(window.localStorage.getItem("operator")) == null) {
		$location.url('/');
	}
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
root.controller("cog", ($scope, $rootScope, $location, $http) => {
	$scope.operator = JSON.parse(window.localStorage.getItem("operator"));

	$scope.cutMessage = function(message) {
		if (message.length > 45) {
			return message.slice(0, 45) + " ...";
		} else {
			return message;
		}
	}

	$scope.deleteEntry = function(id, entry) {
		if (entry == "operator") {
			$http.delete("/operator/delete/", {params: {operator_id: id}}).then(response => {
				$scope.operators = $scope.operators.filter(operator => operator.id != id);
			}, exception => {
				$scope.error = exception.data.detail;
				console.log(exception);
			});
		} else if (entry == "chat") {
			$http.delete("/chats/delete/", {params: {chat_id: id}}).then(response => {
				$scope.chats = $scope.chats.filter(chat => chat.id != id);
			}, exception => {
				$scope.error = exception.data.detail;
				console.log(exception);
			});
		}
	}

	$scope.hire = () => $location.url("/cog/hire");

	$scope.newOperator = function() {
		if ($scope.name && $scope.username && $scope.password) {
			$http.post(
				"/operator/new",
				{
					"name": $scope.name,
					"username": $scope.username,
					"password": $scope.password
				}
			).then(response => {
				alert("Done");
				$location.url("/cog");
			}, exception => {
				alert(exception.data.detail);
			});
		}
	}

	$http.get("/operator/all").then(operators => {
		$scope.operators = operators.data;
	}, exception => {
		console.log("operators fail");
	});

	$http.get("/chats/all").then(chats => {
		$scope.chats = chats.data;
	}, exception => {
		console.log("chats fail");
	});

	$http.get("/messages/all").then(messages => {
		$scope.messages = messages.data;
	}, exception => {
		console.log("messages fail");
	});
});