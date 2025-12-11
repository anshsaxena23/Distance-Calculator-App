from geopy.geocoders import Nominatim
from geopy import distance
from app.database import SearchHistory
from app.Classes import DistanceCalcRequest
from sqlalchemy import or_

geolocator = Nominatim(user_agent="my_distance_calculator_app")

supportedDistances = ['Kilometers', "Miles", "Both"]
unsupportedErrorString = "Unsupported Character Received for calculating Distances. Acceptable are : {}".format("; ".join(supportedDistances))

def geoCodeLocations(placeName : str):
    # 1. Geocode the locations to get Location objects
    try:
        location = geolocator.geocode(placeName)
        # --- Error Check ---
        
        if not location:
            return False, f"Location could not be geocoded. Input - {placeName}"

        else:
            return True, location
        
    except Exception as e:
        return False, f"Location could not be geocoded due to issue : {repr(e)}."
    
def extractCoordinates(geoCodedLocation):
    # 2. Extract Coordinates
    # Coordinates are returned as a tuple: (latitude, longitude)
    try:
        coords = (geoCodedLocation.latitude, geoCodedLocation.longitude)
        return True, coords
    
    except Exception as e:
        return False, "Unable to extract Coordinates from Location."

def calculateActualDistance(coords_a, coords_b, CoordsType : str, UserID, Place1, Place2, db, precomputed = False, kms = 0, miles = 0):
    # 3. Calculate the Distance
    try:
        if not precomputed:
            calculated_distance = distance.distance(coords_a, coords_b)
            kms = f"{calculated_distance.km:.2f}"
            miles = f"{calculated_distance.miles:.2f}"

        db_searchHistory = SearchHistory(user_id=UserID, Place1=Place1, Place2=Place2, Kilometers = kms, Miles = miles)
        # Add the object to the session
        db.add(db_searchHistory)
        # Commit the transaction to the database
        db.commit()

        if CoordsType == supportedDistances[0]: # Kms Case
            return True, {"result":f"{kms} km"}
        
        elif CoordsType == supportedDistances[1]: # Miles Case
            return True, {"result":f"{miles} mi"}
        
        elif CoordsType == supportedDistances[2]: # Both Case
            return True, {"result":f"{miles} mi {kms} km"}
        
        else:
            return False, unsupportedErrorString
        
    except Exception as e:
        return False, f"Unable to calculate distances between the locations due to issue : {repr(e)}"

def checkResultInDb(db, place1, place2):
    existing_record = db.query(SearchHistory).filter(
    # Use the OR operator to combine the forward and reverse search conditions
        or_(
            # Condition A: Forward Match (Source=place1 AND Destination=place2)
            (SearchHistory.Place1 == place1) & 
            (SearchHistory.Place2 == place2),

            # Condition B: Reverse Match (Source=place2 AND Destination=place1)
            (SearchHistory.Place1 == place2) & 
            (SearchHistory.Place2 == place1)
        )
    ).first()
    if existing_record:
        kms_value = existing_record.Kilometers
        miles_value = existing_record.Miles

        return True, kms_value, miles_value
    
    else:
        return False, 0, 0

def HandleDistanceCalcRequest(distanceCalcRequest : DistanceCalcRequest, user_id : str, db):

    if distanceCalcRequest.Type in supportedDistances:

        precomputed, kms_value, miles_value = checkResultInDb(db, distanceCalcRequest.Place1, distanceCalcRequest.Place2)

        if precomputed:
            Coord1 = 0
            Coord2 = 0
            pass

        else:
            success, Place1 = geoCodeLocations(distanceCalcRequest.Place1)
            
            if not success:
                return {"error":True, "ErrorMessage": Place1}
            
            else:
                success, Coord1 = extractCoordinates(Place1)

                if not success:
                    return {"error":True, "ErrorMessage": Coord1}
            
            success, Place2 = geoCodeLocations(distanceCalcRequest.Place2)
            if not success:
                return {"error":True, "ErrorMessage": Place2}
            
            else:
                success, Coord2 = extractCoordinates(Place2)

                if not success:
                    return {"error":True, "ErrorMessage": Coord2}
                
        success, data = calculateActualDistance(Coord1, Coord2, distanceCalcRequest.Type, user_id, distanceCalcRequest.Place1, distanceCalcRequest.Place2, db, precomputed, kms_value, miles_value)

        if not success:
            return {"error":True, "ErrorMessage": data}
        
        else:
            return {"error":False, "ErrorMessage": "", "data" : data}


    else:
        return {"error":True, "ErrorMessage": unsupportedErrorString}