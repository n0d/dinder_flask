import ast
from flask import render_template, redirect, session, make_response, request, jsonify, current_app
from flask_sse import sse
import json
from . import main
from ..models import User, Place, UserPlace, LatLngPositionAndPageToken
import googlemaps
import requests
from math import floor
from app import celery


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

    # clear t_user_place table for the user
    UserPlace.delete_user_place_without_swipe_for_user_id(user.id)
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
        resp = make_response('', 404)
        return resp


# user requested to unpair with currently paired user
@main.route('/unpair_request', methods=['POST'])
def unpair_request():
    data = ast.literal_eval(request.data.decode("utf-8"))
    user_code = str(data.get('user_pairing_code')).upper()
    user = User.query.filter_by(user_pairing_code=user_code).first()
    user_paired = User.query.filter_by(id=user.user_id_matched).first()

    User.unpair_user_ids(user, user_paired)

    sse.publish({"user_code": user_code, "event_name": 'unpair_request'},
                channel=user_paired.user_pairing_code)

    return make_response('', 204)


# user receives request and hits "pair" button on the pair overlay screen.
@main.route('/pair_accept', methods=['POST'])
def pair_accept():
    data = ast.literal_eval(request.data.decode("utf-8"))

    user_pairing_code_1 = str(data.get('user_pairing_code_1'))
    user_pairing_code_2 = str(data.get('user_pairing_code_2'))

    user_1 = User.query.filter_by(user_pairing_code=user_pairing_code_1).first()
    user_2 = User.query.filter_by(user_pairing_code=user_pairing_code_2).first()

    if user_1 and user_2:
        User.pair_user_ids(user_1, user_2)

        # clear t_user_place table for the user
        UserPlace.delete_all_user_place_for_user_id(user_1.id)
        UserPlace.delete_all_user_place_for_user_id(user_2.id)

        resp = make_response('', 204)

        # publish SSE to the user that made the initial request that the other person accepted and that it was
        # successful.
        sse.publish({"user_code": user_pairing_code_1, "event_name": 'pair_accept'},
                    channel=user_pairing_code_2)

        return resp
    else:
        resp = make_response('', 400)
        return resp


#look in local database for nearby places.
def get_places(user, lat, lng, num_results, str_gmaps_place_ids_in_client_stack):
    result_array = []
    place_array = Place.get_nearby_place(
        user_id=user.id,
        lat=lat,
        lng=lng,
        within_x_miles=5,
        num_results=num_results,
        str_gmaps_place_ids_in_client_stack=str_gmaps_place_ids_in_client_stack)
    if place_array:
        for place in place_array:
            user_place = UserPlace.get_user_place_by_user_id_and_place_id(user.id, place['id'])
            if not user_place:
                UserPlace.insert_user_place(user.id, place['id'])

            place_json = json.loads(place['json_string'])
            photo_array = []
            for idx, photo_item in enumerate(place_json['photos'][:4]):
                photo_array.append({'photo_url_' + str(idx): photo_item['photo_url']})

            price_level = ''
            if 'price_level' in place_json:
                price_level = place_json['price_level']

            rating = ''
            if 'rating' in place_json:
                rating = place_json['rating']

            result_array.append({
                'gmaps_place_id': str(place['gmaps_place_id']),
                'distance': str(floor(place['distance'])),
                'name': place_json['name'],
                'restaurant_type': place_json['restaurant_type'],
                'restaurant_description': place_json['restaurant_description'],
                'price_level': price_level,
                'rating': rating,
                'user_ratings_total': place_json['user_ratings_total'],
                'photo_urls': photo_array,
                'url': place_json['url']
            })

    return result_array


@celery.task()
def insert_to_db_async(items, google_api_key):
    gmaps = googlemaps.Client(key=google_api_key)
    for item in items:
        get_place_details_and_insert_to_db(gmaps, item, google_api_key)


@main.route('/get_cards', methods=['POST'])
def get_cards():
    gmaps = googlemaps.Client(key=current_app.config['GOOGLE_API_KEY'])
    data = ast.literal_eval(request.data.decode("utf-8"))
    lat = str(data.get('lat'))
    lng = str(data.get('lng'))
    num_cards = int(data.get('num_cards'))
    gmaps_place_ids_in_client_stack = data.get('gmaps_place_ids_in_client_stack')
    str_gmaps_place_ids_in_client_stack = ''

    if not gmaps_place_ids_in_client_stack:
        str_gmaps_place_ids_in_client_stack = "''" #at app start, NOT IN ('')
    else:
        if gmaps_place_ids_in_client_stack:
            for place_id in gmaps_place_ids_in_client_stack:
                str_gmaps_place_ids_in_client_stack += "'" + place_id + "',"
            str_gmaps_place_ids_in_client_stack = str_gmaps_place_ids_in_client_stack.rstrip(',')

    # check places table first
    result_array = []
    user = User.get_user_id_by_pairing_code(session['user_pairing_code'])
    result_array = get_places(user, lat, lng, num_cards, str_gmaps_place_ids_in_client_stack)
    if result_array and len(result_array) == num_cards:
        return jsonify(result_array)
    else:
        # if getting new results from google, logic is: get next 20, save the first 2 locally and return them,
        # and process the next 18 async.
        # get most recent page_token for these coordinates (if applicable) to get next set of data.
        # *note* lat/lng doesn't change in real time on the client side currently, its set when they start up the app.
        page_token = ''
        lat_lng_page_token = LatLngPositionAndPageToken.get_page_token_by_lat_lng(lat, lng)
        if lat_lng_page_token and lat_lng_page_token.is_final_page_token:
            if result_array:
                return jsonify(result_array)
            else:
                resp = make_response('', 204)
                return resp

        elif lat_lng_page_token:
            page_token = lat_lng_page_token.page_token

        response = gmaps.places_nearby(location=(lat, lng),
                                       open_now=True,
                                       radius=8000,  # 8000 meters, ~5 miles
                                       type='restaurant',
                                       page_token=page_token
                                       )

        if 'next_page_token' in response:
            LatLngPositionAndPageToken.insert_or_update_page_token(lat, lng, response['next_page_token'], False)
        else:
            LatLngPositionAndPageToken.insert_or_update_page_token(lat, lng, None, True)

        for item in response['results'][:num_cards-len(result_array)]:  # first x
            get_place_details_and_insert_to_db(gmaps, item, current_app.config['GOOGLE_API_KEY'])

        insert_to_db_async.delay(response['results'][num_cards-len(result_array):], current_app.config['GOOGLE_API_KEY'])

        place = get_places(user, lat, lng, num_cards - len(result_array))

        if place:
            result_array.append(place)

        if result_array:
            return jsonify(result_array)
        else:
            resp = make_response('', 204)
            return resp


