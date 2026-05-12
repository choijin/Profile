---
title: "Calibration vs. Model Power"
description: "Why a model can rank risks well but still produce unreliable probabilities."
date: "2026-05-07"
category: "Data Science"
tags: ["Calibration", "Model Evaluation", "Risk"]
---

Model power and calibration are related, but they are not the same thing.

A powerful model separates high-risk and low-risk observations well. A calibrated model produces probabilities that match observed frequencies.

For example, if a model predicts a 20 percent probability of default for a group of firms, roughly 20 percent of those firms should default if the model is calibrated.

## Power

Power is about discrimination. In binary classification, a powerful model ranks true positives above true negatives. Metrics like AUROC, Gini, lift, and precision-recall curves are usually measuring some version of ranking quality.

A model can be powerful even if its probabilities are too extreme or too conservative. It may order risks correctly but assign unreliable probability levels.

## Calibration

Calibration is about probability accuracy. The predicted probabilities should align with observed outcomes.

Calibration curves usually sort predictions into buckets. For each bucket, we compare the average predicted probability with the observed event rate.

If the curve is above the 45-degree line, the model is underpredicting the event rate. If the curve is below the line, it is overpredicting.

## Why the distinction matters

In many business settings, the decision is not only who is riskier. The size of the probability matters.

For lending, insurance, and pricing, a model's probability can affect expected loss, premium, cutoff decisions, or capital allocation. Ranking is important, but probability scale matters too.

## Calibration techniques

Two common approaches are:

- Platt scaling, which fits a logistic regression model on top of model scores.
- Isotonic regression, which fits a more flexible non-decreasing calibration function.

Platt scaling is simpler and works well when the calibration error has a sigmoid-like shape. Isotonic regression is more flexible, but can overfit on smaller datasets.

## The key point

A weak model cannot become powerful through calibration alone. Calibration can improve probability reliability, but it does not create new discriminatory signal.

The best model for decision-making usually needs both: enough power to rank risk and enough calibration to make the predicted probabilities meaningful.
