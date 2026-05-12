---
title: "How SageMaker Runs a Training Job"
description: "A practical walkthrough of Docker images, ECR, SageMaker estimators, S3 inputs, and model artifacts."
date: "2026-05-05"
category: "ML Systems"
tags: ["AWS", "SageMaker", "Docker"]
---

A SageMaker training job is easier to understand when you separate the container from the orchestration.

The container defines the environment and entry point. The SageMaker job decides when and where to run it.

## The flow

A common flow looks like this:

1. Source code lives in a Git repository.
2. CI builds a Docker image.
3. The image is pushed to Amazon ECR.
4. A notebook or pipeline creates a SageMaker estimator.
5. SageMaker launches a training instance.
6. The instance pulls the Docker image.
7. Training data and configuration are downloaded from S3.
8. The container entry point runs.
9. Model artifacts are written back to S3.
10. Metrics and artifacts can also be logged to MLflow.

## Docker image

The Docker image is the blueprint. It contains the Python runtime, dependencies, source code, and entry points such as `train`, `evaluate`, `predict`, or `serve`.

The image is usually built before the notebook runs. SageMaker does not need to know how the code was built; it only needs access to the image in ECR.

## Notebook or pipeline

The notebook acts as the orchestrator. It prepares training configuration, chooses the instance type, points to the Docker image, passes hyperparameters, sets environment variables, and calls `estimator.fit()`.

That call is the trigger. SageMaker then provisions compute, pulls the image, mounts input data, and runs the configured entry point.

## S3 and artifacts

S3 is the handoff layer. Training data, test data, configuration files, and model outputs can all move through S3.

This separation is useful because the container can stay generic while the job-specific inputs change.

## The mental model

I think of SageMaker as:

- Docker for the runtime
- ECR for the image registry
- S3 for inputs and outputs
- SageMaker estimator for orchestration
- MLflow for experiment tracking

Once those roles are clear, the system feels less mysterious. A training job is just a controlled way to run a containerized script on managed compute.
