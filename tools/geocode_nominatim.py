import csv, json, time, pathlib, urllib.parse, sys
from urllib.request import urlopen, Request

BASE_URL = "https://nominatim.openstreetmap.org/search"
USER_AGENT = "VeganPlacesGeocoder/1.0 (contact: example@example.com)"
INPUT = pathlib.Path(__file__).parent.parent / "places.csv"
CACHE_FILE = pathlib.Path(__file__).parent / "geocode_cache.json"
OUTPUT = pathlib.Path(__file__).parent / "places_with_coords.csv"
SLEEP_SECONDS = 1.2  # be polite to Nominatim

# Which rows to geocode: if lat or lng empty

def load_cache():
    if CACHE_FILE.exists():
        return json.loads(CACHE_FILE.read_text(encoding='utf-8'))
    return {}


def save_cache(cache):
    CACHE_FILE.write_text(json.dumps(cache, ensure_ascii=False, indent=2), encoding='utf-8')


def geocode(query, cache):
    if query in cache:
        return cache[query]
    params = {
        'q': query,
        'format': 'json',
        'limit': 1,
        'accept-language': 'he'
    }
    url = BASE_URL + '?' + urllib.parse.urlencode(params)
    req = Request(url, headers={'User-Agent': USER_AGENT})
    with urlopen(req, timeout=20) as resp:
        data = json.loads(resp.read().decode('utf-8'))
    if data:
        item = data[0]
        cache[query] = {'lat': float(item['lat']), 'lng': float(item['lon'])}
        save_cache(cache)
        return cache[query]
    cache[query] = None
    save_cache(cache)
    return None


def main():
    cache = load_cache()
    rows_out = []
    with INPUT.open(encoding='utf-8') as f:
        reader = csv.reader(f)
        header = next(reader)
        # Expect header already has lat,lng at end
        rows_out.append(header)
        name_idx = header.index('name')
        addr_idx = header.index('address')
        lat_idx = header.index('lat')
        lng_idx = header.index('lng')
        for row in reader:
            if len(row) < lng_idx+1:
                # pad
                while len(row) < lng_idx+1:
                    row.append('')
            name = row[name_idx].strip().strip('"')
            address = row[addr_idx].strip().strip('"')
            lat_val = row[lat_idx].strip()
            lng_val = row[lng_idx].strip()
            if lat_val and lng_val:
                rows_out.append(row)
                continue
            query = f"{address}, ישראל"
            print(f"Geocoding: {query}")
            try:
                result = geocode(query, cache)
            except Exception as e:
                print("Error:", e, file=sys.stderr)
                result = None
            if result:
                row[lat_idx] = f"{result['lat']:.6f}"
                row[lng_idx] = f"{result['lng']:.6f}"
                print(f"  -> {row[lat_idx]}, {row[lng_idx]}")
            else:
                print("  -> NOT FOUND")
            rows_out.append(row)
            time.sleep(SLEEP_SECONDS)
    with OUTPUT.open('w', encoding='utf-8', newline='') as f_out:
        writer = csv.writer(f_out)
        writer.writerows(rows_out)
    print(f"Written {OUTPUT}")

if __name__ == '__main__':
    main()
