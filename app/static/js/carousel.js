

class Carousel {

    constructor(element) {
        this.board = element

        this.isInfoView = false
        this.isRightSwipe = false
        this.isLeftSwipe = false
        // add first two cards programmatically. the second call here is the only push() call with the is_offset = 1.
        // since the first two requests happen at nearly the same time, this offsets the result by one so that
        // two different restaurants are returned.
        this.push()
        this.push(1)

        this.gmaps_place_id = ''
        /* need to save these values for populating info below cards.
           when push() is called, we can get the data from /get_card and populate the card at the time of the call.
           however, /get_card is called one card ahead, we need to save these values to populate them correctly when
           a card is thrown and a new card is displayed.
         */
        this.restaurantName = ''
        this.restaurantType = ''
        this.restaurantMilesAway = ''
        this.restaurantDescription = ''
        this.restaurantPriceLevel = ''
        this.restaurantRating = ''
        this.restaurantUserRatingsTotal = ''

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
            this.hammer = new Hammer(this.topCard)
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

    jiggleImage(e) {
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
    expandInfo() {
        this.isInfoView = true
        //hide restaurant info on the card (now displaying in info section)
        this.topCard.children[3].style.display = 'none'

        //allow horizontal scroll, even when card is selected.
        this.hammer.set({touchAction: 'pan-y'})
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
        this.nextCard.style.display = 'none'

        //show button to go back to regular view
        document.getElementById('backToRegularViewButton').style.display = 'block'
        document.getElementById('backToRegularViewButton').style.pointerEvents = 'auto'

        //hide top navbar icons
        document.getElementById('navBarTop').style.display = 'none'
    }

    /*
    * Shrink the "info view" back to regular fullscreen swipe view.
    * */
    shrinkInfo() {
        this.isInfoView = false

        /* show restaurant info on card again */
        this.topCard.children[3].style.display = 'block'

        /* hammer object is the card. switch back to regular hammer mode. none means it's just responding to the card listeners (pan and tap).*/
        this.hammer.set({touchAction: 'none'})

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
        this.nextCard.style.display = 'block'

        //hide button when back in regular view
        document.getElementById('backToRegularViewButton').style.display = 'none'

        //show top navbar icons
        document.getElementById('navBarTop').style.display = 'block'
    }

    throwCard(posX, deg) {
        //post swipe direction to DB
        let isRightSwipe = 0
        if (this.isRightSwipe) {
            isRightSwipe = 1;
        }
        postSwipe(this.topCard.getAttribute('gmaps_place_id'), isRightSwipe);
        this.topCard.style.transition = 'transform 200ms ease-out'
        this.topCard.style.transform =
            'translateX(' + posX + 'px) rotate(' + deg + 'deg)'

        this.topCard.children[1].style.opacity = (posX + 475.5) / 400;
        this.topCard.children[2].style.opacity = ((posX + 475.5) / 400) * -1;

        document.getElementById('backToRegularViewButton').style.display = 'none'
        document.getElementById('backToRegularViewButton').style.pointerEvents = 'none'
        this.topCard.children[3].style.display = 'block'
        document.getElementById('restaurantInfoOnCard').style.display = 'block'
        /* disable regular vertical scrolling when in regular swipe mode */
        board.style.overflow = 'hidden'

        this.hammer.set({touchAction: 'none'})

        // wait transition end
        setTimeout(() => {
            // remove swiped card
            this.board.removeChild(this.topCard)

            //set below card values to the nextCard (saved in JS variables)
            this.setBelowCardInfo(
                this.restaurantName,
                this.restaurantType,
                this.restaurantMilesAway,
                this.restaurantDescription,
                this.restaurantPriceLevel,
                this.restaurantRating,
                this.restaurantUserRatingsTotal)

            // add new card
            this.push()
            this.isInfoView = false
            this.isRightSwipe = false
            this.isLeftSwipe = false

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
            (e.center.y - bounds.top) >= this.topCard.clientHeight * .75

        //split screen vertically in half for left/right taps.
        this.isTappingLeft =
            (e.center.x - bounds.left) <= this.topCard.clientWidth * .5

        if (this.isTappingBottom && !this.isInfoView) {
            // console.log('tap bottom')
            window.history.pushState({url: 'info', title: 'info'}, 'info', 'info')
            this.expandInfo(e)
        } else {
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
                this.isRightSwipe = true
                this.throwCard(this.board.clientWidth, deg)
                openMatchOverlay()

            } else if (propX < -0.25 && e.direction === Hammer.DIRECTION_LEFT) {
                this.isLeftSwipe = true
                this.throwCard(-(this.board.clientWidth + this.topCard.clientWidth), deg)
            } else {
                // reset cards position and size
                this.topCard.style.transform =
                    'translateX(-50%) translateY(-50%) rotate(0deg) rotateY(0deg) scale(1)'
                if (this.nextCard) this.nextCard.style.transform =
                    'translateX(-50%) translateY(-50%) rotate(0deg) rotateY(0deg) scale(0.95)'
            }
        }
    }

    setBelowCardInfo(restaurantName,
                     restaurantType,
                     restaurantMilesAway,
                     restaurantDescription,
                     restaurantPriceLevel,
                     restaurantRating,
                     userRatingsTotal) {
        document.getElementById('restaurantNameBelowCard').innerHTML = restaurantName

        document.getElementById('restaurantMilesAwayBelowCard').innerHTML = '<i class="fas fa-map-marker-alt"></i> ' + restaurantMilesAway
        document.getElementById('restaurantDescriptionBelowCard').innerHTML = restaurantDescription
        setRatingStars('restaurantRatingBelowCard', restaurantRating)

        if (restaurantPriceLevel) {
            let price_level_str = '<span style="color:gray">'
            for (var i = 0; i < parseInt(restaurantPriceLevel); i++) {
                price_level_str += '<i class="fas fa-dollar-sign"></i>'
            }
            price_level_str += '</span>'

            document.getElementById('restaurantTypeBelowCard').innerHTML = price_level_str + ' - ' + restaurantType
        }
        else {
            document.getElementById('restaurantTypeBelowCard').innerHTML = restaurantType
        }


        document.getElementById('userRatings').innerHTML = '(' + userRatingsTotal + ')'
    }

    push(is_offset=0) {
        //save instance of Carousel class to a variable, so that we can call it in the /get_card callback.
        //see https://stackoverflow.com/questions/4018461/unable-to-use-class-methods-for-callbacks-in-javascript
        var self = this;

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

        $.ajax({
            type: "POST",
            url: "/get_card",

            data: JSON.stringify({
                "lat": cookie_lat,
                "lng": cookie_lng,
                "is_offset": is_offset
            }),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function (result) {
                self.restaurantName = result.name
                self.restaurantType = result.restaurant_type
                self.restaurantDescription = result.restaurant_description
                self.restaurantRating = result.rating
                self.restaurantPriceLevel = result.price_level
                self.restaurantUserRatingsTotal = result.user_ratings_total
                self.gmaps_place_id = result.gmaps_place_id

                let miles_away_str = ''
                if (result.distance === '0') {
                    miles_away_str = 'Less than 1 mile away'
                } else if (result.distance === '1') {
                    miles_away_str = '1 mile away'
                } else {
                    miles_away_str = result.distance + ' miles away'
                }

                self.restaurantMilesAway = miles_away_str

                images[currImageArrayIndex] = new Array()
                preload(result.photo_urls)
                let card = document.createElement('div')

                card.classList.add('card')
                card.setAttribute('numImages', result.photo_urls.length)
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
                restaurantName.id = 'restaurantNameOnCard'
                restaurantName.innerHTML = self.restaurantName
                restaurantInfoOnCard.appendChild(restaurantName)

                let restaurantRating = document.createElement('h2')
                restaurantRating.id = 'restaurantRatingOnCard'
                restaurantInfoOnCard.appendChild(restaurantRating)

                let ratingStar1 = document.createElement('span')
                ratingStar1.classList.add('fa')
                ratingStar1.classList.add('fa-star')
                restaurantRating.appendChild(ratingStar1)

                let ratingStar2 = document.createElement('span')
                ratingStar2.classList.add('fa')
                ratingStar2.classList.add('fa-star')
                restaurantRating.appendChild(ratingStar2)

                let ratingStar3 = document.createElement('span')
                ratingStar3.classList.add('fa')
                ratingStar3.classList.add('fa-star')
                restaurantRating.appendChild(ratingStar3)

                let ratingStar4 = document.createElement('span')
                ratingStar4.classList.add('fa')
                ratingStar4.classList.add('fa-star')
                restaurantRating.appendChild(ratingStar4)

                let ratingStar5 = document.createElement('span')
                ratingStar5.classList.add('fa')
                ratingStar5.classList.add('fa-star')
                restaurantRating.appendChild(ratingStar5)

                let restaurantType = document.createElement('h2')
                restaurantType.id = 'restaurantTypeOnCard'
                restaurantType.innerHTML = self.restaurantType
                restaurantInfoOnCard.appendChild(restaurantType)

                let restaurantMilesAway = document.createElement('h2')
                restaurantMilesAway.id = 'restaurantMilesAwayOnCard'
                restaurantMilesAway.innerHTML = self.restaurantMilesAway
                restaurantInfoOnCard.appendChild(restaurantMilesAway)


                let imageNumIndicatorTab
                let imageNumIndicatorTabNum
                for (var i = 0; i < card.getAttribute('numImages'); i++) {
                    imageNumIndicatorTab = document.createElement('div')
                    if (i != 0) {
                        imageNumIndicatorTab.style.opacity = '0.2';
                    }
                    imageNumIndicatorTabNum = i + 1
                    imageNumIndicatorTab.id = 'imageNumIndicatorTab_' + imageNumIndicatorTabNum;
                    imageNumIndicator.appendChild(imageNumIndicatorTab)
                }

                if (parseInt(card.getAttribute('numImages')) === 1) {
                    imageNumIndicatorTab.style.display = 'none';
                }

                card.style.backgroundImage = "url(" + images[currImageArrayIndex][0].src + ")"

                card.setAttribute('gmaps_place_id', self.gmaps_place_id)

                //childelementcount=4 for the first push() when the site opens. populate below card info here,
                //and when a card is thrown.
                if (board.childElementCount === 4) {
                    card.id = 'card_0'
                    self.setBelowCardInfo(
                        self.restaurantName,
                        self.restaurantType,
                        self.restaurantMilesAway,
                        self.restaurantDescription,
                        self.restaurantPriceLevel,
                        self.restaurantRating,
                        self.restaurantUserRatingsTotal)
                } else {
                    $('#board').children().eq(0).attr('id', 'card_0')
                    card.id = 'card_1'
                }
                board.insertBefore(card, board.firstChild)

                setRatingStars('restaurantRatingOnCard', self.restaurantRating)

                currImageArrayIndex = (currImageArrayIndex === 0) ? 1 : 0
                console.log(result);
                // handle gestures
                self.handle()

            },
            error: function (result) {
                console.log(result);
            },
        });

        function preload(photo_urls) {
            for (var i = 0; i < photo_urls.length; i++) {
                images[currImageArrayIndex][i] = new Image()
                images[currImageArrayIndex][i].src = photo_urls[i]['photo_url_' + i.toString()]
            }
        }
    }
}