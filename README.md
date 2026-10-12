# Custodes Builder
Unofficial Adeptus Custodes (11th edition) list builder and reference. Static site, no backend.
- `data/*.json`: source of truth (schema `custodes-data/1`, see `validate.py`). `mkdata.py` generates `data.js`.
- `build.py` + `pages_extra.py`: generate every HTML page. `make.sh` runs the full pipeline.
- Fan-made; Games Workshop IP belongs to its owners. Rules text is paraphrased for personal reference.
