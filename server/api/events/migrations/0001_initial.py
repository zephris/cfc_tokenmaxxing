from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="Event",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("source_id", models.PositiveIntegerField(unique=True)),
                ("title", models.CharField(max_length=255)),
                ("starts_at", models.DateTimeField(db_index=True)),
                ("ends_at", models.DateTimeField(db_index=True)),
                ("venue", models.CharField(blank=True, max_length=255)),
                ("address", models.CharField(blank=True, max_length=500)),
                ("summary", models.TextField(blank=True)),
                ("cost", models.CharField(blank=True, max_length=100)),
                ("latitude", models.FloatField(blank=True, null=True)),
                ("longitude", models.FloatField(blank=True, null=True)),
                ("source_url", models.URLField(max_length=500)),
                ("source_updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={"db_table": "event", "ordering": ["starts_at", "source_id"]},
        ),
    ]
