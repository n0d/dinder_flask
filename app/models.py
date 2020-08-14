from .database import SurrogatePK
from . import db


class User(SurrogatePK, db.Model):
    __tablename__ = 't_user'
    user_pairing_code = db.Column(db.String(16), unique=True, index=True)
    session_id = db.Column(db.String(255), db.ForeignKey('t_session.session_id'), nullable=True)
    # home_address_id = db.Column(db.Integer, db.ForeignKey('t_address.id'), nullable=True)
    user_id_matched = db.Column(db.Integer, db.ForeignKey('t_user.id'), nullable=True)

    @staticmethod
    def insert_user(user_pairing_code,
                    session_id):
        user = User(user_pairing_code=user_pairing_code,
                    session_id=session_id)
        db.session.add(user)
        db.session.commit()


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
