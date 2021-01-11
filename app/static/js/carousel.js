

class Carousel {

    constructor(element) {
        this.board = element

        this.isInfoView = false
        this.isRightSwipe = false
        this.isLeftSwipe = false

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
        this.google_place_url = ''

        /* keep gmaps places in an array and shift() off the array to populate a card. */
        this.places_array = []

        this.initFirstCards()
        //get first 2 cards from database. success callback "pushes" cards onto the deck.
        this.getCards()
    }

    getMilesAway(distance) {
        if (distance === '0') {
            return  'Less than 1 mile away'
        } else if (distance === '1') {
            return '1 mile away'
        } else {
            return distance + ' miles away'
        }
    }

    push(result) {
        //get top card without a gmaps place ID
        let card
        if (document.querySelector('#board #card_0') &&
            document.querySelector('#board #card_1') &&
            !document.querySelector('#board #card_0').hasAttribute('gmaps_place_id'))
        {
            card = board.children[1]
            if (result) {
                this.setBelowCardInfo(
                    result.name,
                    result.restaurant_type,
                    this.getMilesAway(result.distance),
                    result.restaurant_description,
                    result.price_level,
                    result.rating,
                    result.user_ratings_total)
            }
        }
        else {
            card = board.children[0]
        }

        if (!result) {
            card.style.color = 'gray'
            card.style.font_size= '2.7vh'
            card.style.boxShadow = 'none'

            //push an empty "no restaurants open in area" card
            let message = document.createElement('h1')
            message.id = 'noRestaurantsMessage'
            message.innerHTML = 'No more restaurants open in your area.'
            card.appendChild(message)

            if (card.id === 'card_0') {
                this.board.removeChild(this.nextCard)
            }
        }
        else {
            document.getElementById('swipeLeftButton').style.pointerEvents = 'auto'
            document.getElementById('swipeRightButton').style.pointerEvents = 'auto'
            self.restaurantName = result.name
            self.restaurantType = result.restaurant_type
            self.restaurantDescription = result.restaurant_description
            self.restaurantRating = result.rating
            self.restaurantPriceLevel = result.price_level
            self.restaurantUserRatingsTotal = result.user_ratings_total
            self.gmaps_place_id = result.gmaps_place_id
            self.google_place_url = result.url

            self.restaurantMilesAway = this.getMilesAway(result.distance)

            images[currImageArrayIndex] = new Array()

            card.setAttribute('currImage', 1)
            card.setAttribute('currImageArrayIndex', currImageArrayIndex)

            if (result.photo_urls) {
                //preload images
                for (var i = 0; i < result.photo_urls.length; i++) {
                    images[currImageArrayIndex][i] = new Image()
                    images[currImageArrayIndex][i].src = result.photo_urls[i]['photo_url_' + i.toString()]
                }

                card.setAttribute('numImages', result.photo_urls.length)
            }
            else {
                card.setAttribute('numImages', 1)
            }

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
            card.style.backgroundPosition = 'center'

            card.setAttribute('gmaps_place_id', self.gmaps_place_id)
            card.setAttribute('restaurant_name_on_card', self.restaurantName)
            card.setAttribute('photo_url', images[0][0].src )
            card.setAttribute('url', self.google_place_url)

            //childelementcount=5 for the first push() when the site opens. populate below card info here,
            //and when a card is thrown.
            if (board.childElementCount === 5) {
                this.setBelowCardInfo(
                    self.restaurantName,
                    self.restaurantType,
                    self.restaurantMilesAway,
                    self.restaurantDescription,
                    self.restaurantPriceLevel,
                    self.restaurantRating,
                    self.restaurantUserRatingsTotal)
            }

            setRatingStars('restaurantRatingOnCard', self.restaurantRating)

            currImageArrayIndex = (currImageArrayIndex === 0) ? 1 : 0
        }
    }

    checkPushes() {
        if (!this.topCard.getAttribute('gmaps_place_id')) {
            this.push(this.places_array.shift())
            if (this.places_array.length === 0) {
                //disable swipe left/right buttons on the "no restaurants" message card.
                document.getElementById('swipeLeftButton').style.pointerEvents = 'none'
                document.getElementById('swipeRightButton').style.pointerEvents = 'none'
            }
        }
        if (this.places_array.length > 0 && !this.nextCard.getAttribute('gmaps_place_id')) {
            this.push(this.places_array.shift())
        }
    }

    initFirstCards() {
        //first card
        let card = document.createElement('div')
        card.classList.add('card')

        card.id = 'card_0'
        board.insertBefore(card, board.firstChild)

        //second card
        card = document.createElement('div')
        card.classList.add('card')

        //$('#board').children().eq(0).attr('id', 'card_0')
        card.id = 'card_1'
        board.insertBefore(card, board.firstChild)
        this.handle()
    }

