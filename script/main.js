document.addEventListener('DOMContentLoaded', () => {
    new Main()
});

class Main {
    constructor() {
        this.main = document.querySelector('main');

        if (Main.isset(this.main)) {
            Main.connectTemplate(this.main, 'home');
            this.main.addEventListener('click', event => this.clickHandler(event.target));
        }

    }

    clickHandler(elem) {
        console.log(elem);
    }

    static isset(elem) {
        return elem !== null && elem !== undefined;
    }

    static connectTemplate(parent, nameTemplate) {
        fetch(`template/${nameTemplate}.html`)
            .then(response => response.text())
            .then(data => {
                console.log(data);
                parent.insertAdjacentHTML('afterbegin', data);
            })
            .catch(error => console.error('Error loading template:', error));
    }
}