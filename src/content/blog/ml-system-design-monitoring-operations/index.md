---
title: "ML System Design, Part 3: Monitoring, Continual Learning, and MLOps Tools"
description: "Notes on distribution shift, production testing, continual learning, model stores, feature stores, Docker, Kubernetes, and orchestration."
date: "2026-04-30"
category: "ML Systems"
tags: ["ML System Design", "Monitoring", "MLOps"]
---

The part of ML system design that feels most different from classroom modeling is what happens after deployment.

In a static project, the model is done when the evaluation is done. In production, the model starts aging the moment it is deployed.

Real-world data is not stationary.

## Distribution shift

There are a few different ways the world can move away from the training data.

Covariate shift happens when `P(X)` changes but `P(Y | X)` stays the same. The input population changes, but the relationship between inputs and output is stable.

Label shift happens when `P(Y)` changes but `P(X | Y)` stays the same. The base rate changes.

Concept drift happens when `P(Y | X)` changes. The same input means something different than it used to.

Concept drift is the one that feels most dangerous because the model's learned relationship is becoming stale.

## Edge cases and feedback loops

Outliers are unusual data points. Edge cases are unusual examples that cause severe model mistakes.

That distinction matters because an outlier is about the data distribution, while an edge case is about performance.

Feedback loops are another production-specific issue. If model predictions influence future data, the system can start training on its own effects. A recommender can make content more homogeneous because it keeps showing similar things and then learns from the clicks it caused.

Some randomness or exploration can help reduce that feedback loop.

## Monitoring

Monitoring includes operational metrics and ML-specific metrics.

Operational metrics are things like latency, throughput, CPU, memory, and errors. ML metrics include AUC, F1, lift, calibration, drift metrics, and data quality checks.

In practice, many drift checks focus on input distributions. I would look at min, max, mean, median, variance, quantiles, skewness, kurtosis, missing rates, and format violations.

The monitoring window matters. A shorter window catches changes faster but creates more false alarms. A longer window is more stable but slower to react.

## Retraining is not the same as adaptation

Many companies retrain on a schedule: monthly, weekly, daily.

That is useful, but it is blunt. A better system should ask whether the change matters enough to update the model.

Feature stability also matters. A feature may be predictive but deteriorate quickly, forcing frequent retraining. Sometimes a slightly weaker but more stable feature can be better for the system.

## Continual learning

Continual learning is about building infrastructure so models can be updated quickly as data changes.

Stateless training means training from scratch using past and recent data. It is simple but expensive.

Stateful training reuses model state and updates from new data. That is faster, but many systems still occasionally retrain from scratch to recalibrate.

The best candidates for continual learning are tasks with fast natural labels: ads click-through prediction, recommendations, dynamic pricing, ETA prediction, and similar systems.

The bottleneck is often label availability. The process of extracting labels later from logs is label computation.

## Testing in production

Offline evaluation is necessary, but it is not enough.

The test split may not match future production data. Backtests are useful, but the past still does not guarantee the future. Eventually, a model has to be evaluated in production.

Common patterns include:

- shadow deployment: run challenger beside champion, but only use champion output
- A/B testing: randomly route traffic to models and compare metrics
- canary release: send a small amount of traffic to the challenger, then ramp up if safe
- bandits: dynamically allocate traffic based on observed performance

Shadow deployment is safer but expensive. A/B testing is clean but needs enough samples. Canary release is practical for controlled rollout. Bandits are adaptive but harder to implement.

## Tools are there to preserve consistency

MLOps tools are not just tooling for tooling's sake. They preserve consistency across development, training, deployment, and monitoring.

Containers help standardize environments. A Dockerfile is a recipe for an image, and a container is a running instance of that image.

Docker Compose is useful for local or single-host workflows. Kubernetes becomes relevant when containers need to be managed across multiple hosts with scaling, networking, and resilience.

Schedulers and orchestrators solve different problems. A scheduler is concerned with when jobs run. An orchestrator is concerned with where resources come from and how services run.

## Model stores and feature stores

A model store should track more than the model file.

Useful artifacts include:

- model definition
- model parameters
- feature and prediction functions
- dependencies
- training data
- generation code
- experiment artifacts
- tags and ownership metadata

Feature stores solve another consistency problem. They can help with feature management, feature computation, and feature consistency between training and inference.

That last point is the big one for me. If training features are computed one way and production features another way, the model can fail even when the code looks correct.

## My takeaway

Production ML is a living system.

Monitoring tells me when the world is changing. Continual learning decides how quickly the model should adapt. Testing in production gives evidence that a model is safe under real traffic. MLOps tools hold the pieces together so the system can be maintained.

The model matters, but the system around the model determines whether it keeps mattering.
