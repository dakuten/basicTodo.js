(function () {
    
    document.getElementById("addtask").focus();
    var marks = {v: "✓", x: "✗"};

    // Cookie Loading

    var Cookie = {
        create: function (name,value,days) {
                var expires, date;
                if (days) {
                    date = new Date();
                    date.setTime(date.getTime()+(days*24*60*60*1000));
                    expires = "; expires="+date.toGMTString();
                }
                else expires = "";
                document.cookie = name+"="+value+expires+"; path=/";
            },
        read: function (name) {
                var nameEQ = name + "=";
                var ca = document.cookie.split(';');
                for(var i=0;i < ca.length;i++) {
                    var c = ca[i];
                    while (c.charAt(0)==' ') c = c.substring(1,c.length);
                    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length,c.length);
                }
                return null;
            },
        erase: function (name) {createCookie(name,"",-1);}
    };

    //Cookie.create("TL0", "1Hej, newtask");

    var UserSession = {
        TLTitle: Cookie.read("TLTitle") || "To-do List",
        TLTitleHelper: parseInt(Cookie.read("TLTitleHelper")) || 0,
        TLnumTasks: parseInt(Cookie.read("TLnumTasks")) || 0,
        CookieTasksList: [],
    };
    
    // Modal window
    
    var ModalWindow = {
        new: function (title, message, buttons) {
            // Buttons must be specified in order with an 
            // array of ModalWindow.buttons.x elements.

            this.elem = document.createElement("div");
            this.elem.className = "modalWindow";
            this.elem.innerHTML = "<h1>" + title + "</h1>\n" + "<p>" + message + "</p>";
            
            var butts = document.createElement("div");
            butts.className = "buttons";
            this.buttons = [];
            var preventTab = function (e) {if (e.keyCode === 9) {e.preventDefault(); e.stopPropagation(); } };
            for (var i=0; i < buttons.length; ++i) {
                this.buttons.push([buttons[i], document.createElement("input")]);
                this.buttons[i][1].type = "button";
                this.buttons[i][1].value = ModalWindow.buttonsLabel[buttons[i]];
                this.buttons[i][1].addEventListener("keypress", preventTab);
                butts.appendChild(this.buttons[i][1]);
            }
            
            this.elem.appendChild(butts);
        },
        buttons : {
            ok: 0,
            close: 1,
            discard: 2,
            save: 3,
        },
        buttonsLabel : ["OK", "Close", "Discard", "Save"],
    };
 
    ModalWindow.new.prototype.autoAttach = function () {
        // Tries to automatically attach buttons' events to actions.

        var parObj = this;
        for (var i=0; i < this.buttons.length; ++i) {
            switch (this.buttons[i][0]) {
                    case ModalWindow.buttons.ok:
                        this.buttons[i][1].addEventListener("click", function () {
                            parObj.elem.dispatchEvent(new Event("okpressed"));
                            parObj.close();
                        });
                        break;
                    case ModalWindow.buttons.close:
                        this.buttons[i][1].addEventListener("click", function () {
                            parObj.elem.dispatchEvent(new Event("closepressed"));
                            parObj.close();
                        });
                        break;
                    case ModalWindow.buttons.discard:
                        this.buttons[i][1].addEventListener("click", function () {
                            parObj.elem.dispatchEvent(new Event("discardpressed"));
                            parObj.close();
                        });
                        break;
                    case ModalWindow.buttons.save:
                        this.buttons[i][1].addEventListener("click", function () {
                            parObj.elem.dispatchEvent(new Event("savepressed"));
                            parObj.close();
                        });
                        break;
                    default:
                        this.buttons[i][1].addEventListener("click", function () {
                            var evt = new Event("unknownpressed")
                            evt.data = this.buttons[i];
                            parObj.elem.dispatchEvent(evt);
                        });
                        break;
            }
        }
    };
    ModalWindow.new.prototype.show = function () {
        var veil = document.getElementById("veil");
        veil.style.width = veil.style.height = "100%";
        veil.style.opacity = 0.5;
        document.getElementById("listapp").insertBefore(this.elem, veil.nextElementSibling);
        this.buttons[0][1].focus();
    };
    ModalWindow.new.prototype.close = function () {
        var veil = document.getElementById("veil");
        veil.style.width = veil.style.height = "0";
        veil.style.opacity = 0;
        this.elem.parentNode.removeChild(this.elem);
        document.getElementById("addtask").focus();
    };
    
    // Title editing (yet server side to be done);

    if (!UserSession.TLTitleHelper) {
        document.getElementById("tasklist").innerHTML = '<div class="unchecked" id="titlehelper"><div class="checkmark">'+marks.x+'</div><p class="label">Change this list\'s title by clicking on it.</p></div>';
    }

    var title = {
        h1: document.getElementById("title"),
        input: document.createElement("input")
    };
    title.h1.innerText = document.title = UserSession.TLTitle;
    title.input.type = "text";
    title.input.name = "titlein";
    
    title.h1.addEventListener("click", function (e) {
        if (this.firstChild !== title.input) {
            title.input.value = this.innerText;
            this.replaceChild(title.input, this.firstChild);
            title.input.focus();
        }
    });
    
    title.input.addEventListener("blur", function (e) {
        if (this.value !== "") {
            UserSession.TLTitle = this.value;
            title.h1.replaceChild(document.createTextNode(this.value), title.h1.firstChild);
            document.title = this.value;
        }
        
    });
    title.input.addEventListener("keypress", function (e) {(e.keyCode === 13) ? this.blur() : 0; });
    
    // Setting done/undone tasks
    
    /*var tasks = document.querySelectorAll("#list p");
    for (var i=0; i<tasks.length; ++i) {
        tasks[i].addEventListener("click", function(e){
            this.className = {unchecked:"checked",checked:"unchecked"}[this.className];
        });
    }*/
    
    // Adding tasks
    
    function Task(element) {
        // Uses label as the existing element, if exists is true and not undefined, 
        // otherwise, as a text label.
            this.elem = element;
    }

    Task.checked   = marks.v;
    Task.unchecked = marks.x;

    Task.newElement = function (label, checked, cookieID) {
        checked = (checked) ? 1 : 0;
        newObj = new Task(document.createElement("div"));
        newObj.data = {text: label, state: checked};
        newObj.edit = document.createElement("input");
        newObj.edit.type = "text";
        newObj.elem.className = (checked) ? "checked": "unchecked";
        newObj.checkmark = newObj.elem.appendChild((function () {
            var chk = document.createElement("div");
            chk.className = "checkmark";
            chk.innerText = (checked) ? Task.checked: Task.unchecked;
            return chk;
        })());
        newObj.label = newObj.elem.appendChild((function () {
            var lbl = document.createElement("p");
            lbl.className = "label";
            lbl.innerText = label;
            return lbl;
        })());
        
        var sup = newObj;
        
        newObj.elem.addEventListener("click", function (e) {sup.swcheck(); });

        var chLabel = function(elem, evt) {
            if (elem.firstChild !== sup.edit) {
                sup.edit.value = elem.innerText;
                elem.replaceChild(sup.edit, elem.firstChild);
                sup.edit.focus();
                evt.stopPropagation();
            }
        };
        newObj.label.addEventListener("dblclick", function (e) {chLabel(this, e); });
        //Hammer(newObj.label).on("hold", function (e) {chLabel(newObj.label, e); });
        
        newObj.edit.addEventListener("blur", function (e) {
            if (this.value !== "") {
                sup.data.text = this.value;
                sup.label.replaceChild(document.createTextNode(this.value), this);
            }
        });
        newObj.edit.addEventListener("click", function (e) {e.stopPropagation();});
        newObj.edit.addEventListener("keypress", function(e) {(e.keyCode === 13) ? this.blur() : 0; });
        
        var vanishTask = function(elem, evt) {(sup.data.state) ? sup.vanish(): 0;};
        newObj.checkmark.addEventListener("dblclick", function (e) {vanishTask(this, e); });
        //Hammer(newObj.checkmark).on("hold", function (e) {vanishTask(newObj.checkmark, e); });

        return newObj;
    };
    
    Task.prototype.swcheck = function (elem) {
        this.data.state = [1, 0][this.data.state];
        elem = (this.elem || elem);
        elem.className = ["unchecked", "checked"][this.data.state];
        elem.firstElementChild.innerText = [Task.unchecked, Task.checked][this.data.state];
    };
        
    Task.prototype.vanish = function (elem) {
        elem = (this.elem || elem);
        //if (elem.style.opacity=="") {elem.style.opacity = 1;}
        elem.addEventListener("transitionend", function () {
            document.getElementById("tasklist").removeChild(elem);
        });
        elem.style.opacity = 0;
        if (~UserSession.CookieTasksList.indexOf(this)) {
            UserSession.CookieTasksList.splice(UserSession.CookieTasksList.indexOf(this), 1);
            --UserSession.TLnumTasks;
        }
    };

    Task.prototype.deploy = function() {
        document.getElementById("tasklist").appendChild(this.elem);
    };

    Task.prototype.addToList = function() {
        UserSession.CookieTasksList.push(this);
        ++UserSession.TLnumTasks;
        this.deploy();
    };

    // Loading previous Tasks

    for (var i=0; i<UserSession.TLnumTasks; ++i) {
        var TaskCookie = Cookie.read("TL"+i);
        var T = Task.newElement(TaskCookie.substring(1, TaskCookie.length), parseInt(TaskCookie.substring(0,1)));
        UserSession.CookieTasksList.push(T);
        T.deploy();
    }


    // Setting User-driven task adding.

    var save = function() {
        Cookie.create("TLTitle", UserSession.TLTitle, 999);
        Cookie.create("TLnumTasks", UserSession.TLnumTasks, 999);
        for (var i=0; i<UserSession.TLnumTasks; ++i) {
            Cookie.create("TL"+i, ""+ UserSession.CookieTasksList[i].data.state +
                                      UserSession.CookieTasksList[i].data.text,
                         999);
        }
    };
    
    var addTask = document.getElementById("addtask");
    addTask.addEventListener("keypress", function (e) {
        if (e.keyCode === 13 && this.value !== "") {
            switch (this.value) {
                case "help":
                    var helpDialog = new ModalWindow.new(
                        ScriptData.helpDialogData.title,
                        ScriptData.helpDialogData.message,
                        [ModalWindow.buttons.ok]);
                    helpDialog.autoAttach();
                    helpDialog.show();
                    break;
                case "commands":
                    var comDialog = new ModalWindow.new(
                        ScriptData.comDialogData.title,
                        ScriptData.comDialogData.message,
                        [ModalWindow.buttons.close]);
                    comDialog.autoAttach();
                    comDialog.show();
                    break;
                case "save":
                    save();
                    break;
                default:
                    (Task.newElement(this.value)).addToList();
                    break;
            }
            this.value = "";
        }
    });
    
    if (!UserSession.TLTitleHelper) {
    title.input.addEventListener("blur", function () {
        var titlehelper = new Task(document.getElementById("titlehelper"));
        titlehelper.data = {state: 0, label:""};

        if (titlehelper.elem && titlehelper.elem.className === "unchecked") {
            titlehelper.swcheck();
            titlehelper.vanish();
            Cookie.create("TLTitleHelper", "1", 999);
        }
    });}

    var PeriodicSave = function(minutes) {
        save();
        setTimeout(PeriodicSave, minutes*60*1000);
    };

    PeriodicSave(2);
})();