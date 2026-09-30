"""Fetch the Google rating and review count for Gold Class Head Spa Chermside
and write them to data/google-rating.json. Run daily by GitHub Actions.

Needs the GOOGLE_PLACES_API_KEY secret (Google Places API (New) enabled).
Optional GOOGLE_PLACE_ID secret; without it the place is found by text search.
"""
import datetime
import json
import os
import sys
import urllib.request

KEY = os.environ.get("GOOGLE_PLACES_API_KEY", "").strip()
PLACE_ID = os.environ.get("GOOGLE_PLACE_ID", "").strip()
OUT = os.path.join(os.path.dirname(__file__), "..", "data", "google-rating.json")
QUERY = "Gold Class Head Spa Chermside, Westfield Chermside QLD 4032"


def call(url, body=None, fields=""):
    headers = {"X-Goog-Api-Key": KEY, "X-Goog-FieldMask": fields}
    data = None
    if body is not None:
        headers["Content-Type"] = "application/json"
        data = json.dumps(body).encode()
    req = urllib.request.Request(url, data=data, headers=headers)
    with urllib.request.urlopen(req, timeout=30) as res:
        return json.load(res)


def fetch_place():
    if PLACE_ID:
        return call(f"https://places.googleapis.com/v1/places/{PLACE_ID}",
                    fields="id,displayName,rating,userRatingCount")
    found = call("https://places.googleapis.com/v1/places:searchText",
                 body={"textQuery": QUERY, "regionCode": "AU"},
                 fields="places.id,places.displayName,places.rating,places.userRatingCount")
    for p in found.get("places", []):
        name = p.get("displayName", {}).get("text", "").lower()
        if "gold class" in name and "chermside" in name:
            return p
    raise SystemExit(f"Chermside listing not found in search results: {found}")


def main():
    if not KEY:
        sys.exit("GOOGLE_PLACES_API_KEY is not set")
    place = fetch_place()
    rating, count = place.get("rating"), place.get("userRatingCount")
    if rating is None or not count:
        sys.exit(f"No rating data returned: {place}")
    with open(OUT) as f:
        current = json.load(f)
    new = {
        "rating": f"{float(rating):.1f}",
        "reviewCount": int(count),
        "updated": datetime.date.today().isoformat(),
        "source": "google-places",
        "placeId": place.get("id", PLACE_ID),
    }
    if (current.get("rating"), current.get("reviewCount")) == (new["rating"], new["reviewCount"]):
        print(f"No change: {new['rating']} from {new['reviewCount']} reviews")
        return
    with open(OUT, "w") as f:
        json.dump(new, f, indent=2)
        f.write("\n")
    print(f"Updated: {new['rating']} from {new['reviewCount']} reviews")


if __name__ == "__main__":
    main()
