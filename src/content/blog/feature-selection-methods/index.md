---
title: "Feature Selection Methods I Keep Coming Back To"
description: "A compact guide to drop-in-deviance, best subset selection, variance thresholding, RFE, VARCLUS, and LASSO."
date: "2026-05-10"
category: "Data Science"
tags: ["Feature Selection", "LASSO", "Modeling"]
---

Feature selection is not one technique. It is a set of tradeoffs between interpretability, computation, stability, and predictive performance.

The methods I return to fall into a few broad families.

## Drop-in-deviance

Drop-in-deviance is a likelihood ratio test for nested GLMs. It compares a reduced model against a fuller model and asks whether the additional parameter or group of parameters improves fit enough to justify the extra complexity.

The null hypothesis is that the reduced model is sufficient. The alternative is that the full model improves fit.

This is useful when the model structure matters and when the candidate variables have a statistical interpretation.

## Best subset selection

Best subset selection searches across combinations of variables and compares models of different sizes. The appeal is directness: for each number of predictors, find the best model.

The downside is that the search can become expensive quickly. It can also overfit if the selection process is not evaluated honestly.

## Variance thresholding

Variance thresholding is an unsupervised filter method. It removes predictors whose variance is below a cutoff.

It is simple and fast, but it does not know anything about the target. A low-variance feature can still be useful in some settings, so I treat this more as cleanup than serious model selection.

## Recursive feature elimination

Recursive feature elimination starts with a model, ranks features by importance, removes the weakest feature or features, and repeats.

It is a wrapper method because it depends on repeatedly fitting a model. That makes it more expensive than simple filters, but it can reflect how a feature behaves inside the model rather than in isolation.

## Variable clustering

Variable clustering, such as VARCLUS, groups correlated variables together. The goal is to identify clusters that can be represented by a smaller number of variables.

This is useful when there are many predictors carrying similar information. Instead of asking whether each variable is individually important, it asks which variables are redundant with one another.

## LASSO

LASSO adds an L1 penalty to the loss function, which can shrink coefficients exactly to zero.

Geometrically, the constraint has corners, so the optimum often lands on an axis. Algebraically, a feature whose correlation with the residual signal is too small can be set to zero.

LASSO is useful because selection happens during model training. But with highly correlated predictors, it may arbitrarily choose one and drop others, so the selected set should not always be interpreted as the one true set of important variables.

## My practical grouping

I think of these methods like this:

- Filter methods: variance thresholding.
- Wrapper methods: RFE and best subset selection.
- Statistical tests: drop-in-deviance.
- Redundancy reduction: variable clustering.
- Embedded methods: LASSO.

The right method depends on the model goal. For interpretation, stability and domain logic matter. For prediction, honest validation matters. For production, simpler and more stable feature sets are often worth more than a tiny metric improvement.
