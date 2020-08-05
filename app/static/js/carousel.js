

class Carousel {

    constructor(element) {
        this.board = element

        this.isInfoView = false
        // add first two cards programmatically
        this.push()
        this.push()

        // handle gestures
        this.handle()
    }

    handle() {

        // list all cards
        this.cards = this.board.querySelectorAll('.card')

        // get top card
        this.topCard = this.cards[this.cards.length - 1]

        // get next card
        this.nextCard = this.cards[this.cards.length - 2]

        // if at least one card is present
        if (this.cards.length > 0) {

            // set default top card position and scale
            this.topCard.style.transform =
                'translateX(-50%) translateY(-50%) rotate(0deg) rotateY(0deg) scale(1)'

            // destroy previous Hammer instance, if present
            if (this.hammer) this.hammer.destroy()

            // listen for tap and pan gestures on top card
            this.hammer = new Hammer(this.topCard)
            this.hammer.add(new Hammer.Tap())
            this.hammer.add(new Hammer.Pan({
                position: Hammer.position_ALL,
                threshold: 0
            }))

            // pass events data to custom callbacks
            this.hammer.on('tap', (e) => {
                this.onTap(e)
            })
            this.hammer.on('pan', (e) => {
                if (!this.isInfoView) {
                    this.onPan(e)
                }
            })

        }

    }

    jiggleImage (e) {
        // get finger position on top card
        let propX = (e.center.x - e.target.getBoundingClientRect().left) / e.target.clientWidth

        // get rotation degrees around Y axis (+/- 15) based on finger position
        let rotateY = 15 * (propX < 0.05 ? -1 : 1)

        // enable transform transition
        this.topCard.style.transition = 'transform 100ms ease-out'

        // apply rotation around Y axis
        this.topCard.style.transform =
            'translateX(-50%) translateY(-50%) rotate(0deg) rotateY(' + rotateY + 'deg) scale(1)'

        // wait for transition end
        setTimeout(() => {
            // reset transform properties
            this.topCard.style.transform =
                'translateX(-50%) translateY(-50%) rotate(0deg) rotateY(0deg) scale(1)'
        }, 100)
    }

    expandInfo () {
        carousel.isInfoView = true
        // enable transform transition
        this.topCard.style.transition = 'width 100ms ease-out'
        this.topCard.style.transition = 'height 100ms ease-out'
        this.topCard.style.transition = 'top 100ms ease-out'

        // apply rotation around Y axis
        //*note* need to change "height" and "top" attributes to line up image at top of the screen.
        this.topCard.style.width = '100%'
        this.topCard.style.height = '70%'
        this.topCard.style.top = '35%' //puts the topCard at the top of the screen.
        this.topCard.style.borderRadius = '0%'
        // this.topCard.style.boxShadow = 'none'

        //hide the next card.
        this.nextCard.style.display='none'

        //show button to go back to regular view
        this.topCard.children[1].style.display = 'block'
    }

    shrinkInfo () {
        carousel.isInfoView = false
        // enable transform transition
        this.topCard.style.transition = 'width 100ms ease-out'
        this.topCard.style.transition = 'height 100ms ease-out'
        this.topCard.style.transition = 'top 100ms ease-out'

        // apply rotation around Y axis
        //*note* need to change height and top to line up image at top of the screen.
        this.topCard.style.width = '97%'
        this.topCard.style.height = '80%'
        this.topCard.style.top = '50%' //puts the topCard at the top of the screen.
        this.topCard.style.borderRadius = '2%'
        this.topCard.style.boxShadow = '0px 4px 4px 0px rgba(0, 0, 0, 0.1)'

        //re-show the next card behind top card.
        this.nextCard.style.display='block'

        //hide button when back in regular view
        this.topCard.children[1].style.display = 'none'
    }

    throwCard (posX, deg) {
        this.topCard.style.transition = 'transform 300ms ease-out'
        this.topCard.style.transform =
            'translateX(' + posX + 'px) rotate(' + deg + 'deg)'

        // wait transition end
        setTimeout(() => {
            // remove swiped card
            this.board.removeChild(this.topCard)
            // add new card
            this.push()
            // handle gestures on new top card
            this.handle()
            this.isInfoView = false
        }, 1000)
    }


