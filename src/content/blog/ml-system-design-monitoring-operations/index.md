---
title: "ML System Design, Part 3: Deployment, Monitoring, and MLOps Tools"
description: "Notes on batch and online prediction, model compression, cloud and edge deployment, distribution shift, production testing, continual learning, feature stores, and MLOps tools."
date: "2024-04-02"
category: "ML Systems"
tags: ["ML System Design", "Deployment", "Monitoring", "MLOps"]
---

Thanks for following up until this point, the last post of the ML System Design series. The part of ML system design that feels most different from classroom modeling is what happens when the model has to be deployed and kept alive. This is the area that I lack the most, and I am forcing myself to get good at.

In a static project, the model is done when the evaluation is done. In production, deployment is where a new set of constraints shows up: latency, freshness, cost, monitoring, retraining, and operational consistency.

## Batch vs. online prediction

Deployment starts with the prediction pattern.

Batch prediction generates predictions periodically or when triggered. It is asynchronous (it can happen at night and send in the morning). The predictions can be stored in a warehouse or database and served later.

Batch prediction can be efficient because it uses vectorization and avoids serving each request in real time. The downside is waste and staleness. If only 1 percent of users are active, generating predictions for everyone may be wasteful. And if preferences change quickly, yesterday's prediction may already be stale.

Online prediction returns predictions when requests arrive. It is synchronous (like a quote) and more responsive, but it requires low latency and a near-real-time feature pipeline.

The tradeoff is:

```text
batch = efficient but less responsive
online = responsive but more demanding
```

Many systems move from batch toward online prediction when they need fresher responses. To make online prediction work, two things usually matter most:

- a near-real-time pipeline for incoming data
- a model that can generate predictions within the latency budget

Feature stores and stream processors such as Apache Flink can help unify batch and streaming pipelines, especially when training features and serving features need to stay consistent.

## Compression changes what can be deployed

Sometimes the best model offline is too large or too slow.

Compression methods try to make deployment practical:

- Low-rank factorization reduces redundant structure, often in specific model families.
- Knowledge distillation trains a smaller student model to mimic a larger teacher or ensemble.
- Pruning removes unnecessary tree sections, neural network nodes, or low-importance parameters.
- Quantization uses fewer bits to represent parameters.

Quantization is especially general. Moving from 32-bit floats to 16-bit floats or integer representations can reduce memory and speed up inference.

The larger lesson is that deployment constraints can change which model is actually best. A slightly less accurate model that runs reliably may be the better production model.

## Cloud and edge

Cloud deployment is flexible, but it can be expensive and latency-sensitive. Edge deployment moves computation closer to the user, such as onto a phone, browser, laptop, or device.

The edge can reduce cost, reduce dependency on internet stability, and keep some data local. But it also creates constraints around model size, hardware, battery, update patterns, and observability.

Intermediate representations matter because they act like a middle layer between model code and machine code:

```text
model -> intermediate representation -> machine code -> hardware backend
```

Compilers can help models run across different hardware backends. WebAssembly is interesting because it lets executable programs run in browsers, which means a model can potentially run on any device with browser support.

## Distribution shift

There are a few different ways the world can move away from the training data.

**Covariate shift** happens when `P(X)` changes but `P(Y|X)` remains the same. The distribution of the input changes but the conditional probability of an output given input remains the same. Covariate shift is closely related to the sample selection bias problem. Example is let’s say your training data has `P(X)` as young people. In inference time, your `P(X)` is not the same because the data contains less young people. Regardless, the `P(Y|X)`, which can be the probability of income given the young people, will be the same.

**Label shift**, also known as prior shift, happens When `P(Y)` changes but `P(X|Y)` remains the same. A medicine was developed to suppress virus, so `P(Y)` is lower. But for those with virus, where `X` are the symptoms, `P(X|Y)` still remains the same, before and after the medicine to suppress infection.

**Concept drift**, also known as posterior shift, happens when `P(Y|X)` changes but `P(X)` remains the same. Let’s say `X` is the features of house, and `Y` is the price. Before COVID, house was cheaper with the same features, but now, houses are much more expensive given the same features. 

Concept drift is the one that feels most dangerous because the model's learned relationship is becoming stale.

## Edge cases and feedback loops

Outliers are unusual data points. Edge cases are unusual examples that cause severe model mistakes (edge case is bad).

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

That is useful, but it is blunt. A better system should ask whether the change matters enough to update the model. You might consider comparing the metrics from prior models to see if it is worth the update.

Feature stability also matters. A feature may be predictive but deteriorate quickly, forcing frequent retraining. Sometimes a slightly weaker but more stable feature can be better for the system.

## Continual learning

Continual learning is about building infrastructure so models can be updated quickly as data changes.

Stateless training means training from scratch using past and recent data. It is simple but expensive.

Stateful training reuses model state and updates from new data. Another term would be refitting. Nevertheless, many systems still occasionally retrain from scratch to recalibrate.

The best candidates for continual learning are tasks with fast natural labels: ads click-through prediction, recommendations, dynamic pricing, ETA prediction, and similar systems. In insurance, if we use loss as the target, it takes a very long time to generate the target variable, which I found to be one of interesting thing in this field.

The bottleneck is often label availability. The process of extracting labels later from logs is label computation.

## Testing in production

Offline evaluation is necessary, but it is not enough.

The test split may not match future production data. Backtests are useful, but the past still does not guarantee the future. Eventually, a model has to be evaluated in production.

Common patterns include:

- shadow deployment: run challenger beside champion, but only use champion output. This is relatively safer method but expensive to implement.
- A/B testing: **randomly** route traffic to models and compare metrics, and do a hypothesis teseting (like KS test). To implement this you need many samples
- canary release: send a small amount of traffic to the challenger, then ramp up the traffic if satisfactory. This is practical for controlled rollout.
- bandits: dynamically allocate traffic based on observed performance (difference between canary release is that canary release releases small percentage to users and gradually increase it, whereas bandit channels traffic automatically in real-time). This is adaptive but harder to implement.

## Tools are there to preserve consistency

MLOps tools are not just tooling for tooling's sake. They preserve consistency across development, training, deployment, and monitoring.

Containers help standardize environments. A Dockerfile is a recipe for an image, and a container is a running instance of that image.

Docker Compose is useful for local or single-host workflows. Kubernetes becomes relevant when containers need to be managed across **multiple hosts** with scaling, networking, and resilience.

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
