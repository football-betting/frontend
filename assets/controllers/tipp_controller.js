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
        const scope = this;
        const formId = this.element.id;
        let inputs = document.getElementById(""+formId).elements;
        for (let index = 0; index < inputs.length; ++index) {
            // deal with inputs[index] element.
            inputs[index].onchange = function(formId){
                scope.checkSubmit(formId.target.form,formId);
            }
        }

    }
    checkSubmit(form,formId){
        const url = "/test";
        let submit = false;
        console.log(formId.srcElement.form[0].value);
        let obj = {
            matchId: formId,
            tipTeam1: null,
            tipTeam2: null
        }
        if(formId.srcElement.form[0].value === "" || formId.srcElement.form[1].value === ""){

        }else{
            submit=true;
            obj.tipTeam1 = formId.srcElement.form[0].value;
            obj.tipTeam2 = formId.srcElement.form[1].value;
        }
        if(submit){
            console.log("send items");
            console.log(obj);
            fetch(url, {
                method: "POST",
                body: JSON.stringify(obj)
            }).then(res => {
                console.log("Request complete! response:", res);
            });

        }
    }
}
