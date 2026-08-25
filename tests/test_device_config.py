import asyncio
from types import SimpleNamespace

import pytest
import torch
from pydantic import ValidationError

from cattle_net import main
from cattle_net.classifier import choose_device
from cattle_net.config import Settings


def test_settings_default_to_cpu(monkeypatch):
    monkeypatch.delenv("MODEL_DEVICE", raising=False)

    project_settings = Settings(_env_file=None)

    assert project_settings.model_device == "cpu"
    assert project_settings.database_url == "sqlite+aiosqlite:///./cattle-net.db"


def test_settings_reads_model_device_from_environment(monkeypatch):
    monkeypatch.setenv("MODEL_DEVICE", "cuda")

    project_settings = Settings(_env_file=None)

    assert project_settings.model_device == "cuda"


@pytest.mark.parametrize("device_name", ["cpu", "cuda"])
def test_settings_accept_supported_devices(device_name):
    project_settings = Settings(_env_file=None, model_device=device_name)

    assert project_settings.model_device == device_name


def test_settings_reject_unsupported_device():
    with pytest.raises(ValidationError):
        Settings(_env_file=None, model_device="gpu")


def test_choose_device_cpu_without_checking_cuda(monkeypatch):
    cuda_checked = False

    def unavailable() -> bool:
        nonlocal cuda_checked
        cuda_checked = True
        return False

    monkeypatch.setattr(torch.cuda, "is_available", unavailable)

    device = choose_device("cpu")

    assert device == torch.device("cpu")
    assert cuda_checked is False


def test_choose_device_cuda_when_available(monkeypatch):
    monkeypatch.setattr(torch.cuda, "is_available", lambda: True)

    assert choose_device("cuda") == torch.device("cuda")


def test_choose_device_cuda_when_unavailable(monkeypatch):
    monkeypatch.setattr(torch.cuda, "is_available", lambda: False)

    with pytest.raises(RuntimeError, match="CUDA was selected"):
        choose_device("cuda")


def test_choose_device_rejects_unsupported_value():
    with pytest.raises(ValueError, match="Unsupported model device"):
        choose_device("gpu")


def test_lifespan_passes_configured_device(monkeypatch):
    received = {}

    class FakeClassifier:
        device = "cpu"

        def __init__(self, device: str) -> None:
            received["device"] = device

    class FakeEngine:
        def __init__(self) -> None:
            self.disposed = False

        async def dispose(self) -> None:
            self.disposed = True

    fake_engine = FakeEngine()
    monkeypatch.setattr(main, "CattleClassifier", FakeClassifier)
    monkeypatch.setattr(main, "engine", fake_engine)
    monkeypatch.setattr(main.settings, "model_device", "cpu")
    app = SimpleNamespace(state=SimpleNamespace())

    async def exercise() -> None:
        async with main.lifespan(app):
            assert received["device"] == "cpu"

    asyncio.run(exercise())

    assert fake_engine.disposed is True
