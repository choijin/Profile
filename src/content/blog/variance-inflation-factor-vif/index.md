---
title: "Variance Inflation Factor: Why Adding a Constant Matters"
description: "How VIF diagnoses multicollinearity, why it affects standard errors, and why the auxiliary regression should include an intercept."
date: "2026-05-10"
category: "Data Science"
tags: ["VIF", "Multicollinearity", "Regression"]
---

Variance Inflation Factor, or VIF, is a diagnostic for multicollinearity.

For a given predictor, VIF measures how much the variance of its estimated coefficient is inflated because that predictor can be explained by the other predictors.

## How VIF is calculated

For each predictor `X_j`, regress it on all the other predictors and calculate the R-squared from that auxiliary regression:

<div class="math-block">
X_j = alpha + X_{-j} gamma + error
</div>

Then compute:

<div class="math-block">
VIF_j = 1 / (1 - R_j^2)
</div>

If `R_j^2` is close to 0, the predictor is not well explained by the other predictors and VIF is close to 1. If `R_j^2` is close to 1, the predictor is highly redundant and VIF becomes large.

Rules of thumb vary, but values above 5 or 10 are often treated as warning signs.

## Relationship to standard error

VIF connects directly to standard error. In linear regression, the standard error for a coefficient can be written in a way that includes VIF:

<div class="math-block">
SE(beta_j) = sqrt((sigma^2 / S_jj) * VIF_j)
</div>

So high VIF does not necessarily mean the coefficient is wrong. It means the coefficient is estimated with more uncertainty.

That wider uncertainty leads to wider confidence intervals and can produce higher p-values, even when the predictor has a meaningful relationship with the target.

## VIF and p-values

VIF and p-values are related through standard error, but they are not the same thing.

- High VIF with low p-value can happen when the effect is strong enough to remain significant despite collinearity.
- Low VIF with high p-value means the variable may simply have weak predictive value, not a collinearity problem.

VIF diagnoses redundancy among predictors. It does not directly diagnose whether a predictor matters.

## Why adding a constant matters

The auxiliary regression used in VIF should include a constant/intercept.

This is important because the usual R-squared definition compares the fitted model against a baseline model that predicts the mean of the response:

<div class="math-block">
R^2 = 1 - SSE / SST
</div>

where:

<div class="math-block">
SST = sum_i (y_i - y_bar)^2
</div>

The intercept aligns fitted values with the mean baseline. Without an intercept, the model is effectively being forced through zero, and the R-squared comparison can become distorted.

That distortion matters because VIF is a direct transformation of `R_j^2`. If the auxiliary regression's R-squared is inflated or otherwise miscomputed, the VIF will also be misleading.

This is why, when using `statsmodels`, it is important to add a constant before calculating VIF.

## Controls and VIF

Adding controls can only keep R-squared the same or increase it in the auxiliary regression. Since:

<div class="math-block">
VIF_j = 1 / (1 - R_j^2)
</div>

VIF with controls will generally be greater than or equal to VIF without controls.

That does not automatically mean controls are bad. It means VIF must be interpreted in the context of the model being trained. If the model includes controls, the VIF should be assessed in that same trained setting.

## Practical takeaway

VIF is most useful when coefficient interpretation matters. It tells me when a coefficient may be unstable because the predictor overlaps too much with other predictors.

But VIF is not a feature deletion rule. It is a warning light: check stability, business meaning, p-values, standard errors, and whether the variable is needed for prediction or interpretation.
