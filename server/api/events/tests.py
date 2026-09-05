from datetime import timedelta

from django.test import TestCase
from django.utils import timezone

from .models import Event


class EventListTests(TestCase):
    def test_returns_future_events_with_map_position(self):
        start = timezone.now().replace(
            hour=10,
            minute=0,
            second=0,
            microsecond=0,
        ) + timedelta(days=2)
        Event.objects.create(
            source_id=20567,
            title="Seed Genetics and Restoration",
            starts_at=start,
            ends_at=start + timedelta(hours=2),
            venue="City West Lotteries House",
            address="2 Delhi Street, West Perth",
            summary="Learn about seed genetics.",
            cost="Free",
            latitude=-31.9455721,
            longitude=115.846509,
            source_url="https://www.bushlandperth.org.au/event/seed-genetics-and-restoration/",
        )

        response = self.client.get("/api/events/")

        self.assertEqual(response.status_code, 200)
        event = response.json()["events"][0]
        self.assertEqual(event["id"], "20567")
        self.assertEqual(event["timeLabel"], "18:00-20:00")
        self.assertEqual(event["position"], [-31.9455721, 115.846509])

    def test_excludes_finished_events(self):
        end = timezone.now() - timedelta(hours=1)
        Event.objects.create(
            source_id=1,
            title="Finished event",
            starts_at=end - timedelta(hours=2),
            ends_at=end,
            source_url="https://www.bushlandperth.org.au/event/finished/",
        )

        response = self.client.get("/api/events/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["events"], [])
