---
title: "Double Lift Charts for Insurance Model Evaluation"
description: "How double lift charts compare actual loss cost, current pricing, and a challenger model."
date: "2026-05-08"
category: "Data Science"
tags: ["Insurance", "Model Evaluation", "Lift"]
---

I like double lift charts because they ask a more practical question than "is this model good?"

In insurance, a new model is often being compared against an existing rating plan or current model. So the question becomes: where does the challenger model disagree with the current view of risk, and does actual experience support that disagreement?

That is what a double lift chart helps show.

## The sorting idea

The first step is to create a ratio between the challenger model and the current model.

For example: challenger predicted loss cost divided by current predicted loss cost.

Then the data is sorted by that ratio. On one end are risks where the challenger thinks the current model is relatively too high. On the other end are risks where the challenger thinks the current model is relatively too low.

That sorting is the heart of the chart.

## Why exposure matters

After sorting, the data is usually split into quantiles such as deciles or quintiles.

For insurance, I would want those buckets to have equal **exposure**, not just equal record counts. Otherwise, one bucket might represent much more risk than another, and the comparison can become distorted.

Within each bucket, we compare actual loss cost, challenger predicted loss cost, and current predicted loss cost. Indexing each series to its overall average makes the chart easier to read.

## What I am looking for

If the challenger model is finding real segmentation, the actual loss cost should move in the direction the challenger suggests.

For example, in buckets where the challenger says the current model is underestimating risk, actual loss cost should also look higher. If actuals stay flat or move the opposite way, the challenger may not be adding useful information.

This is why the chart feels more business-relevant than a generic metric. It is not only asking whether the model ranks risk. It is asking whether the new model improves on the current structure.

## Why it is useful

AUC, Gini, lift, and gains charts can tell me whether a model ranks outcomes well.

A double lift chart tells me something more specific: where the challenger model sees the current model as wrong.

That makes it especially useful for pricing review, challenger model evaluation, and conversations where the goal is not just prediction accuracy but better risk segmentation.