# merge places API result with details request
def get_place_details_and_insert_to_db(gmaps, item, google_api_key):
    merged_json = item
    detail_response = gmaps.place(item['place_id'])

    detail_item = detail_response['result']

    for key in detail_item:
        if not key in merged_json:
            merged_json[key] = detail_item[key]

    # google maps places photo API returns a photo. just building the URL and then pre-loading
    # images on the javascript side.
    for photo_item in detail_item['photos']:
        photo_item[
            'photo_url'] = 'https://maps.googleapis.com/maps/api/place/photo?maxwidth=700&maxheight=700&photoreference= ' \
                           + photo_item['photo_reference'] \
                           + '&key=' + google_api_key
    merged_json['photos'] = detail_item['photos']

    # get restaurant type/description from URL from the API (this info isn't available in API currently).
    req = requests.get(detail_item['url']).text

    split = req.split(r'\",null,[\"', 1)  # [1]  # prefix r is string literal
    if split.__len__() == 1:
        restaurant_type = ''
    else:
        split = split[1]
        restaurant_type = split.split('\"', 1)[0]
        restaurant_type = restaurant_type.replace('\\\\u0026', '&')
        restaurant_type = restaurant_type.replace('\\', '')
        restaurant_type = restaurant_type.title()

    if not restaurant_type:
        restaurant_type = 'Restaurant'

    merged_json['restaurant_type'] = restaurant_type

    split = req.split(r'\n,[null,\"', 1)  # prefix r is string literal
    if split.__len__() == 1:
        restaurant_description = ''
    else:
        split = split[1]
        restaurant_description = split.split('\"', 1)[0]
        restaurant_description = restaurant_description.replace('\\\\u0026', '&')
        restaurant_description = restaurant_description.replace('\\', '')

    if not restaurant_description:
        restaurant_description = 'No description available.'

    merged_json['restaurant_description'] = restaurant_description

    Place.insert_place(item['place_id'], item['geometry']['location']['lat'],
                       item['geometry']['location']['lng'],
                       json.dumps(merged_json))


# user has swiped left/right on a restaurant. post the swipe action to the DB and check
# if there is a match with their paired user.
@main.route('/post_swipe', methods=['POST'])
def post_swipe():
    data = ast.literal_eval(request.data.decode("utf-8"))
    is_swipe_right = data.get('is_swipe_right')
    if is_swipe_right == 0:
        is_swipe_right = False
    else:
        is_swipe_right = True

    gmaps_place_id = str(data.get('gmaps_place_id'))
    user = User.get_user_id_by_pairing_code(session['user_pairing_code'])

    place = Place.get_place_by_gmaps_place_id(gmaps_place_id=gmaps_place_id)
    UserPlace.update_swipe(user_id=user.id, place_id=place.id, is_swipe_right=is_swipe_right)

    # check if matched user also swiped right on the same restaurant.
    if is_swipe_right:
        # need to pass place name and first photo URL.
        place_json = json.loads(place.json_string)

        photo_url = 'https://maps.googleapis.com/maps/api/place/photo?maxwidth=700&maxheight=700&photoreference= ' \
                    + place_json['photos'][0]['photo_reference'] \
                    + '&key=' + current_app.config['GOOGLE_API_KEY']

        if UserPlace.check_if_match_user_swiped_right(user_id_matched=user.user_id_matched,
                                                                     place_id=place.id):
            # publish to user
            sse.publish({'restaurant_name': place_json['name'],
                         'photo_url': photo_url,
                         'google_place_url': place_json['url'],
                         'event_name': 'match'},
                        channel=user.user_pairing_code)

            # publish to matched user
            user_matched = User.get_by_id(user.user_id_matched)
            sse.publish({'restaurant_name': place_json['name'],
                         'photo_url': photo_url,
                         'google_place_url': place_json['url'],
                         'event_name': 'match'},
                        channel=user_matched.user_pairing_code)
            resp = make_response('', 204)
            return resp
        else:
            resp = make_response(jsonify(restaurant_name=place_json['name'],
                                         photo_url=photo_url,
                                         url=place_json['url'])
                                 , 200)
            return resp
    resp = make_response('', 204)
    return resp
