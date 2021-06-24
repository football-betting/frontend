import { Controller } from 'stimulus';



export default class extends Controller {
    connect() {
        const scope = this.element;
        const url = 'https://api.giphy.com/v1/gifs/random?api_key=RHb2vdaLUSQmLzHxuJlDIANyKgPC1oq4&tag=soccer&rating=g';
        fetch(url)
            .then(
                function(response) {
                    if (response.status !== 200) {
                        console.log('Looks like there was a problem. Status Code: ' +
                            response.status);
                        return;
                    }

                    // Examine the text in the response
                    response.json().then(function(data) {
                        console.log(data);
                        console.log(data.data.image_original_url);
                        const img = document.createElement("img");
                        img.src = data.data.image_original_url;
                        img.classList.add("img-fluid");
                        img.classList.add("mx-auto");
                        img.classList.add("rounded");
                        scope.appendChild(img);
                    });
                }
            )
            .catch(function(err) {
                console.log('Fetch Error :-S', err);
            });
    }


}
