_.MyModule.newComponent("button").then(function(prototype) {
	prototype.$("alert", function() {
		alert();
	});
});
