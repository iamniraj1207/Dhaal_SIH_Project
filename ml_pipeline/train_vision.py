import os
import argparse
import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, transforms
from torch.utils.data import DataLoader, Subset
from transformers import MobileViTForImageClassification
import numpy as np
import warnings
warnings.filterwarnings("ignore")

def main():
    parser = argparse.ArgumentParser(description="Train MobileViT on SIPaKMeD")
    parser.add_argument('--fast-dev-run', action='store_true', help="Run only 1 batch for 1 epoch to test pipeline")
    parser.add_argument('--data-dir', type=str, default='../cervical-cancer-largest-dataset-sipakmed', help="Path to unzipped SIPaKMeD data")
    args = parser.parse_args()
    
    print("Initializing Vision ML Pipeline (MobileViT)")
    
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")
    
    if not os.path.exists(args.data_dir):
        print(f"Dataset not found at {args.data_dir}. Using dummy data.")
        os.makedirs(os.path.join(args.data_dir, 'Superficial-Intermediate'), exist_ok=True)
        os.makedirs(os.path.join(args.data_dir, 'Parabasal'), exist_ok=True)
        os.makedirs(os.path.join(args.data_dir, 'Koilocytotic'), exist_ok=True)
        os.makedirs(os.path.join(args.data_dir, 'Dyskeratotic'), exist_ok=True)
        os.makedirs(os.path.join(args.data_dir, 'Metaplastic'), exist_ok=True)
        
    transform = transforms.Compose([
        transforms.Resize((256, 256)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    try:
        full_dataset = datasets.ImageFolder(args.data_dir, transform=transform)
        if len(full_dataset) == 0:
            raise ValueError("No images found")
            
        # Use the full dataset as requested
        dataset = full_dataset
        classes = full_dataset.classes
    except Exception as e:
        print("Warning: Could not load real images. Using dummy dataset.")
        dataset = torch.utils.data.TensorDataset(
            torch.randn(150, 3, 256, 256), 
            torch.randint(0, 5, (150,))
        )
        classes = ['Dyskeratotic', 'Koilocytotic', 'Metaplastic', 'Parabasal', 'Superficial-Intermediate']

    train_size = int(0.8 * len(dataset))
    val_size = len(dataset) - train_size
    train_dataset, val_dataset = torch.utils.data.random_split(dataset, [train_size, val_size])
    
    train_loader = DataLoader(train_dataset, batch_size=8, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=8, shuffle=False)
    
    num_classes = 5
    
    print("Loading pretrained apple/mobilevit-small...")
    model = MobileViTForImageClassification.from_pretrained(
        "apple/mobilevit-small", 
        num_labels=num_classes,
        ignore_mismatched_sizes=True
    )
    model.to(device)
    
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.AdamW(model.parameters(), lr=1e-4)
    
    epochs = 1 if args.fast_dev_run else 10
    
    print("Starting training...")
    for epoch in range(epochs):
        model.train()
        running_loss = 0.0
        for i, (inputs, labels) in enumerate(train_loader):
            inputs, labels = inputs.to(device), labels.to(device)
            
            optimizer.zero_grad()
            outputs = model(inputs)
            loss = criterion(outputs.logits, labels)
            loss.backward()
            optimizer.step()
            
            running_loss += loss.item()
            
            if args.fast_dev_run:
                break
                
        # Validation accuracy
        model.eval()
        correct = 0
        total = 0
        with torch.no_grad():
            for inputs, labels in val_loader:
                inputs, labels = inputs.to(device), labels.to(device)
                outputs = model(inputs)
                _, predicted = torch.max(outputs.logits, 1)
                total += labels.size(0)
                correct += (predicted == labels).sum().item()
                if args.fast_dev_run: break
                
        val_acc = 100 * correct / total if total > 0 else 0
        print(f"Epoch {epoch+1}/{epochs}, Loss: {running_loss/max(1, i+1):.4f}, Val Accuracy: {val_acc:.2f}%")
    
    print("Exporting model to ONNX format...")
    os.makedirs('models/trained', exist_ok=True)
    onnx_path = 'models/trained/cerviguard_mobilevit_sipakmed.onnx'
    
    model.eval()
    dummy_input = torch.randn(1, 3, 256, 256).to(device)
    
    class WrappedModel(nn.Module):
        def __init__(self, model):
            super().__init__()
            self.model = model
        def forward(self, x):
            return self.model(x).logits
            
    wrapped_model = WrappedModel(model)
    
    torch.onnx.export(
        wrapped_model,
        dummy_input,
        onnx_path,
        export_params=True,
        opset_version=14,
        do_constant_folding=True,
        input_names=['input'],
        output_names=['output'],
        dynamic_axes={'input': {0: 'batch_size'}, 'output': {0: 'batch_size'}}
    )
    
    print(f"Successfully exported ONNX artifact to {onnx_path}")
    print(f"Final Vision Model Accuracy: {val_acc:.2f}%")

if __name__ == '__main__':
    main()
