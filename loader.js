just.newModule("MyModule", { 
    main: {
        repeater: [], 
        treegrid: []
    }
}, function(self, components) {
    console.log(self);
    this._files = "files";
});


// let repeater = just.MyModule.newComponent("repeater");