    onTap(e) {
        let bounds = this.topCard.getBoundingClientRect()
        let currImageNum = parseInt(this.topCard.getAttribute('currImage'))
        let numImagesOnCard = parseInt(this.topCard.getAttribute('numImages'))
        let cardCurrImageArrayIndex = parseInt(this.topCard.getAttribute('currImageArrayIndex'))

        // get finger position.

        //bottom 1/4 of screen is a bottom tap.
        this.isTappingBottom =
            (e.center.y - bounds.top) < this.topCard.clientHeight *.75 ? false : true

        //split screen vertically in half for left/right taps.
        this.isTappingLeft =
            (e.center.x - bounds.left) > this.topCard.clientWidth * .5 ? false : true

        if (this.isTappingBottom && !this.isInfoView ) {
            console.log('tap bottom')
            window.history.pushState({url:'info', title:'info'}, 'info', 'info')
            this.expandInfo(e)
        }
        else {
            //if tap left, decrement current img counter. if tap right, increment.
            if (this.isTappingLeft) {
                if (currImageNum === 1) {
                    this.jiggleImage(e)
                } else {
                    //track the position in the image list (for the indicator tabs/bullets at the top of the images)
                    this.topCard.setAttribute('currImage', parseInt(this.topCard.getAttribute('currImage')) - 1)

                    //set the opacity of the image tabs to indicate the currently selected image
                    this.topCard.children[0].children[currImageNum - 1].style.opacity = '0.2'
                    this.topCard.children[0].children[currImageNum - 2].style.opacity = '1'

                    //update background image.
                    this.topCard.style.backgroundImage = "url(" + images[cardCurrImageArrayIndex][currImageNum - 2].src + ")"
                }
                console.log('tap left')
            } else {
                if (currImageNum === numImagesOnCard) {
                    this.jiggleImage(e)
                } else {
                    /* check if the "shrink back to regular view" button was pressed */
                    if (e.target.classList[0] != 'backToRegularViewButton') {
                        //track the position in the image list (for the indicator tabs/bullets at the top of the images)
                        this.topCard.setAttribute('currImage', parseInt(this.topCard.getAttribute('currImage')) + 1)

                        //set the opacity of the image tabs to indicate the currently selected image
                        this.topCard.children[0].children[currImageNum - 1].style.opacity = '0.2'
                        this.topCard.children[0].children[currImageNum].style.opacity = '1'

                        //update background image.
                        this.topCard.style.backgroundImage = "url(" + images[cardCurrImageArrayIndex][currImageNum].src + ")"
                    }
                }
                console.log('tap right')
            }
        }
    }

    onPan(e) {
        console.log("panning...");
        if (!this.isPanning) {

            this.isPanning = true

            // remove transition properties
            this.topCard.style.transition = null
            if (this.nextCard) this.nextCard.style.transition = null

            // get top card coordinates in pixels
            let style = window.getComputedStyle(this.topCard)
            let mx = style.transform.match(/^matrix\((.+)\)$/)
            this.startPosX = mx ? parseFloat(mx[1].split(', ')[4]) : 0
            this.startPosY = mx ? parseFloat(mx[1].split(', ')[5]) : 0

            // get top card bounds
            let bounds = this.topCard.getBoundingClientRect()

            // get finger position on top card, top (1) or bottom (-1)
            this.isDraggingFrom =
                (e.center.y - bounds.top) > this.topCard.clientHeight / 2 ? -1 : 1

        }

        // get new coordinates
        let posX = e.deltaX + this.startPosX
        let posY = e.deltaY + this.startPosY

        // get ratio between swiped pixels and the axes
        let propX = e.deltaX / this.board.clientWidth
        let propY = e.deltaY / this.board.clientHeight

        // get swipe direction, left (-1) or right (1)
        let dirX = e.deltaX < 0 ? -1 : 1

        // get degrees of rotation, between 0 and +/- 45
        let deg = this.isDraggingFrom * dirX * Math.abs(propX) * 45

        // get scale ratio, between .95 and 1
        let scale = (95 + (5 * Math.abs(propX))) / 100

        // move and rotate top card
        this.topCard.style.transform =
            'translateX(' + posX + 'px) translateY(' + posY + 'px) rotate(' + deg + 'deg) rotateY(0deg) scale(1)'

        // scale up next card
        if (this.nextCard) this.nextCard.style.transform =
            'translateX(-50%) translateY(-50%) rotate(0deg) rotateY(0deg) scale(' + scale + ')'

        if (e.isFinal) {

            this.isPanning = false

            // let successful = false

            // set back transition properties
            this.topCard.style.transition = 'transform 200ms ease-out'
            if (this.nextCard) this.nextCard.style.transition = 'transform 100ms linear'

            // check threshold and movement direction
            if (propX > 0.25 && e.direction === Hammer.DIRECTION_RIGHT) {

                //posX
                this.throwCard(this.board.clientWidth, deg)
                // successful = true
                // get right border position
                // posX = this.board.clientWidth

            } else if (propX < -0.25 && e.direction === Hammer.DIRECTION_LEFT) {

                //posX
                this.throwCard(-(this.board.clientWidth + this.topCard.clientWidth), deg)
                // successful = true
                // get left border position
                // posX = -(this.board.clientWidth + this.topCard.clientWidth)
            }
            else {
                // reset cards position and size
                this.topCard.style.transform =
                    'translateX(-50%) translateY(-50%) rotate(0deg) rotateY(0deg) scale(1)'
                if (this.nextCard) this.nextCard.style.transform =
                    'translateX(-50%) translateY(-50%) rotate(0deg) rotateY(0deg) scale(0.95)'
            }


            // } else if (propY < -0.25 && e.direction === Hammer.DIRECTION_UP) {
            //
            //     successful = true
            //     // get top border position
            //     posY = -(this.board.clientHeight + this.topCard.clientHeight)
            //
            // }


            // if (successful) {

                // throw card in the chosen direction


            // } else {



            // }

        }

    }

