---
title:          "ORBIT-2: Scaling Exascale Vision Foundation Models for Weather and Climate Downscaling"
date:           2025-07-22 00:01:00 +0800
selected:       true
pub:            "<strong>International Conference for High Performance Computing, Networking, Storage, and Analysis (SC)</strong>"
pub_date:       "2025"

abstract: >-
  Sparse observations and coarse-resolution climate models limit effective regional decision-making, underscoring the need for robust downscaling. However, existing AI methods struggle with generalization across variables and geographies and are constrained by the quadratic complexity of Vision Transformer (ViT) self-attention. We introduce ORBIT-2, a scalable foundation model for global, hyper-resolution climate downscaling. ORBIT-2 incorporates two key innovations: (1) Residual Slim ViT (Reslim), a lightweight architecture with residual learning and Bayesian regularization for efficient, robust prediction; and (2) TILES, a tile-wise sequence scaling algorithm that reduces self-attention complexity from quadratic to linear, enabling long-sequence processing and massive parallelism. ORBIT-2 scales to 10 billion parameters across 32,768 GPUs, achieving up to 1.8 ExaFLOPS sustained throughput and 92-98% strong scaling efficiency. It supports downscaling to 0.9 km global resolution and processes sequences up to 4.2 billion tokens. On 7 km resolution benchmarks, ORBIT-2 achieves high accuracy with R^2 scores in the range of 0.98 to 0.99 against observation data.

cover:          /assets/images/covers/gb_climate.png

authors:
authors:
  - Xiao Wang
  - Jong-Youl Choi
  - Takuya Kurihaya
  - Isaac Lyngaas
  - Hong-Jun Yoon
  - Xi Xiao
  - Ming Fan
  - Nasik Muhammad Nafi
  - Aristeidis Tsaris
  - Ashwin M. Aji
  - Maliha Hossain
  - Mohamed Wahib
  - Dali Wang
  - Peter Thornton
  - Prasanna Balaprakash
  - Moetasim Ashfaq
  - Dan Lu


links:
#  PDF: https://arxiv.org/pdf/2507.12345
#  Code: https://github.com/ORNL/GB-Climate
#  Demo: https://ornl.github.io/GB-Climate-Demo/
---
