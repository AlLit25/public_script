class Notification {
    static show(code) {
        const blocks = Notification.getBlocks();

        for (const blockCode in blocks) {
            if (blockCode === code) {
                if (blocks[blockCode].classList.contains('hide')) {
                    blocks[blockCode].classList.remove('hide');
                    setTimeout(() => {
                        blocks[blockCode].classList.add('hide');
                    }, 3000);
                }
            } else {
                blocks[blockCode].classList.add('hide');
            }
        }
    }

    static getBlocks() {
        const mainBlock = document.querySelector('div[data-mfn-block="notification"]');
        const blocksList = {};

        if(Main.isset(mainBlock)) {
            const rawBlocksList = mainBlock.querySelectorAll('div[data-mfn-block]');

            rawBlocksList.forEach(block => {
                blocksList[block.dataset['mfnBlock']] = block;
            })
        }

        return blocksList;
    }
}