---
title: "ML System Design, Part 1: From Business Problem to Training Data"
description: "Notes on production priorities, business metrics, data systems, labels, sampling, and class imbalance."
date: "2025-03-10"
order: 9
category: "ML Systems"
tags: ["ML System Design", "Training Data", "Data Engineering"]
---

This is the first part of my series on ML system design, basically just my notes from reading the book Machine Learning Systems Design by Chip Huyen. While it is a note from the book, I've added my anecdotes and rephrased some topics to my flavors.

The first thing that stood out to me in ML system design was that the model is only one part of the system.

As a data scientist, I am sometimes too comfortable working in Jupyter Notebooks and is too focused on the model result. To be fair, the goal of data scientists might be different from that of a software engineer. For data scientists, the insights and the models may be the end goal, and the tools that we use to create the result are simply a mean to get to the end. Whereas, for software engineers, the tool itself may be the end goal. And I would say that an ML Engineer is a mix of the two, understanding the world of building models but also the world of serving the model as a product. In production, there are more things to consider, where the model has to live inside a business process, a data system, a latency budget, and a maintenance cycle.

Reading this book was my attempt to become the hybrid who understands both worlds. 

## Research priorities are not production priorities

An interesting point this book begins with is that research often rewards training speed and model quality, while production cares a lot about inference.

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

But many projects are less direct. If the business goal is to speed up customer support, the ML problem may not be "answer every request." It might be **routing** each request to the right department.

That framing step matters. A model can be technically impressive and still solve the wrong problem.

## Multiple objectives should often be decoupled

Some systems have more than one objective.

A recommender may want engagement, but it may also want quality, safety, or diversity. One way to handle that is to combine losses:

```text
loss = alpha * engagement_loss + beta * quality_loss
```

But a cleaner approach can be to train separate models and combine their **scores** later:

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

Database
- Easiest way to pass data between two processes. However, it requires that both processes be able to access the same database, and read/write from databases can be slow, making it unsuitable for applications with strict latency requirements.

Services
- Send data directly through a network that connects these two processes. This is request-driven. It is tightly coupled with the service-oriented architecture. A service is a process that can be accessed remotely (e.g., through a network). The most popular styles of request used for passing data through networks are REST and RPC. REST was designed for requests over networks.

Real-Time Transport
- Instead of having services request data directly from each other and creating a web of complex interservice data passing, each service only has to communicate with the broker that coordinates data passing among services.

- A piece of data broadcast to a real-time transport is called an event. A real-time transport is sometimes called an event bus.

- Request-driven architecture works well for systems that rely more on logic than on date (e.g., getting a quote, making predictions).

- Event-driven architecture works better for systems that are data-heavy (e.g., a policy is created, then multiple services are triggered to react to that) 


## Training data is a design problem

Training data is not just "whatever is available."

Sampling strategy matters. Simple random sampling can miss rare groups. Stratified sampling can preserve class representation. Weighted sampling changes which examples are more likely to appear. Importance sampling lets us sample from one distribution and reweight toward another. For example, sampling from a distribution when we only have access to another distribution. If Q(x) is similar to P(x) and is less expensive, we sample from Q(x) and weigh this sample by P(x)/Q(x).

The labels matter too. If multiple annotators disagree, label multiplicity becomes part of the data. That is where data lineage becomes important: I want to know where the sample and label came from.

## Class imbalance is not just annoying

Class imbalance can cause a model to learn a cheap shortcut.

If the minority class is rare, the model may get decent aggregate metrics by mostly predicting the majority class. That can be useless if the minority class is the thing I actually care about.

For example, when predicting hospital bills, it might be more important to predict accurately the bills at the 95th percentile than the median bills. We might have to train the model to do better at predicting 95th percentile bills, even if it reduces the overall metrics. In medical, fraud, or risk settings, missing a rare positive can be much more expensive than misclassifying a common negative.

Some responses are data-level: oversampling, undersampling, SMOTE, Tomek links. But according to some articles, these resampling techniques are not promising. I would rather focus on choosing the right metrics to the problem. For example, AUC for classifications, using Tweedie distribution in GLM, etc...

In the worst case where we need to resample, we should never evaluate on resampled data. The test set should represent the real distribution I expect in production, not the artificial distribution I created for training.

## My takeaway

The early part of ML system design is mostly about framing, and I think this is probably the most important phase of the work, and the hardest one too.

What is the business objective? What prediction problem actually supports it? What data exists? How reliable are the labels? What does the system need to optimize: latency, throughput, cost, interpretability, adaptability?

By the time model training starts, many important system decisions should have already been made.
