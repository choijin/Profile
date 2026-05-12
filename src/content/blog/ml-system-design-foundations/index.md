---
title: "ML System Design, Part 1: From Business Problem to Training Data"
description: "Notes on production priorities, business metrics, data systems, labels, sampling, and class imbalance."
date: "2026-05-02"
category: "ML Systems"
tags: ["ML System Design", "Training Data", "Data Engineering"]
---

The first thing that stands out to me in ML system design is that the model is only one part of the system.

In a notebook, I can focus mostly on the model. In production, the model has to live inside a business process, a data system, a latency budget, and a maintenance cycle.

That changes how I think about "good."

## Research priorities are not production priorities

Research often rewards training speed and model quality. Production cares a lot about inference.

Two words matter here:

- latency: how long one request takes
- throughput: how many requests the system can process in a period of time

Batching can improve throughput, but it may hurt latency. That tradeoff is fine in training, where I want to process as many samples as possible. It can be a problem in production, where a user may be waiting for one prediction.

The other detail I want to remember is that average latency can be misleading. If the latency distribution looks like `100ms, 99ms, 3000ms, 95ms`, the mean hides the painful tail. Production requirements often care about p90, p99, or p99.9 latency.

## ML systems are code plus data plus artifacts

Traditional software can often treat code and data as separate.

ML systems cannot. The model artifact is created from code and data. If either changes, behavior can change.

That means versioning code is not enough. I also need to think about data versioning, model versioning, feature definitions, labels, dependencies, and evaluation datasets.

This is one reason ML systems fail quietly. A code test can pass while the data distribution changes underneath the model.

## Business metrics come first

A model metric only matters if it connects to the business problem.

Click-through prediction and fraud detection are common ML examples because the mapping from model quality to business value is relatively clear. Better ranking can mean more revenue, less fraud loss, or fewer manual reviews.

But many projects are less direct. If the business goal is to speed up customer support, the ML problem may not be "answer every request." It might be routing each request to the right department.

That framing step matters. A model can be technically impressive and still solve the wrong problem.

## Multiple objectives should often be decoupled

Some systems have more than one objective.

A recommender may want engagement, but it may also want quality, safety, or diversity. One way to handle that is to combine losses:

```text
loss = alpha * engagement_loss + beta * quality_loss
```

But a cleaner approach can be to train separate models and combine their scores later:

```text
score = alpha * engagement_score + beta * quality_score
```

That makes the system easier to tune. I can adjust `alpha` and `beta` without retraining the underlying models.

## Data format is a system decision

CSV and Parquet are not just file extensions. They reflect different access patterns.

CSV is row-oriented, which is convenient for writing records. Parquet is column-oriented, which is efficient for analytical reads where I only need some columns.

That matters because ML workflows often read subsets of columns repeatedly. A columnar format can make those workflows much faster.

The same idea shows up in pandas: column-wise operations are usually much more natural than row-wise iteration.

## Data passing shapes the architecture

There are several ways processes pass data:

- through a shared database
- through request-driven services such as REST or RPC
- through real-time transports such as pub/sub systems or message queues

Request-driven systems work well when the logic is central. Event-driven systems often work better when the system is data-heavy.

For ML, that distinction matters because batch data often produces static features, while real-time event streams can produce dynamic features.

## Training data is a design problem

Training data is not just "whatever is available."

Sampling strategy matters. Simple random sampling can miss rare groups. Stratified sampling can preserve class representation. Weighted sampling changes which examples are more likely to appear. Importance sampling lets us sample from one distribution and reweight toward another.

The labels matter too. If multiple annotators disagree, label multiplicity becomes part of the data. That is where data lineage becomes important: I want to know where the sample and label came from.

## Class imbalance is not just annoying

Class imbalance can cause a model to learn a cheap shortcut.

If the minority class is rare, the model may get decent aggregate metrics by mostly predicting the majority class. That can be useless if the minority class is the thing I actually care about.

The cost of errors is often asymmetric too. In medical, fraud, or risk settings, missing a rare positive can be much more expensive than misclassifying a common negative.

Some responses are data-level: oversampling, undersampling, SMOTE, Tomek links. But the warning I want to keep close is this:

Never evaluate on resampled data.

The test set should represent the real distribution I expect in production, not the artificial distribution I created for training.

## My takeaway

The early part of ML system design is mostly about framing.

What is the business objective? What prediction problem actually supports it? What data exists? How reliable are the labels? What does the system need to optimize: latency, throughput, cost, interpretability, adaptability?

By the time model training starts, many important system decisions have already been made.
