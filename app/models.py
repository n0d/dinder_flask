from .database import SurrogatePK
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


# places that user swiped right on.
class UserPlace(SurrogatePK, db.Model):
    __tablename__ = 't_user_place'
    user_id = db.Column(db.Integer, db.ForeignKey('t_user.id'), nullable=True)
    gmaps_place_id = db.Column(db.String(255))

    @staticmethod
    def insert_user_place(user_pairing_code, gmaps_place_id):
        user_place = UserPlace(
            user_pairing_code=user_pairing_code,
            gmaps_place_id=gmaps_place_id
        )
        db.session.add(user_place)
        db.session.commit()
