---
title: "How SageMaker Runs a Training Job"
description: "A practical walkthrough of Docker images, ECR, SageMaker estimators, S3 inputs, and model artifacts."
date: "2026-05-05"
category: "ML Systems"
tags: ["AWS", "SageMaker", "Docker"]
---

SageMaker made more sense to me when I stopped thinking of it as a mysterious AWS service and started thinking of it as a managed way to run a containerized training script.

The container defines the environment. SageMaker decides where and how to run it.

## The moving pieces

The flow I keep in my head looks like this:

```text
Git repo
  -> Docker image
  -> ECR
  -> SageMaker estimator
  -> training instance
  -> container entry point
  -> artifacts in S3
  -> metrics/artifacts in MLflow
```

The Docker image is built before the training job runs. It contains the Python version, dependencies, source code, and entry points like `train`, `evaluate`, `predict`, or `serve`.

ECR is where that image is stored. SageMaker does not need to know how the image was built. It just needs permission to pull it.

## What the notebook or pipeline does

The notebook is not really where the model trains. It is more like the job launcher.

It prepares configuration, chooses the instance type, points to the image URI, passes hyperparameters, sets environment variables, and calls something like `estimator.fit()`.

That call is the trigger. SageMaker provisions the compute, pulls the image from ECR, downloads input data from S3, and runs the container entry point.

## Configuration and data

For a training job, I usually think about three kinds of inputs:

- data, such as train and test files
- configuration, such as selected predictors, target, weights, constraints, distribution family, and link function
- environment values, such as MLflow tracking URI or experiment name

S3 becomes the handoff layer. The notebook can upload configuration to S3, SageMaker can mount or download it into the container, and the training script can read it at runtime.

That separation is useful because the image can stay stable while the job-specific inputs change.

## What happens inside the job

Inside the training job, the container runs the entry point.

In a GLM training workflow, that entry point might read the config, load training data, fit the model, evaluate it, write model artifacts, and log metrics.

The output artifacts usually go back to S3. Experiment results can also be logged to MLflow.

The basic pattern is:

```text
container starts
  -> read inputs from /opt/ml/input/
  -> run train entry point
  -> write model to /opt/ml/model/
  -> SageMaker uploads artifacts to S3
```

## The mental model

The cleanest way for me to remember SageMaker is:

- Docker defines the environment and dependencies.
- ECR stores the container image.
- S3 passes data, config, and artifacts.
- SageMaker runs the job on managed compute.
- MLflow tracks what happened.
