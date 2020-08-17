

class Carousel {

    constructor(element) {
        this.board = element

        this.isInfoView = false
        this.isRightSwipe = false
        this.isLeftSwipe = false
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

            //{touchAction:'pan-y'}
            // listen for tap and pan gestures on top card
            this.hammer = new Hammer(this.topCard )
            this.hammer.add(new Hammer.Tap())
            this.hammer.add(new Hammer.Pan({
                position: Hammer.position_ALL,
                threshold: 5
            }))

            // pass events data to custom callbacks
            this.hammer.on('tap', (e) => {
                this.onTap(e)
            })
            this.hammer.on('pan', (e) => {
                //regular view, panning is a left/right swipe.
                if (!this.isInfoView) {
                    this.onPanRegularView(e)
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

    /*
    * Expand the "info view" from the regular fullscreen swipe view.
    * */
    expandInfo () {
        this.isInfoView = true
        //hide restaurant info on the card (now displaying in info section)
        this.topCard.children[3].style.display='none'

        //allow horizontal scroll, even when card is selected.
        this.hammer.set({touchAction:'pan-y'})
        document.getElementById('restaurantInfoBelowCard').style.display = 'block'

        /* enable regular vertical scrolling when in info mode */
        // document.getElementById('board').style.touchAction = 'pan-y!important'
        board.style.overflow = 'scroll'
        board.style.touchAction = 'pan-y !important'
        document.getElementById('board').style.touchAction = 'pan-y !important'
        // enable transform transition
        this.topCard.style.transition = 'width 100ms ease-out'
        this.topCard.style.transition = 'height 100ms ease-out'
        this.topCard.style.transition = 'top 100ms ease-out'

        //*note* need to change "height" and "top" attributes to line up image at top of the screen.
        this.topCard.style.width = '100%'
        this.topCard.style.height = '70%'
        this.topCard.style.top = '35%' //puts the topCard at the top of the screen.
        this.topCard.style.borderRadius = '0%'

        //hide the next card.
        this.nextCard.style.display='none'

        //show button to go back to regular view
        document.getElementById('backToRegularViewButton').style.display = 'block'
        document.getElementById('backToRegularViewButton').style.pointerEvents = 'auto'

        //hide top navbar icons
        document.getElementById('navBarTop').style.display = 'none'
    }

    /*
    * Shrink the "info view" back to regular fullscreen swipe view.
    * */
    shrinkInfo () {
        this.isInfoView = false

        /* show restaurant info on card again */
        this.topCard.children[3].style.display='block'

        /* hammer object is the card. switch back to regular hammer mode. none means it's just responding to the card listeners (pan and tap).*/
        this.hammer.set({touchAction:'none'})

        /* hiding the info below the card while in regular swipe mode, so there's nothing to vertical scroll to. */
        board.style.overflow = 'hidden'
        document.getElementById('restaurantInfoBelowCard').style.display = 'none'

        // enable transform transition
        this.topCard.style.transition = 'width 150ms ease-out'
        this.topCard.style.transition = 'height 150ms ease-out'
        this.topCard.style.transition = 'top 150ms ease-out'

        // apply rotation around Y axis
        //*note* need to change height and top to line up image at top of the screen.
        this.topCard.style.width = '97%'
        this.topCard.style.height = '89%'
        this.topCard.style.top = '45%' //puts the topCard at the top of the screen.
        this.topCard.style.borderRadius = '2%'
        this.topCard.style.boxShadow = '0px 4px 4px 0px rgba(0, 0, 0, 0.1), 0px -500px 100px -100px rgba(0, 0, 0, .3) inset, 0px 150px 100px -100px rgba(0, 0, 0, 0.12) inset;'

        //re-show the next card behind top card.
        this.nextCard.style.display='block'

        //hide button when back in regular view
        document.getElementById('backToRegularViewButton').style.display = 'none'

        //show top navbar icons
        document.getElementById('navBarTop').style.display = 'block'
    }

    throwCard (posX, deg) {

        this.topCard.style.transition = 'transform 200ms ease-out'
        this.topCard.style.transform =
            'translateX(' + posX + 'px) rotate(' + deg + 'deg)'

        this.topCard.children[1].style.opacity = (posX + 475.5) / 400;
        this.topCard.children[2].style.opacity = ((posX + 475.5) / 400) * -1;

        document.getElementById('backToRegularViewButton').style.display = 'none'
        document.getElementById('backToRegularViewButton').style.pointerEvents = 'none'
        this.topCard.children[3].style.display='block'
        document.getElementById('restaurantInfoOnCard').style.display = 'block'
         /* disable regular vertical scrolling when in regular swipe mode */
        board.style.overflow = 'hidden'

        this.hammer.set({touchAction:'none'})

        // wait transition end
        setTimeout(() => {
            // remove swiped card
            this.board.removeChild(this.topCard)

            // add new card
            this.push()
            // handle gestures on new top card
            this.handle()
            this.isInfoView = false
            this.isRightSwipe = false
            this.isLeftSwipe = false
            $('#board').children().eq(1).attr('id', 'card_0')
        }, 200);
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
            // console.log('tap bottom')
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
                // console.log('tap left')
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
            }
        }
    }

    onPanRegularView(e) {
        // console.log("panning regular view...");
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


        this.topCard.children[1].style.opacity = (posX + 475.5) / 400;
        this.topCard.children[2].style.opacity = ((posX + 475.5) / 400) * -1;

        // scale up next card
        if (this.nextCard) this.nextCard.style.transform =
            'translateX(-50%) translateY(-50%) rotate(0deg) rotateY(0deg) scale(' + scale + ')'

        if (e.isFinal) {
            this.topCard.children[1].style.opacity = 0;
            this.topCard.children[2].style.opacity = 0;
            this.isPanning = false

            // set back transition properties
            this.topCard.style.transition = 'transform 200ms ease-out'
            // if (this.nextCard) this.nextCard.style.transition = 'transform 100ms linear'

            // check threshold and movement direction
            if (propX > 0.25 && e.direction === Hammer.DIRECTION_RIGHT) {

                //posX
                this.throwCard(this.board.clientWidth, deg)
                openMatchOverlay()

            } else if (propX < -0.25 && e.direction === Hammer.DIRECTION_LEFT) {

                //posX
                this.throwCard(-(this.board.clientWidth + this.topCard.clientWidth), deg)
            }
            else {
                // reset cards position and size
                this.topCard.style.transform =
                    'translateX(-50%) translateY(-50%) rotate(0deg) rotateY(0deg) scale(1)'
                if (this.nextCard) this.nextCard.style.transform =
                    'translateX(-50%) translateY(-50%) rotate(0deg) rotateY(0deg) scale(0.95)'
            }
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

        let swipeRightGreenIndicator = document.createElement('div')
        swipeRightGreenIndicator.id = 'swipeRightGreenIndicator'
        card.appendChild(swipeRightGreenIndicator)

        let swipeLeftRedIndicator = document.createElement('div')
        swipeLeftRedIndicator.id = 'swipeLeftRedIndicator'
        card.appendChild(swipeLeftRedIndicator)


        /* restaurant Info. put each item in the main "restaurant info" div so it can all be hidden at once. */
        let restaurantInfoOnCard = document.createElement('div')
        restaurantInfoOnCard.id = 'restaurantInfoOnCard'
        card.appendChild(restaurantInfoOnCard)

        let restaurantName = document.createElement('h1')
        restaurantName.id = 'restaurantName'
        restaurantName.innerHTML='Smokin\' Oak'
        restaurantInfoOnCard.appendChild(restaurantName)

        let restaurantRating = document.createElement('h2')
        restaurantRating.id = 'restaurantRating'
        restaurantInfoOnCard.appendChild(restaurantRating)

        let ratingStar1 = document.createElement('span')
        ratingStar1.classList.add('fa')
        ratingStar1.classList.add('fa-star')
        ratingStar1.classList.add('checked')
        restaurantRating.appendChild(ratingStar1)

        let ratingStar2 = document.createElement('span')
        ratingStar2.classList.add('fa')
        ratingStar2.classList.add('fa-star')
        ratingStar2.classList.add('checked')
        restaurantRating.appendChild(ratingStar2)

        let ratingStar3 = document.createElement('span')
        ratingStar3.classList.add('fa')
        ratingStar3.classList.add('fa-star')
        ratingStar3.classList.add('fa-star')
        ratingStar3.classList.add('checked')
        restaurantRating.appendChild(ratingStar3)

        let ratingStar4 = document.createElement('span')
        ratingStar4.classList.add('fa')
        ratingStar4.classList.add('fa-star')
        ratingStar4.classList.add('checked')
        restaurantRating.appendChild(ratingStar4)

        let ratingStar5 = document.createElement('span')
        ratingStar5.classList.add('fa')
        ratingStar5.classList.add('fa-star')
        restaurantRating.appendChild(ratingStar5)

        let restaurantType = document.createElement('h2')
        restaurantType.id = 'restaurantType'
        restaurantType.innerHTML='Barbecue restaurant'
        restaurantInfoOnCard.appendChild(restaurantType)

        let restaurantMilesAway = document.createElement('h2')
        restaurantMilesAway.id = 'restaurantMilesAway'
        restaurantMilesAway.innerHTML='4 miles away'
        restaurantInfoOnCard.appendChild(restaurantMilesAway)

        let restaurantDescription = document.createElement('div')
        restaurantDescription.id = 'restaurantDescription'
        restaurantInfoOnCard.appendChild(restaurantDescription)

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

        card.style.backgroundImage =  "url(" + images[currImageArrayIndex][0].src + ")"

        if (this.board.childElementCount === 4) {
            card.id = 'card_0'
        }
        else {
            card.id = 'card_1'
        }
        this.board.insertBefore(card, this.board.firstChild)

        currImageArrayIndex = (currImageArrayIndex === 0) ? 1 : 0
    }
}