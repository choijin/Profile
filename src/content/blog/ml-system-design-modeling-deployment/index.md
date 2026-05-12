---
title: "ML System Design, Part 2: Features, Evaluation, and Deployment"
description: "Notes on feature engineering, leakage, model selection, experiment tracking, batch prediction, online prediction, and model compression."
date: "2026-05-01"
category: "ML Systems"
tags: ["ML System Design", "Deployment", "Evaluation"]
---

Once the problem and data are framed, the next challenge is building a model that can actually survive outside a notebook.

This is where feature engineering, evaluation, and deployment start to blur together. A feature that is convenient offline may be impossible to compute online. A model that performs well offline may be too slow to serve. A metric that looks good overall may hide a weak slice.

That is the part I keep trying to remember: model development and system design are not separate phases.

## Feature engineering is still central

Even with models that can learn representations, features still matter.

Missing values are a good example. Missing completely at random is the easiest case, but it is rare. Missing at random means missingness is related to another observed variable. Missing not at random means the missingness is related to the value itself.

That distinction changes what I should do. Dropping rows may be fine when missingness is tiny and random. But if missing income means something about the person or process, deleting those rows can remove useful signal and introduce bias.

Sometimes the missingness indicator is itself a feature.

## Leakage is always waiting

A lot of feature engineering mistakes are leakage mistakes.

The rules I want to keep close are simple:

- split data before scaling or imputation
- calculate preprocessing statistics only on training data
- check duplicates before and after splitting
- oversample only after splitting
- investigate features that look too good to be true

Leakage is dangerous because it can make a model look excellent in validation while failing in production.

## Categorical features are dynamic

In a static data science setting, categories can feel fixed. In production, categories change.

A new brand appears. A new territory code arrives. A new product type gets created.

One approach is to create an `UNKNOWN` category, but the model may not have seen that category during training. Another approach is the hashing trick, where categories are mapped into a fixed-size hash space.

Hashing solves the unknown-category problem, but introduces possible collisions. This is the kind of tradeoff that only becomes obvious when thinking about inference, not just training.

## Model selection should start simple

The state-of-the-art model is not automatically the best production model.

A simpler model is easier to deploy, easier to debug, and easier to use as a baseline. It also helps validate that the training pipeline and prediction pipeline are consistent.

I like this framing: complexity has to earn its place. If a simple model does a reasonable job, a complex model should be meaningfully better to justify the extra cost.

## Evaluation needs more than one aggregate metric

Offline evaluation is necessary, but a single aggregate metric is not enough.

Perturbation tests can show whether the model is robust to noise. Invariance tests can check whether sensitive attributes affect predictions when they should not. Directional expectation tests can catch behavior that moves opposite of domain expectations.

Slice-based evaluation is especially important. Aggregation can hide weak performance in important subgroups. Simpson's paradox is the warning: the overall metric can look fine while subgroup behavior tells a different story.

Slices can come from domain knowledge, error analysis, or automated slice-finding methods.

## Experiment tracking is part of modeling

An experiment is more than a metric.

I would want to track:

- parameters and hyperparameters
- training and validation loss curves
- performance metrics
- sample predictions and ground truth
- artifacts such as plots
- speed and resource usage
- data and code versions

This matters because ML debugging is slow. If a model fails silently, the experiment record is often the only way to reconstruct what happened.

## Batch vs. online prediction

Deployment starts with the prediction pattern.

Batch prediction generates predictions periodically and stores them. It can be efficient because it uses vectorization and avoids serving each request in real time.

The downside is waste and staleness. If only 1 percent of users are active, generating predictions for everyone may be wasteful. And if preferences change quickly, yesterday's prediction may already be stale.

Online prediction returns predictions when requests arrive. It is more responsive, but it requires low latency and a near-real-time feature pipeline.

The tradeoff is:

```text
batch = efficient but less responsive
online = responsive but more demanding
```

## Compression changes what can be deployed

Sometimes the best model offline is too large or too slow.

Compression methods try to make deployment practical:

- low-rank factorization reduces redundant structure
- knowledge distillation trains a smaller student model to mimic a larger teacher
- pruning removes unnecessary parameters or nodes
- quantization uses fewer bits to represent parameters

Quantization is especially general. Moving from 32-bit floats to 16-bit or integer representations can reduce memory and speed up inference.

## Cloud and edge

Cloud deployment is flexible, but it can be expensive and latency-sensitive. Edge deployment moves computation closer to the user, such as onto a phone, browser, or device.

The edge can reduce cost, reduce dependency on internet stability, and keep some data local. But it also creates constraints around model size, hardware, and update patterns.

Intermediate representations and compilers matter here because they help models run across different hardware backends. WebAssembly is interesting because it can run executable programs in browsers.

## My takeaway

Deployment is not just the last step after modeling.

It shapes which features are usable, which model is practical, which metrics matter, and how the system will fail. A good model that cannot be served reliably is not a good production system.