    getCards() {
        var self = this;

        //getCard() is always called after a card is thrown. we don't want to get the next card
        //if the top card is the 'No restaurants in area' card.
        if (document.querySelector('#board #card_1 #noRestaurantsMessage')) {
            //disable swipe left/right buttons on the "no restaurants" message card.
            document.getElementById('swipeLeftButton').style.pointerEvents = 'none'
            document.getElementById('swipeRightButton').style.pointerEvents = 'none'
            return
        }

        // board starts w/ 4 child elements. after initFirstCards(), count = 6. after a card is throw, count = 5.
        if (board.childElementCount == 5) {
            let card = document.createElement('div')
            card.classList.add('card')
            $('#board').children().eq(0).attr('id', 'card_0')
            card.id = 'card_1'
            board.insertBefore(card, board.firstChild)
            this.handle()
        }

        if ((!self.places_array.length) || self.places_array.length === 2) {
            $.ajax({
                type: "POST",
                url: "/get_card",

                data: JSON.stringify({
                    "num_cards": 5,
                    "lat": cookie_lat,
                    "lng": cookie_lng
                }),
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                success: function (result) {
                    if (result) {
                        for (let i = 0; i < result.length; i++) {
                            self.places_array.push(result[i])
                        }
                        if (result.length < 5) {
                            self.places_array.push(null)
                        }
                    }
                    //push empty card (no more results for user).
                    else {
                        self.places_array.push(null)
                    }
                    self.checkPushes()
                },
                error: function (result) {
                    console.log(result);
                },
            });
        }
        else {
            self.checkPushes()
        }
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
        if (this.topCard.children[3]) {
            this.topCard.children[3].style.display = 'none'
        }

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
        if (this.topCard) {
            if (this.topCard.children[3]) {
                this.topCard.children[3].style.display = 'block'
            }

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
            if (this.nextCard) {
                this.nextCard.style.display = 'block'
            }

            //hide button when back in regular view
            if (document.getElementById('backToRegularViewButton')) {
                document.getElementById('backToRegularViewButton').style.display = 'none'
            }

            //show top navbar icons
            document.getElementById('navBarTop').style.display = 'block'
        }
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

        if (this.topCard.children[1]) {
            this.topCard.children[1].style.opacity = (posX + 475.5) / 400;
            this.topCard.children[2].style.opacity = ((posX + 475.5) / 400) * -1;
            this.topCard.children[3].style.display = 'block'
            document.getElementById('restaurantInfoOnCard').style.display = 'block'
        }

        if (document.getElementById('backToRegularViewButton')) {
            document.getElementById('backToRegularViewButton').style.display = 'none'
            document.getElementById('backToRegularViewButton').style.pointerEvents = 'none'
        }

        /* disable regular vertical scrolling when in regular swipe mode */
        board.style.overflow = 'hidden'

        this.hammer.set({touchAction: 'none'})

        // wait transition end
        setTimeout(() => {
            // remove swiped card
            this.board.removeChild(this.topCard)

            console.log('set below card info')
            //set below card values to the nextCard (saved in JS variables)
            this.setBelowCardInfo(
                self.restaurantName,
                self.restaurantType,
                self.restaurantMilesAway,
                self.restaurantDescription,
                self.restaurantPriceLevel,
                self.restaurantRating,
                self.restaurantUserRatingsTotal)

            this.topCard = null
            // add new card
            this.getCards()
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

        if (this.isTappingBottom && !this.isInfoView && this.topCard.getAttribute('gmaps_place_id')) {
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

                    if (this.topCard.children[0] && this.topCard.getAttribute('gmaps_place_id')) {
                        //set the opacity of the image tabs to indicate the currently selected image
                        this.topCard.children[0].children[currImageNum - 1].style.opacity = '0.2'
                        this.topCard.children[0].children[currImageNum - 2].style.opacity = '1'
                        //update background image.
                        this.topCard.style.backgroundImage = "url(" + images[cardCurrImageArrayIndex][currImageNum - 2].src + ")"
                    }
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

                        if (this.topCard.children[0] && this.topCard.getAttribute('gmaps_place_id')) {
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
    }

    onPanRegularView(e) {
        // console.log("panning regular view...");
        //dont pan if "no restaurants" card on top
        if (!this.isPanning && !document.querySelector('#board #card_0 #noRestaurantsMessage')) {

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

        if (this.topCard.children[1]) {
            this.topCard.children[1].style.opacity = (posX + 475.5) / 400;
        }

        if (this.topCard.children[2]) {
            this.topCard.children[2].style.opacity = ((posX + 475.5) / 400) * -1;
        }

        // scale up next card
        if (this.nextCard) this.nextCard.style.transform =
            'translateX(-50%) translateY(-50%) rotate(0deg) rotateY(0deg) scale(' + scale + ')'

        if (e.isFinal) {
            if (this.topCard.children[1]) {
                this.topCard.children[1].style.opacity = 0;
            }

            if (this.topCard.children[2]) {
                this.topCard.children[2].style.opacity = 0;
            }

            this.isPanning = false

            // set back transition properties
            this.topCard.style.transition = 'transform 200ms ease-out'

            // check threshold and movement direction
            if (propX > 0.25 && e.direction === Hammer.DIRECTION_RIGHT && this.topCard.getAttribute('gmaps_place_id')) {
                this.isRightSwipe = true
                this.throwCard(this.board.clientWidth, deg)

            } else if (propX < -0.25 && e.direction === Hammer.DIRECTION_LEFT && this.topCard.getAttribute('gmaps_place_id')) {
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
}