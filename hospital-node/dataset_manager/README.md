# RESPIRA AI — Local Dataset Manager

## Future Responsibility

The `hospital-node/dataset_manager` directory will manage local dataset curation, validation, and preprocessing for local AI training and federated learning rounds.

### Planned Components & Responsibilities:
- **Dataset Indexing**: Automatic indexing of local verified chest X-ray images from local storage.
- **Local Image Discovery**: Scanner for new reviewed clinical studies eligible for inclusion in local training datasets.
- **Dataset Validation**: Data integrity checks, image corruptions filter, format standardization (DICOM/JPEG/PNG to standard tensor dimensions).
- **Class Labeling**: Ground-truth label association based on verified doctor diagnoses.
- **Train / Validation / Test Split**: Configurable stratified splitting logic for unbiased local evaluation.
- **Preprocessing & Augmentation**: Resizing, normalization, rotation, zoom, and contrast adjustments.
- **Dataset Statistics**: Summary generation (total samples, positive/negative ratios, patient demographics distribution).

> [!IMPORTANT]
> **Privacy Principle**: All dataset indexing, raw images, and processed tensors remain strictly local to the hospital node. No raw images or datasets are ever uploaded or shared externally.
