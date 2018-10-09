_.MyModule.newComponent("treegrid").then(function(prototype) {
    console.log(_.MyModule._components.button);
	prototype.$("alert", function() {
		alert();
	});
});
