just.newModule("MyModule", { 
    main: {
        repeater: [], 
        treegrid: []
    }
}, function(self, components) {
    console.log(self);
    this._files = "files";
});

console.log(just);

// let repeater = just.MyModule.newComponent("repeater");