from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('resume', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='resume',
            name='content_type',
            field=models.CharField(blank=True, default='', max_length=120),
        ),
        migrations.AddField(
            model_name='resume',
            name='display_name',
            field=models.CharField(blank=True, default='', max_length=180),
        ),
        migrations.AddField(
            model_name='resume',
            name='file_size',
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.AddField(
            model_name='resume',
            name='is_active',
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name='resume',
            name='original_filename',
            field=models.CharField(blank=True, default='', max_length=255),
        ),
        migrations.AddField(
            model_name='resume',
            name='updated_at',
            field=models.DateTimeField(auto_now=True),
        ),
        migrations.AddField(
            model_name='resumeanalysis',
            name='detailed_report',
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.AddField(
            model_name='resumeanalysis',
            name='keyword_report',
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.AddField(
            model_name='resumeanalysis',
            name='rewritten_examples',
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name='resumeanalysis',
            name='section_analysis',
            field=models.JSONField(blank=True, default=list),
        ),
    ]
