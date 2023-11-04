let _HEADERS_ = {"Content-Type": "application/json"};

let root = angular.module("root", ["ngRoute"]);

root.config(['$interpolateProvider', function($interpolateProvider) {
	$interpolateProvider.startSymbol('[[');
	$interpolateProvider.endSymbol(']]');
}]);

root.config($routeProvider => {
	$routeProvider.when('/', {
		templateUrl: "/view/chats"
	}).when("/login", {
		templateUrl: "/login"
	})
});

function onenterkey(event) {
	if (event.key == "Enter") {
		let scope = angular.element(document.querySelector("#window")).scope()
		scope.sendMessage();
	}
}