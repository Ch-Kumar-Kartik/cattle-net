import argparse
import json
import time
from pathlib import Path

import torch
import torch.nn as nn
from PIL import Image
from torchvision import models, transforms


PROJECT_ROOT = Path(__file__).resolve().parents[1]

DEFAULT_CHECKPOINT_PATH = (
    PROJECT_ROOT / "artifacts" / "cattle_resnet18_v1.pth"
)

DEFAULT_CLASSES_PATH = (
    PROJECT_ROOT / "artifacts" / "classes.json"
)


def load_classes(classes_path: Path) -> list[str]:
    with classes_path.open() as file:
        classes = json.load(file)

    if len(classes) != 8:
        raise ValueError(
            f"Expected 8 classes, but found {len(classes)}"
        )

    return classes


def build_model(
    checkpoint_path: Path,
    number_of_classes: int,
    device: torch.device,
) -> nn.Module:
    model = models.resnet18(weights=None)

    model.fc = nn.Sequential(
        nn.Dropout(p=0.3),
        nn.Linear(model.fc.in_features, number_of_classes),
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


inference_transform = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225],
    ),
])


def load_image(image_path: Path) -> torch.Tensor:
    with Image.open(image_path) as image:
        rgb_image = image.convert("RGB")
        image_tensor = inference_transform(rgb_image)

    return image_tensor.unsqueeze(0)


def predict(
    model: nn.Module,
    image_tensor: torch.Tensor,
    classes: list[str],
    device: torch.device,
    top_k: int = 3,
) -> list[tuple[str, float]]:
    image_tensor = image_tensor.to(device)

    if device.type == "cuda":
        torch.cuda.synchronize()

    start_time = time.perf_counter()

    with torch.inference_mode():
        logits = model(image_tensor)
        probabilities = torch.softmax(logits, dim=1)

    if device.type == "cuda":
        torch.cuda.synchronize()

    inference_time_ms = (
        time.perf_counter() - start_time
    ) * 1000

    top_probabilities, top_indices = torch.topk(
        probabilities,
        k=top_k,
        dim=1,
    )

    predictions = [
        (
            classes[class_index],
            probability,
        )
        for class_index, probability in zip(
            top_indices[0].cpu().tolist(),
            top_probabilities[0].cpu().tolist(),
        )
    ]

    return predictions, inference_time_ms


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("image", type=Path)
    args = parser.parse_args()

    if not args.image.is_file():
        raise FileNotFoundError(
            f"Image does not exist: {args.image}"
        )

    device = torch.device(
        "cuda" if torch.cuda.is_available() else "cpu"
    )

    classes = load_classes(DEFAULT_CLASSES_PATH)

    model = build_model(
        checkpoint_path=DEFAULT_CHECKPOINT_PATH,
        number_of_classes=len(classes),
        device=device,
    )

    image_tensor = load_image(args.image)

    predictions, inference_time_ms = predict(
        model=model,
        image_tensor=image_tensor,
        classes=classes,
        device=device,
    )

    print(f"Device: {device}")
    print(f"Image: {args.image}")
    print("\nTop predictions:")

    for rank, (label, confidence) in enumerate(
        predictions,
        start=1,
    ):
        print(
            f"{rank}. {label}: {confidence * 100:.2f}%"
        )

    print(
        f"\nInference time: {inference_time_ms:.2f} ms"
    )


if __name__ == "__main__":
    main()