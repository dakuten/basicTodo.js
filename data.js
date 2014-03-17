/*jshint multistr: true */
var ScriptData = {
    helpDialogData: {
        title: "ToDoList.js — <a href=\"http://dakuten.fr\">Alexandre Astruc</a> 2014",
        message: ["Simply enter the name of a task you want to do then hit enter.<br/>",
                  "Click on the task to mark it as done.<br/>",
                  "Double click on its label to edit it.<br/>",
                  "Once a task is set as done, double click on its mark to delete it.<br/><br/>",
                  "Works well on touch screen mobile devices, but you need to include a Hammer library and un-comment two lines in 'ClientScript.js'<br/><br/>",
                  "TODO: Alarm, Clock, etc."].join("\n")
    },
    comDialogData: {
        title: "Commands",
        message: ["<dl class=\"commands\">",
                  "    <dt>help</dt>",
                  "    <dd>Provides help.</dd>",
                  "    <dt>commands</dt>",
                  "    <dd>Displays a list of commands availlable in the \"addtask\" field.</dd>",
                  "    <dt>save</dt>",
                  "    <dd>Forces saving. (Automatically saves tasks every two minutes.)</dd>",
                  "</dl>"].join("\n")
    }
};