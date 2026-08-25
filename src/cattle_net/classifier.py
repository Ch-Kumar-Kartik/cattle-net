import json
from dataclasses import dataclass
from pathlib import Path

import torch
from PIL import Image
from torch import nn
from torchvision import models, transforms

PROJECT_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_CHECKPOINT_PATH = PROJECT_ROOT / "artifacts" / "cattle_resnet18_v1.pth"
DEFAULT_CLASSES_PATH = PROJECT_ROOT / "artifacts" / "classes.json"
EXPECTED_CLASS_COUNT = 8
TOP_PREDICTION_COUNT = 3
MODEL_VERSION = "v1"


@dataclass(frozen=True)
class Prediction:
    label: str
    confidence: float


def load_classes(classes_path: Path) -> list[str]:
    with classes_path.open() as file:
        classes = json.load(file)

    if len(classes) != EXPECTED_CLASS_COUNT:
        raise ValueError(
            f"Expected {EXPECTED_CLASS_COUNT} classes, but found {len(classes)}"
        )

    return classes


def choose_device(device_name: str) -> torch.device:
    if device_name not in {"cpu", "cuda"}:
        raise ValueError(f"Unsupported model device: {device_name}")

    if device_name == "cuda" and not torch.cuda.is_available():
        raise RuntimeError("CUDA was selected but is not available")

    return torch.device(device_name)


def build_model(
    checkpoint_path: Path,
    number_of_classes: int,
    device: torch.device,
) -> nn.Module:
    model = models.resnet18(weights=None)

    model.fc = nn.Sequential(
        nn.Dropout(p=0.3), nn.Linear(model.fc.in_features, number_of_classes)
    )

    state_dict = torch.load(
        checkpoint_path,
        map_location=device,
        weights_only=True,
    )
    model.load_state_dict(state_dict, strict=True)
    model.to(device)
    model.eval()

    return model


INFERENCE_TRANSFORM = transforms.Compose(
    [
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize(
            mean=[0.485, 0.456, 0.406],
            std=[0.229, 0.224, 0.225],
        ),
    ]
)


class CattleClassifier:
    def __init__(
        self,
        checkpoint_path: Path = DEFAULT_CHECKPOINT_PATH,
        classes_path: Path = DEFAULT_CLASSES_PATH,
        device: str = "cpu",
    ) -> None:
        self.device = choose_device(device)
        self.model_version = MODEL_VERSION
        self.classes = load_classes(classes_path)
        self.model = build_model(
            checkpoint_path=checkpoint_path,
            number_of_classes=len(self.classes),
            device=self.device,
        )

    def predict(self, image: Image.Image) -> list[Prediction]:
        rgb_image = image.convert("RGB")
        image_tensor = INFERENCE_TRANSFORM(rgb_image).unsqueeze(0)
        image_tensor = image_tensor.to(self.device)

        with torch.inference_mode():
            logits = self.model(image_tensor)
            probabilities = torch.softmax(logits, dim=1)
            top_probabilities, top_indices = torch.topk(
                probabilities,
                k=TOP_PREDICTION_COUNT,
                dim=1,
            )

        return [
            Prediction(
                label=self.classes[class_index],
                confidence=float(probability),
            )
            for class_index, probability in zip(
                top_indices[0].cpu().tolist(),
                top_probabilities[0].cpu().tolist(),
            )
        ]
