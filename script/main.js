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
        if (elem.hasAttribute('data-mf-click')) {
            switch (elem.dataset.mfClick) {
                case 'home':
                    Main.connectTemplate(this.main, 'home');
                    break;
                case 'income':
                    Main.connectTemplate(this.main, 'income');
                    break;
            }
        }
    }

    static isset(elem) {
        return elem !== null && elem !== undefined;
    }

    static connectTemplate(parent, nameTemplate) {
        fetch(`template/${nameTemplate}.html`)
            .then(response => response.text())
            .then(data => {
                parent.innerHTML = data;
            })
            .catch(error => console.error('Error loading template:', error));
    }
}