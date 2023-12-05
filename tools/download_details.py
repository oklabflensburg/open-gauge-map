#!./venv/bin/python

import re
import json
import click
import httpx

from dotenv import load_dotenv
from datetime import datetime
from pathlib import Path


data_directory = Path('../data')

env_path = Path('../.env')
load_dotenv(dotenv_path=env_path)


def replace_umlauts(string):
    content = string

    tpl = (('ü', 'ue'), ('Ü', 'Ue'), ('ä', 'ae'), ('Ä', 'Ae'), ('ö', 'oe'), ('Ö', 'Oe'), ('ß', 'ss'))

    for item1, item2 in tpl:
        content = content.replace(item1, item2)

    return content


def request_station(uuid, station):
    url = f'https://www.pegelonline.wsv.de/webservices/rest-api/v2/stations/{uuid}/W/measurements.json?start=P31D'

    r = httpx.get(url, timeout=20)

    if r.status_code != httpx.codes.OK:
        return

    start_timestamp = r.json()[0]['timestamp']
    start_isodate = datetime.fromisoformat(start_timestamp)
    start_date = start_isodate.strftime('%d-%B-%Y').lower()

    end_timestamp = r.json()[-1]['timestamp']
    end_isodate = datetime.fromisoformat(end_timestamp)
    end_date = end_isodate.strftime('%d-%B-%Y').lower()

    dst = Path(f'../data/{station}-{start_date}-{end_date}.json')
    print(dst)

    with open(dst, 'w') as f:
        json.dump(r.json(), f, ensure_ascii=False)


def read_data(filename):
    with open(filename, 'r') as f:
        d = json.loads(f.read())

    return d


@click.command()
@click.argument('file')
def main(file):
    d = read_data(file)

    for i in d['features']:
        uuid = i['properties']['uuid']
        name = i['properties']['shortname']
        station = re.sub(r'\s+', ' ', replace_umlauts(name.lower())).replace(' ', '-')

        request_station(uuid, station)


if __name__ == '__main__':
    main()
