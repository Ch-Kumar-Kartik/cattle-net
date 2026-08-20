import asyncio
from io import BytesIO
from types import SimpleNamespace

import pytest
from fastapi import FastAPI, HTTPException, Request
from PIL import Image

from cattle_net.routes import MAX_UPLOAD_BYTES, create_prediction, health_check, router


class FakeClassifier:
    device = "cuda"
    model_version = "v1"

    def __init__(self) -> None:
        self.received_image = None

    def predict(self, image: Image.Image):
        self.received_image = image
        return [
            SimpleNamespace(label="LOCAL", confidence=0.8),
            SimpleNamespace(label="SINDHI", confidence=0.1),
            SimpleNamespace(label="BRAHMA", confidence=0.05),
        ]


class FakeUpload:
    def __init__(self, content: bytes, content_type: str) -> None:
        self.content = content
        self.content_type = content_type

    async def read(self) -> bytes:
        return self.content


@pytest.fixture
def app_and_classifier():
    app = FastAPI()
    app.include_router(router)

    classifier = FakeClassifier()
    app.state.cattle_classifier = classifier

    return app, classifier


def make_request(app: FastAPI):
    return Request({"type": "http", "app": app})


def make_upload(content: bytes, content_type: str) -> FakeUpload:
    return FakeUpload(content, content_type)


def make_image_bytes() -> bytes:
    image = Image.new("RGB", (32, 24), color="green")
    image_bytes = BytesIO()
    image.save(image_bytes, format="PNG")
    return image_bytes.getvalue()


def test_health_returns_classifier_metadata(app_and_classifier):
    app, _ = app_and_classifier

    response = health_check(make_request(app))

    assert response.model_dump() == {
        "status": "ok",
        "classifier_loaded": True,
        "device": "cuda",
        "model_version": "v1",
    }


def test_prediction_returns_top_three_and_passes_pil_image(
    app_and_classifier,
):
    app, classifier = app_and_classifier
    upload = make_upload(make_image_bytes(), "image/png")

    response = asyncio.run(create_prediction(make_request(app), upload))

    assert response.model_dump() == {
        "predictions": [
            {"breed": "LOCAL", "confidence": 0.8},
            {"breed": "SINDHI", "confidence": 0.1},
            {"breed": "BRAHMA", "confidence": 0.05},
        ]
    }
    assert isinstance(classifier.received_image, Image.Image)


def test_prediction_rejects_unsupported_mime_type(app_and_classifier):
    app, _ = app_and_classifier
    upload = make_upload(b"not an image", "text/plain")

    with pytest.raises(HTTPException) as error:
        asyncio.run(create_prediction(make_request(app), upload))

    assert error.value.status_code == 415


def test_prediction_rejects_empty_file(app_and_classifier):
    app, _ = app_and_classifier
    upload = make_upload(b"", "image/png")

    with pytest.raises(HTTPException) as error:
        asyncio.run(create_prediction(make_request(app), upload))

    assert error.value.status_code == 400


def test_prediction_rejects_file_over_five_megabytes(app_and_classifier):
    app, _ = app_and_classifier
    upload = make_upload(b"0" * (MAX_UPLOAD_BYTES + 1), "image/png")

    with pytest.raises(HTTPException) as error:
        asyncio.run(create_prediction(make_request(app), upload))

    assert error.value.status_code == 400


def test_prediction_rejects_invalid_image_bytes(app_and_classifier):
    app, _ = app_and_classifier
    upload = make_upload(b"not an image", "image/png")

    with pytest.raises(HTTPException) as error:
        asyncio.run(create_prediction(make_request(app), upload))

    assert error.value.status_code == 400
