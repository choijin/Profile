---
title: "Calibration vs. Model Power"
description: "Why a model can rank risks well but still produce unreliable probabilities."
date: "2024-08-10"
order: 5
category: "Data Science"
tags: ["Calibration", "Model Evaluation", "Risk"]
---


Calibration and model power are related, but they are not the same thing. **Calibration** is ensuring that a model's predicted probabilities align with the true likelihood of events occurring.

This distinction matters because a model can be very good at ranking risk and still produce probabilities that I should not trust at face value. Ranking and probability accuracy feel similar at first, but they answer different questions.

## Power is about separation

When I say a model is powerful, I mean it separates high-risk and low-risk observations well.

In a binary classification setting, a powerful model tends to rank true positives above true negatives. Metrics like AUROC, Gini, lift, and precision-recall curves are usually measuring some form of this ranking ability.

A model can be powerful even if its probabilities are too extreme or too conservative. It may know who is riskier, but still be wrong about how risky they are.

## Calibration is about probability accuracy

Calibration asks whether predicted probabilities line up with observed frequencies.

If a model assigns a group of observations a 20 percent probability of default, then roughly 20 percent of that group should actually default. If 35 percent default, the model was underpredicting. If 10 percent default, it was overpredicting.

That is a different kind of quality than ranking.

## Why it matters in practice

In some problems, ranking is enough. If I only need to prioritize the top 5 percent for review, discrimination may be the main concern.

But in lending, insurance, pricing, and risk modeling, the probability level matters. A predicted probability can feed into expected loss, premium, cutoff decisions, or capital allocation.

In those settings, a model that ranks well but is poorly calibrated can still lead to bad decisions.

## Calibration is not magic

Calibration can adjust the probability scale. Platt scaling fits a logistic regression on top of model scores. Isotonic regression fits a more flexible monotonic mapping.

These methods can make probabilities more reliable, but they do not create new signal.

A weak model cannot become powerful just because it is calibrated. Calibration can fix the scale, but it cannot invent separation that the model never learned.

## The way I remember it

Power answers: can the model separate risk?

Calibration answers: can I trust the probability number?

For decision-making, I usually want both. A model should rank risks well enough to be useful, and its predicted probabilities should be close enough to reality that the downstream decisions make sense.