    push() {

        /*
            <div class="card">
                <div class="imageNumIndicator">
                    <div id="imageNumIndicatorTab_1"></div>
                    ...
                </div>
                <div class="backToRegularViewButton">
                </div>
            </div>

         */
        var imageUrls = ["https://picsum.photos/1400/?random=" + Math.round(Math.random() * 1000000),
                         "https://picsum.photos/1400/?random=" + Math.round(Math.random() * 1000000)]

        function preload(imageUrls) {
            for (var i = 0; i < imageUrls.length; i++) {
                images[currImageArrayIndex][i] = new Image()
                images[currImageArrayIndex][i].src = imageUrls[i]
            }
        }

        images[currImageArrayIndex] = new Array()
        preload(imageUrls)

        let card = document.createElement('div')

        card.classList.add('card')
        card.setAttribute('numImages', 2)
        card.setAttribute('currImage', 1)
        card.setAttribute('currImageArrayIndex', currImageArrayIndex)

        /* create current image # indicator */
        let imageNumIndicator = document.createElement('div')
        imageNumIndicator.classList.add('imageNumIndicator')
        card.appendChild(imageNumIndicator)

        /* create button to shrink info view back to normal view (bottom right of images section) */
        let backToRegularViewButton = document.createElement('div')
        backToRegularViewButton.classList.add('backToRegularViewButton')
        card.appendChild(backToRegularViewButton)
        backToRegularViewButton.onclick = function () {
            // from /info back to main page (caught by popstate listener on index.html, same thing that catches the back button)
            history.back()
        }


        let imageNumIndicatorTab
        let imageNumIndicatorTabNum
        for (var i = 0; i < card.getAttribute('numImages'); i++) {
            imageNumIndicatorTab = document.createElement('div')
            if (i != 0) {
                imageNumIndicatorTab.style.opacity='0.2';
            }
            imageNumIndicatorTabNum = i + 1
            imageNumIndicatorTab.id='imageNumIndicatorTab_' + imageNumIndicatorTabNum;
            imageNumIndicator.appendChild(imageNumIndicatorTab)
        }

        if (parseInt(card.getAttribute('numImages')) === 1) {
            imageNumIndicatorTab.style.display='none';
        }

        card.id = 'card1'

        card.style.backgroundImage =  "url(" + images[currImageArrayIndex][0].src + ")"
        card.style.boxShadow = '0 20px 20px 10px rgba(0, 0, 0, .1) inset'

        this.board.insertBefore(card, this.board.firstChild)

        currImageArrayIndex = (currImageArrayIndex === 0) ? 1 : 0
    }



}