---
title: "Variance Inflation Factor: Why Adding a Constant Matters"
description: "How VIF diagnoses multicollinearity, why it affects standard errors, and why the auxiliary regression should include an intercept."
date: "2026-05-10"
category: "Data Science"
tags: ["VIF", "Multicollinearity", "Regression"]
---

Variance Inflation Factor (VIF) can be used as a feature reduction method and also a diagnosis to detect multicollinearity. 

As a rule of thumb, a VIF value greater than 10 (some use a threshold of 5) suggests high multicollinearity and may warrant further investigation or corrective measures.

## The basic idea

To calculate VIF for a predictor, we temporarily make that predictor the target.

If I want the VIF for `X_j`, I regress `X_j` on all the other predictors:

```text
X_j = alpha + X_{-j} gamma + error
```

Then I take the R-squared from that auxiliary regression and calculate:

```text
VIF_j = 1 / (1 - R_j^2)
```

If the other predictors cannot explain `X_j`, then `R_j^2` is low and VIF stays close to 1.

```text
If R_j^2 = 0:
VIF_j = 1 / (1 - 0) = 1
```

If the other predictors explain `X_j` really well, then `R_j^2` gets close to 1 and VIF gets large.

```text
If R_j^2 = 0.90:
VIF_j = 1 / (1 - 0.90) = 10
```

That is the whole intuition: if a predictor can be reconstructed from the other predictors, its coefficient will be harder to estimate independently.

## Why VIF shows up through standard errors

High VIF does not automatically mean the coefficient is wrong. It means the coefficient is estimated with more uncertainty.

That uncertainty shows up through the standard error:

```text
SE_with_collinearity(beta_j)
  = SE_without_collinearity(beta_j) * sqrt(VIF_j)
```

We can see that VIF and SE are **directly related**. So if `VIF = 9`, the standard error is inflated by:

```text
sqrt(9) = 3
```

Larger standard errors make confidence intervals wider and p-values larger. A variable can have a real relationship with the target and still look statistically weak if its information overlaps heavily with other variables.

## The constant is not optional

One detail I want to remember: when calculating VIF, the auxiliary regression should include a constant.

This matters because the usual R-squared compares the fitted model against a baseline model that predicts the mean.

```text
R^2 = 1 - SSE / SST

SST = sum_i (y_i - y_bar)^2
```

The intercept is what lets the fitted values align with that mean baseline. Without an intercept, the auxiliary regression is effectively forced through zero. That can distort `R^2`, and because VIF is just a transformation of `R^2`, it can distort VIF too.

This is especially easy to miss in `statsmodels`, because you often need to explicitly add the constant yourself before calculating VIF.

```text
X_with_constant = add_constant(X)
```

The point is not that the constant is interesting as a variable. The point is that the auxiliary regression needs the right baseline.

## Controls can change VIF

Another detail from my notes that I like: VIF should be calculated in the design matrix that matches the model I am actually fitting.

If I add controls, the auxiliary regression for `X_j` now has more variables available to explain `X_j`. R-squared can only stay the same or increase when predictors are added. So VIF can only stay the same or increase too.

```text
More variables in auxiliary regression
  -> R_j^2 same or higher
  -> VIF_j same or higher
```

That means a predictor may look fine without controls and become collinear after controls are added. But if VIF is acceptable with the controls included, then the version without controls is usually not the harder case.

## VIF and p-values are related, but not the same

I think of VIF and p-values as connected through standard error.

A high VIF can push a p-value up by inflating the standard error. But a high VIF with a low p-value can still happen if the effect is strong enough. And a low VIF with a high p-value may simply mean the variable does not add much signal.

So VIF tells me about redundancy. It does not tell me whether the variable matters.

## How I would use it

I would pay most attention to VIF when the coefficient itself is going to be interpreted.

For a pure prediction model, correlated variables may not be a serious issue if validation performance is stable. But for a model where coefficients are used to explain effects, support business decisions, or build rating factors, VIF becomes more important.

My practical takeaway: add the constant, calculate VIF in the same design matrix the model is trained on, and treat high VIF as a reason to inspect stability rather than as an automatic reason to drop a variable.
