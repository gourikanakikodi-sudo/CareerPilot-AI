from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('roadmap', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='learningroadmap',
            name='weeks_count',
            field=models.PositiveSmallIntegerField(default=8),
        ),
    ]
