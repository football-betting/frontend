import { Controller } from 'stimulus';

/*
 * This is an example Stimulus controller!
 *
 * Any element with a data-controller="hello" attribute will cause
 * this controller to be executed. The name "hello" comes from the filename:
 * hello_controller.js -> "hello"
 *
 * Delete this file or adapt it for your use!
 */
export default class extends Controller {
    connect() {
        let box = this;
        let info = window.localStorage.getItem('infobox');
        if(info==="hide"){
            box.context.parentElement.style.display = "none";
        }

        this.element.onclick = function(ev){
            ev.target.parentElement.style.display = "none";
            window.localStorage.setItem('infobox', "hide");
        };
    }
}
