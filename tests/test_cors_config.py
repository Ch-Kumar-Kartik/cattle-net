import pytest
from pydantic import ValidationError

from cattle_net.config import DEFAULT_CORS_ALLOWED_ORIGINS, Settings


def test_cors_origins_default_to_local_nextjs_origins():
    project_settings = Settings(_env_file=None)

    assert project_settings.cors_allowed_origins == DEFAULT_CORS_ALLOWED_ORIGINS
    assert project_settings.cors_origins == [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]


def test_cors_origins_parse_a_comma_separated_list():
    project_settings = Settings(
        _env_file=None,
        cors_allowed_origins=" https://app.example.com, https://admin.example.com ",
    )

    assert project_settings.cors_origins == [
        "https://app.example.com",
        "https://admin.example.com",
    ]


@pytest.mark.parametrize("origins", ["", "*"])
def test_cors_origins_reject_empty_or_wildcard_values(origins):
    with pytest.raises(ValidationError):
        Settings(_env_file=None, cors_allowed_origins=origins)
