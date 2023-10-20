#!./venv/bin/python

import os
import re
import json
import click
import httpx

from dotenv import load_dotenv
from urllib.parse import urlparse
from geojson import FeatureCollection, Feature, Point
from pathlib import Path


data_directory = Path('../data')

env_path = Path('../.env')
load_dotenv(dotenv_path=env_path)


def request_json(url, data_directory):
    parsed = urlparse(url)
    file_object = dict()

    apendix = ''
    filename = ''.join(url.split('/')[-1].split('.')[:-1])
    fileparams = parsed.query.split('&')

    for index, param in enumerate(fileparams):
        key = param.split('=')[0]
        val = param.split('=')[1]

        if key == 'waters':
            apendix = f'-{val.lower()}'
            break

    extension = ''.join(url.split('/')[-1].split('.')[-1].split('?')[:-1])
    filename = f'{filename}{apendix}'
    target = f'{data_directory}/{filename}.{extension}'

    file_object.update({
        'name': filename,
        'extension': extension,
        'target': target
    })

    r = httpx.get(url, timeout=20)

    with open(file_object['target'], 'wb') as f:
        f.write(r.content)

    return file_object


def get_data(filename):
    with open(filename, 'r') as f:
        d = json.loads(f.read())

    return d


def make_geojson(target, filename, data):
    path = Path(f'../static/{filename}.geojson')
    f = target
    fc = []

    crs = { 
        'type': 'name',
        'properties': {
            'name': 'urn:ogc:def:crs:OGC:1.3:CRS84'
        }
    }   

    for o in data:
        point = Point((float(o['longitude']), float(o['latitude'])))

        properties = {
            'uuid': o['uuid'],
            'number': int(o['number']),
            'shortname': o['shortname'].title(),
            'longname': o['longname'].title()
        }

        fc.append(Feature(geometry=point, properties=properties))

    c = FeatureCollection(fc, name=f'{filename}', crs=crs)

    with open(path, 'w') as f:
        json.dump(c, f, ensure_ascii=False)


@click.command()
@click.argument('url')
def main(url):
    file_object = request_json(url, data_directory)
    dest = f'{data_directory}/{file_object["name"]}.{file_object["extension"]}'

    d = get_data(file_object['target'])
    make_geojson(file_object['target'], file_object['name'], d)

    aa = []

    for i in d:
        aa.append(i)

    with open(dest, 'w') as f:
        json.dump(aa, f)


if __name__ == '__main__':
    main()
