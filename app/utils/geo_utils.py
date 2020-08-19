from geopy import distance


def get_distance_from_current_loc_in_miles(curr_lat, curr_lng, dest_lat, dest_lng):
    curr_location = (curr_lat, curr_lng)
    dest_location = (dest_lat, dest_lng)

    return round(distance.distance(curr_location, dest_location).miles, 1)
