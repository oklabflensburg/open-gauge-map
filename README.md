# Wasserstände der Ostseeküste

> Geographische Darstellung der Pegel Wasserstände an der Ostseeküste in Deutschland


## Gather informations

```
cd tools
python3 -m venv venv 
source venv/bin/activate
pip3 install -r requirements.txt
python3 download_stations.py 'https://www.pegelonline.wsv.de/webservices/rest-api/v2/stations.json?waters=OSTSEE'
python3 download_details.py ../static/stations-ostsee.geojson
deactivate
```


---


## How to Contribute

Contributions are welcome! Please refer to the [CONTRIBUTING.md](CONTRIBUTING.md) guide for details on how to get involved.


---


## License

This repository is licensed under [CC0-1.0](LICENSE).
