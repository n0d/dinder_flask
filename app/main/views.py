import ast
from flask import render_template, redirect, session, make_response, request, jsonify, current_app
from flask_sse import sse
from .. import db
import json
from . import main
from ..models import User, Place, UserPlace
import googlemaps
import requests
from math import floor


@main.route('/', methods=['GET'])
def index():
    return render_template("main/index.html")


@main.route('/info', methods=['GET'])
def info():
    return redirect('/')


@main.route('/create_user_if_not_exists', methods=['POST'])
def create_user_if_not_exists():
    # check if user exists
    user = User.query.filter_by(session_id='session:' + session.sid).first()

    # need to also get user that current user is matched with, if applicable,
    # since this is viewable on the account page.
    matched_user_pairing_code = ''

    # insert user if not exists
    if not user:
        user = User.insert_user(session_id='session:' + session.sid)
    else:
        matched_user = User.get_by_id(user.user_id_matched)
        if matched_user:
            matched_user_pairing_code = matched_user.user_pairing_code

    # session variable used throughout app.
    session['user_pairing_code'] = user.user_pairing_code

    # also set session coordinates
    data = ast.literal_eval(request.data.decode("utf-8"))

    session['curr_lat'] = str(data.get('curr_lat'))
    session['curr_lng'] = str(data.get('curr_lng'))

    resp = make_response(jsonify(user_pairing_code=session['user_pairing_code'],
                                 matched_user_pairing_code=matched_user_pairing_code)
                         , 200)
    return resp


# user_matched.user_pairing_code
@main.route('/account', methods=['GET'])
def account():
    return redirect('/')


# user requested to pair with another via account page -> Pair
@main.route('/pair_request', methods=['POST'])
def pair_request():
    data = ast.literal_eval(request.data.decode("utf-8"))

    user_code_requesting = str(data.get('initial_user_pairing_code')).upper()
    user_code_to_pair_with = str(data.get('requested_user_pairing_code')).upper()

    user_requesting = User.query.filter_by(user_pairing_code=user_code_requesting).first()
    user_to_pair = User.query.filter_by(user_pairing_code=user_code_to_pair_with).first()

    if user_requesting and user_to_pair:
        sse.publish({"user_code": user_code_requesting, "event_name": 'pair_request'},
                    channel=user_to_pair.user_pairing_code)
        resp = make_response('', 204)
        return resp
    else:
        resp = make_response('', 400)
        return resp


# user receives request and hits "pair" button on the pair overlay screen.
@main.route('/pair_accept', methods=['POST'])
def pair_accept():
    data = ast.literal_eval(request.data.decode("utf-8"))

    user_pairing_code_1 = str(data.get('user_pairing_code_1'))
    user_pairing_code_2 = str(data.get('user_pairing_code_2'))

    user_1 = User.query.filter_by(user_pairing_code=user_pairing_code_1).first()
    user_2 = User.query.filter_by(user_pairing_code=user_pairing_code_2).first()

    if user_1 and user_2:
        # match the users together and commit to db
        user_1.user_id_matched = user_2.id
        user_2.user_id_matched = user_1.id
        db.session.commit()
        resp = make_response('', 204)

        # publish SSE to the user that made the initial request that the other person accepted and that it was
        # successful.
        sse.publish({"user_code": user_pairing_code_1, "event_name": 'pair_accept'},
                    channel=user_pairing_code_2)

        return resp
    else:
        resp = make_response('', 400)
        return resp


@main.route('/get_card', methods=['POST'])
def get_card():
    gmaps = googlemaps.Client(key=current_app.config['GOOGLE_API_KEY'])
    data = ast.literal_eval(request.data.decode("utf-8"))
    lat = str(data.get('lat'))
    lng = str(data.get('lng'))
    # check places table first
    user = User.get_user_id_by_pairing_code(session['user_pairing_code'])
    place = Place.get_nearby_place(user.id, lat, lng, 5)
    if place:
        UserPlace.insert_user_place(user.id, place['id'])
        place_json = json.loads(place['json_string'])
        photo_array = []
        for idx, photo_item in enumerate(place_json['photos'][:4]):
            photo_array.append({'photo_url_' + str(idx) : photo_item['photo_url']})

        price_level = ''
        if 'price_level' in place_json:
            price_level = place_json['price_level']

        rating = ''
        if 'rating' in place_json:
            rating = place_json['rating']

        d = {'distance': str(floor(place['distance'])),
             'name': place_json['name'],
             'restaurant_type': place_json['restaurant_type'],
             'restaurant_description': place_json['restaurant_description'],
             'price_level': price_level,
             'rating': rating,
             'user_ratings_total': place_json['user_ratings_total'],
             'photo_urls': photo_array}
        return d
    else:
        # no nearby restaurants in the database. go gather some data from google.
        # basic idea for how to implement this: return the first two results (need to handle this with the push()
        # command in carousel.js. So call the /api/place/nearbysearch, loop through the first two and get
        # details/photos, then make the remaining 18 (or whatever the # is) a celery task. these should be
        # in the database by the time the user has swiped through a few cards and easy to request.
        r = gmaps.places_nearby(location=(lat, lng),
                            open_now=True,
                                radius=8000,
                                type='restaurant')
        for item in r['results']:
            # merge places API result with details request
            merged_json = item
            detail_r = gmaps.place(item['place_id'])

            detail_item = detail_r['result']

            for key in detail_item:
                if not key in merged_json:
                    merged_json[key] = detail_item[key]

            # google maps places photo API returns a photo. just building the URL and then pre-loading
            # images on the javascript side.
            for photo_item in detail_item['photos']:
                photo_item['photo_url'] = 'https://maps.googleapis.com/maps/api/place/photo?maxwidth=640&maxheight=640&photoreference= ' \
                                          + photo_item['photo_reference'] \
                                          + '&key=' + current_app.config['GOOGLE_API_KEY']
            merged_json['photos'] = detail_item['photos']

            #get restaurant type/description from URL from the API (this info isn't available in API currently).
            req = requests.get(detail_item['url']).text

            split = req.split(r'\",null,[\"', 1)#[1]  # prefix r is string literal
            if split.__len__() == 1:
                restaurant_type = ''
            else:
                split = split[1]
                restaurant_type = split.split('\"', 1)[0]
                restaurant_type = restaurant_type.replace('\\\\u0026', '&')
                restaurant_type = restaurant_type.replace('\\', '')
                restaurant_type = restaurant_type.title()

            merged_json['restaurant_type'] = restaurant_type

            split = req.split(r'\n,[null,\"', 1)  # prefix r is string literal
            if split.__len__() == 1:
                restaurant_description = ''
            else:
                split = split[1]
                restaurant_description = split.split('\"', 1)[0]
                restaurant_description = restaurant_description.replace('\\\\u0026', '&')
                restaurant_description = restaurant_description.replace('\\', '')

            merged_json['restaurant_description'] = restaurant_description

            Place.insert_place(item['place_id'], item['geometry']['location']['lat'],
                               item['geometry']['location']['lng'],
                               json.dumps(merged_json))
