let _HEADERS_ = {"Content-Type": "application/json"};

let root = angular.module("root", ["ngRoute"]);

root.config(['$interpolateProvider', function($interpolateProvider) {
	$interpolateProvider.startSymbol('[[');
	$interpolateProvider.endSymbol(']]');
}]);

root.config($routeProvider => {
	$routeProvider.when('/', {
		templateUrl: "/view/login"
	}).when("/chats", {
		templateUrl: "/view/chats"
	}).when("/cog", {
		templateUrl: "/view/cog"
	}).when("/cog/hire", {
		templateUrl: "/view/cog/hire"
	})
});

function onenterkey(event) {
	if (event.key == "Enter") {
		let scope = angular.element(document.querySelector("#window")).scope()
		scope.sendMessage();
	}
}