---
title: "Understanding GLM Coefficients When Predictors Are Correlated"
description: "How multicollinearity, controls, and offsets change coefficient interpretation in GLMs."
date: "2026-05-12"
category: "Data Science"
tags: ["GLM", "Multicollinearity", "Controls"]
---

In a generalized linear model, the fitted surface represents the conditional mean of the response:

`mu(x) = E[Y | X = x]`

The coefficient vector determines how predictors influence that conditional mean through the link function. With a log link, for example, a one-unit change in a continuous predictor changes the log of the expected response. For a categorical predictor, each dummy coefficient is interpreted relative to the reference category, with the reference level absorbed into the intercept.

That interpretation becomes harder when predictors are correlated.

## Why multicollinearity matters

Multicollinearity is partly a matrix problem. In OLS, the model depends on inverting `X'X`; in GLMs, the fitting process depends on matrices like `X'WX`. If columns in `X` are linearly dependent, the matrix becomes singular. If they are nearly dependent, the inverse becomes unstable.

The practical result is inflated standard errors and unstable coefficient estimates. A variable can have a real relationship with the target but still receive a high p-value because its standard error is large. Small changes to the data or model specification can also cause large swings in coefficient estimates.

This is why multicollinearity hurts interpretation more than prediction. Correlated predictors can still produce stable fitted values because the shared signal may be spread across variables. But the individual coefficients can become fragile.

## Controls and omitted variable bias

Controls are included to isolate the effect of variables of interest. If a territory variable affects claim frequency and is correlated with driver age, leaving territory out can cause driver age to absorb part of the territory effect. That is omitted variable bias.

Including territory as a control allows the model to estimate the driver age effect while accounting for territory. But controls can also introduce multicollinearity, especially when large categorical variables overlap with other predictors.

In that case, the model may have trouble deciding which variable deserves credit for shared signal.

## Offsets as structural adjustment

An offset handles a different case: when the effect is treated as known rather than estimated.

For example, if territory and symbol factors were estimated in a separate analysis, an insurance model can include the log of those factors as an offset. This adjusts the target structurally before estimating the remaining coefficients.

The distinction is useful:

- A control variable is estimated jointly with the rest of the model.
- An offset is fixed and not estimated.

Controls are flexible, but they can compete with other predictors. Offsets are less flexible, but they can avoid adding another set of unstable coefficients when the adjustment is already known.

## How I think about it

When the goal is prediction, multicollinearity is not always a reason to remove variables. When the goal is interpretation, pricing, or model explanation, it matters more.

I would usually check VIF, coefficient stability, condition number, and whether signs or magnitudes change under small perturbations. If the issue is caused by known structural factors, an offset may be cleaner than estimating another set of controls.
