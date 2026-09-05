# Backend server

A template Django server.

1. Install dependencies: `poetry install` if not in dev container
2. Run: `python manage.py runserver` or `.\dev.sh`

## Map data

The map reads Bush Forever polygons and community events from PostgreSQL. After starting
the database, create the tables and import the public source data:

```shell
python manage.py migrate
python manage.py import_bushlands
python manage.py import_events
```

`import_bushlands` combines the Bush Forever 2000 DataWA GeoJSON polygons with the
official Bush Forever site-name index. `import_events` refreshes upcoming events from the
Urban Bushland Council WordPress REST API. Both commands update existing rows by their
source IDs, so they can be run again safely.

Note this file needs to be here otherwise poetry won't recognise this as a valid project.
