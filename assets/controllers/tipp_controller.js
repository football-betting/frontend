import { Controller } from 'stimulus';


export default class extends Controller {
    connect() {
        const scope = this;
        const formId = this.element.id;
        let inputs = document.getElementById(""+formId).elements;
        for (let index = 0; index < inputs.length; ++index) {
            // deal with inputs[index] element.
            inputs[index].onchange = function(formId){
                const removeElements = (elms) => elms.forEach(el => el.style.display="none");
                removeElements( document.querySelectorAll("div[class='submit-tip-icon']") );
                scope.checkSubmit(formId.target.form,formId);
            }
        }
    }
    checkSubmit(form,formId){
        const url = "/test";
        let submit = false;
        let obj = {
            matchId: form.id,
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

            fetch(url, {
                method: "POST",
                body: JSON.stringify(obj)
            }).then(res => {

                let done = document.getElementById("done-"+form.id);
                console.log(done);
                done.style.display = "block";
                console.log("Request complete! response:", res);

            });
        }
    }
}
