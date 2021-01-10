from .database import SurrogatePK
from sqlalchemy import text, true
from . import db
import random
import string


# generate a unique 4 char code (used to pair users).
# need to check that it doesn't already exist.
def generate_unique_pairing_code():
    while True:
        random_str = ''.join(random.choice(string.ascii_uppercase + string.digits) for _ in range(4))
        user = User.query.filter_by(user_pairing_code=random_str).first()
        if not user:
            return random_str


class User(SurrogatePK, db.Model):
    __tablename__ = 't_user'
    user_pairing_code = db.Column(db.String(16), unique=True, index=True)
    session_id = db.Column(db.String(255), db.ForeignKey('t_session.session_id'), nullable=True)
    # home_address_id = db.Column(db.Integer, db.ForeignKey('t_address.id'), nullable=True)
    user_id_matched = db.Column(db.Integer, db.ForeignKey('t_user.id'), nullable=True)

    @staticmethod
    def insert_user(session_id):
        user_pairing_code = generate_unique_pairing_code()

        user = User(user_pairing_code=user_pairing_code,
                    session_id=session_id)
        db.session.add(user)
        db.session.commit()
        return user

    @staticmethod
    def get_user_id_by_pairing_code(user_pairing_code):
        user = User.query.filter_by(user_pairing_code=user_pairing_code).first()
        return user

    @staticmethod
    def pair_user_ids(user_1, user_2):
        user_1.user_id_matched = user_2.id
        user_2.user_id_matched = user_1.id
        db.session.commit()


class Place(SurrogatePK, db.Model):
    __tablename__ = 't_place'
    gmaps_place_id = db.Column(db.String(255), unique=True)
    json_string = db.Column(db.String(5000))
    lat = db.Column(db.Float)
    lng = db.Column(db.Float)

    @staticmethod
    def insert_place(gmaps_place_id, lat, lng, json_string):
        place = Place(
            gmaps_place_id=gmaps_place_id,
            lat=lat,
            lng=lng,
            json_string=json_string
        )
        # check if place already exists, if so, don't insert.
        if not Place.get_place_by_gmaps_place_id(gmaps_place_id):
            db.session.add(place)
            db.session.commit()

    @staticmethod
    def get_place_by_gmaps_place_id(gmaps_place_id):
        return Place.query.filter_by(gmaps_place_id=gmaps_place_id).first()

    # select from existing places in DB locations that are within x miles.
    # relies on postgres extensions "cube" and "earthdistance".
    # point function parameters are (longitude, latitude).
    @staticmethod
    def get_nearby_place(user_id, lat, lng, within_x_miles, num_results):
        sql_str = 'SELECT id, gmaps_place_id, ROUND(CAST(POINT(lng, lat) <@> POINT(-122.6761, 45.6257) AS NUMERIC), 1) AS distance, json_string ' \
                  'FROM t_place tp ' \
                  'WHERE NOT EXISTS (' \
                      'SELECT 1 ' \
                      'FROM t_user_place tup ' \
                      'WHERE tup.place_id = tp.id ' \
                          'AND tup.user_id = ' + str(user_id) + ') ' \
                                                        'GROUP BY id, gmaps_place_id, lng, lat ' \
                                                        'HAVING (point(lng, lat) <@> point(' + str(lng) + ', ' + str(lat) + ')) < ' + str(within_x_miles) + ' ' \
                                                   'ORDER BY distance ' \
                                                   'LIMIT ' + str(num_results) + ';'

        resultproxy = db.engine.execute(text(sql_str))

        d = {}
        result_array = []
        for rowproxy in resultproxy:
            # rowproxy.items() returns an array like [(key0, value0), (key1, value1)]
            for column, value in rowproxy.items():
                d = {**d, **{column: value}}
            result_array.append(d)
        if not d:
            return []
        else:
            return result_array


# places that user swiped right on.
class UserPlace(SurrogatePK, db.Model):
    __tablename__ = 't_user_place'
    user_id = db.Column(db.Integer, db.ForeignKey('t_user.id'))
    place_id = db.Column(db.Integer, db.ForeignKey('t_place.id'))
    is_swipe_right = db.Column(db.Boolean)

    @staticmethod
    def get_user_place_by_user_id_and_place_id(user_id, place_id):
        return UserPlace.query.filter_by(user_id=user_id, place_id=place_id).first()

    @staticmethod
    def insert_user_place(user_id, place_id):
        user_place = UserPlace(
            user_id=user_id,
            place_id=place_id
        )
        db.session.add(user_place)
        db.session.commit()

    @staticmethod
    def update_swipe(user_id, place_id, is_swipe_right):
        user_place = UserPlace.query.filter_by(user_id=user_id, place_id=place_id).first()
        if user_place:
            user_place.is_swipe_right = is_swipe_right
            db.session.commit()

    @staticmethod
    def check_if_match_user_swiped_right(user_id_matched, place_id):
        return UserPlace.query.filter_by(user_id=user_id_matched, place_id=place_id, is_swipe_right=True).first()

    @staticmethod
    def delete_user_place_without_swipe_for_user_id(user_id):
        UserPlace.query.filter_by(user_id=user_id, is_swipe_right=None).delete()
        db.session.commit()

    @staticmethod
    def delete_all_user_place_for_user_id(user_id):
        UserPlace.query.filter_by(user_id=user_id).delete()
        db.session.commit()


#store lat/lng coordinates along with the next_page_token returned by Google Places API.
class LatLngPositionAndPageToken(SurrogatePK, db.Model):
    __tablename__ = 't_lat_lng_page_token'
    lat = db.Column(db.Float)
    lng = db.Column(db.Float)
    page_token = db.Column(db.String(1000))
    is_final_page_token = db.Column(db.Boolean, default=False)

    @staticmethod
    def get_page_token_by_lat_lng(lat, lng):
        return LatLngPositionAndPageToken.query.filter_by(lat=lat, lng=lng).first()

    @staticmethod
    def insert_or_update_page_token(lat, lng, page_token, is_final_page_token):
        lat_lng_page_token = LatLngPositionAndPageToken.query.filter_by(lat=lat, lng=lng).first()
        if lat_lng_page_token:
            if page_token:
                lat_lng_page_token.page_token = page_token
            if is_final_page_token:
                lat_lng_page_token.is_final_page_token = is_final_page_token
            db.session.commit()
        else:
            lat_lng_page_token = LatLngPositionAndPageToken(
                lat=lat,
                lng=lng,
                page_token=page_token)
            db.session.add(lat_lng_page_token)
            db.session.commit()