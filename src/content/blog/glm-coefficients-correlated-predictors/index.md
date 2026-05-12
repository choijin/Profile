---
title: "Understanding GLM Coefficients When Predictors Are Correlated"
description: "How GLM coefficients are interpreted, and why correlated predictors can make that interpretation unstable."
date: "2026-05-12"
category: "Data Science"
tags: ["GLM", "Coefficients", "Multicollinearity"]
---

In a generalized linear model, the fitted surface represents the conditional mean of the response:

<div class="math-block">
mu(x) = E[Y | X = x]
</div>

The coefficient vector determines how predictors influence that conditional mean through the link function:

<div class="math-block">
g(mu_i) = X_i beta
</div>

The model does not predict a single realized outcome for a given input. It assumes a conditional distribution for the response and estimates coefficients so the observed data is likely under that distribution.

## Continuous predictors

For a continuous predictor, the coefficient describes the change in the transformed conditional mean for a one-unit change in the predictor.

With a log link:

<div class="math-block">
eta = log(E[Y | X])
</div>

A one-unit increase in `X_j` changes log expected response by `beta_j`. On the mean scale, exponentiating the coefficient gives a multiplicative effect:

<div class="math-block">
E[Y | X_j + 1] / E[Y | X_j] = exp(beta_j)
</div>

That multiplicative interpretation is one reason log links are common in pricing and severity models.

## Categorical predictors

For a categorical variable, each dummy coefficient is interpreted relative to a reference level.

If color has levels Red and Blue, with Red as the reference:

<div class="math-block">
beta_blue = link(E[Y | Color = Blue]) - link(E[Y | Color = Red])
</div>

With multiple categorical variables, the baseline is the joint reference category. For example, if Region = North and Color = Red are both references, then a South coefficient is interpreted as the difference from North while holding the other variables at their reference or specified values.

## Why multicollinearity matters

Multicollinearity is partly a matrix problem. In OLS, the model depends on inverting `X'X`; in GLMs, the fitting process depends on matrices like `X'WX`. If columns in `X` are linearly dependent, the matrix becomes singular. If they are nearly dependent, the inverse becomes unstable.

The practical result is inflated standard errors and unstable coefficient estimates. A variable can have a real relationship with the target but still receive a high p-value because its standard error is large. Small changes to the data or model specification can also cause large swings in coefficient estimates.

This is why multicollinearity hurts interpretation more than prediction. Correlated predictors can still produce stable fitted values because the shared signal may be spread across variables. But the individual coefficients can become fragile.

## Why correlation changes the story

When predictors overlap, the model is trying to assign shared signal across multiple columns. The fitted prediction may remain stable, but the individual coefficients can become unstable.

That means coefficient interpretation should be more cautious when predictors are strongly correlated. A sign flip, unexpectedly large coefficient, or high standard error may be a symptom of the design matrix rather than a meaningful business effect.

## How I think about it

When the goal is prediction, multicollinearity is not always a reason to remove variables. When the goal is interpretation, pricing, or model explanation, it matters more.

I would usually check coefficient stability, standard errors, VIF, condition number, and whether signs or magnitudes change under small perturbations. If the coefficient itself is part of the business explanation, it needs to be stable enough to trust.
