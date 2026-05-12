---
title: "Double Lift Charts for Insurance Model Evaluation"
description: "How double lift charts compare actual loss cost, current pricing, and a challenger model."
date: "2026-05-08"
category: "Data Science"
tags: ["Insurance", "Model Evaluation", "Lift"]
---

A double lift chart is useful when a model is not only predicting risk, but being compared against an existing pricing or rating structure.

In insurance, the practical question is often not just "does this model predict loss?" It is also "where does this model disagree with the current premium or current model, and who appears underpriced or overpriced?"

## The sorting idea

Start by calculating a sort ratio:

`challenger predicted loss cost / current predicted loss cost`

Then sort records from low to high by that ratio. This creates groups where the challenger model thinks the current model is relatively high, relatively low, or about right.

## Bucketing

After sorting, split the data into quantiles, often deciles or quintiles. In insurance, the buckets should usually have equal exposure so that comparisons are fair.

For each bucket, calculate:

- average actual loss cost
- average challenger predicted loss cost
- average current predicted loss cost

Then normalize each bucket average by its overall average. That indexing makes the chart easier to compare across actuals and model predictions.

## What the chart shows

A strong challenger model should create ordered separation. In buckets where the challenger predicts relatively higher loss cost than the current model, actual loss cost should also be relatively higher.

The double lift chart is especially useful because it is not only evaluating model accuracy. It is evaluating whether a challenger model finds segmentation that the current model is missing.

## Why I like it

General metrics such as AUC, Gini, or lift can tell whether a model ranks risk. A double lift chart asks a more business-specific question:

Where does the new model improve on the current view of risk?

That makes it a practical tool for insurance modeling, pricing review, and challenger model evaluation.
